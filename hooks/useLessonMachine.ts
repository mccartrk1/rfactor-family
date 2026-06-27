'use client'
// hooks/useLessonMachine.ts
//
// Drives the pure LessonNavigator reducer and adds React-specific concerns:
// progress saves, scenario fetching, pre-generation, routing.
//
// The client component only uses this hook. Zero business logic lives in JSX.
//
// Split of responsibilities:
//   LessonNavigator (domain/services/) — WHAT transitions are valid and how state changes
//   useLessonMachine (hooks/)          — WHEN to trigger transitions and side effects
//   LessonClient (app/lesson/)         — HOW to render the current state

import { useReducer, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { lessonReduce, INITIAL_STATE, LessonAction } from '@/domain/services/LessonNavigator'
import type { LessonMachineState } from '@/domain/services/LessonNavigator'
import { getIconData, CONTEXT_ICON_MAP } from '@/lib/scenario-icons'
import type { IconEntry } from '@/lib/scenario-icons'
import type { ScenarioPayload } from '@/application/ports/IScenarioGenerator'
import type { Lesson, Week } from '@/types'

// The shape the lesson client actually uses
export interface LessonMachine {
  state: LessonMachineState

  // Current derived values (computed once here, not recomputed in render)
  weekColor: string
  chunk: Lesson['chunks'][number] | undefined
  isLastChunk: boolean
  vtype: string
  isLastSeal: boolean
  iconData: IconEntry
  scenario: ScenarioPayload | null

  // Dispatchers — each maps to one or more reducer actions + optional side effects
  dispatch: (action: LessonAction) => void
  goBack: () => void
  startLesson: () => void
  tapCheck: (index: number) => void
  advanceChunk: () => void
  tapSeal: (index: number) => void
  advanceSeal: () => void
  generateScenario: (attempt?: number) => void
  tryAnother: () => void
  completeWeek: () => void
  proceedToChallenge: () => void
  nextScreen: () => void
  toggleParentNote: () => void
  setChallengeResponse: (response: 'yes' | 'not-yet') => void
  pickPath: (path: 'discipline' | 'default') => void
}

interface UseLessonMachineProps {
  lesson: Lesson
  week: Week
  childId: string
  weekNumber: number
}

// Scenario fallback shown when AI is unavailable or rate-limited
const FALLBACK_SCENARIO: ScenarioPayload = {
  setup: 'You are at home and something just did not go the way you planned.',
  event: 'You have a choice to make right now.',
  disciplinePath: { choice: 'You take a breath and ask: what can I do right now?', result: 'Things get a little better.' },
  defaultPath: { choice: 'You react without thinking.', result: 'Things get worse before they get better.' },
  question: 'What would you do in this moment?',
}

export function useLessonMachine({
  lesson,
  week,
  childId,
  weekNumber,
}: UseLessonMachineProps): LessonMachine {
  const router = useRouter()
  const [state, dispatch] = useReducer(lessonReduce, INITIAL_STATE)

  // Scenario is managed outside the reducer because it's async data,
  // not a synchronous state transition.
  const scenarioRef = useRef<ScenarioPayload | null>(null)

  // Debounced progress save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveProgress = useCallback((payload: object) => {
    if (!childId) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/progress/${childId}/${weekNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }, 400)
  }, [childId, weekNumber])

  // ─── Side-effect aware dispatchers ──────────────────────────────────────────

  const goBack = useCallback(() => {
    if (state.step === 'intro') {
      router.push('/dashboard')
      return
    }
    dispatch({ type: 'BACK' })
  }, [state.step, router])

  const startLesson = useCallback(() => {
    dispatch({ type: 'START_LESSON' })
    saveProgress({ currentStep: 'teaching', chunkIndex: 0 })
  }, [saveProgress])

  const tapCheck = useCallback((index: number) => {
    dispatch({ type: 'TAP_CHECK', optionIndex: index })
  }, [])

  const advanceChunk = useCallback(() => {
    const totalChunks = lesson.chunks.length
    const isLast = state.chunkIndex >= totalChunks - 1
    dispatch({ type: 'ADVANCE_CHUNK', totalChunks })
    if (isLast) {
      saveProgress({ currentStep: 'seal', chunkIndex: state.chunkIndex })
    } else {
      saveProgress({ currentStep: 'teaching', chunkIndex: state.chunkIndex + 1 })
    }
  }, [state.chunkIndex, lesson.chunks.length, saveProgress])

  const tapSeal = useCallback((index: number) => {
    dispatch({ type: 'TAP_SEAL', optionIndex: index })
  }, [])

  const advanceSeal = useCallback(() => {
    dispatch({ type: 'ADVANCE_SEAL', totalSeals: lesson.seal.length })
  }, [lesson.seal.length])

  const generateScenario = useCallback(async (attempt = 0) => {
    dispatch({ type: 'START_GENERATING' })
    saveProgress({ currentStep: 'seal' })

    const res = await fetch('/api/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, weekNumber, attempt }),
    }).catch(() => null)

    if (!res) {
      scenarioRef.current = FALLBACK_SCENARIO
      dispatch({ type: 'SCENARIO_READY', error: 'Network error — showing a practice scenario.' })
      return
    }

    const data = await res.json().catch(() => ({}))

    if (res.status === 429) {
      scenarioRef.current = FALLBACK_SCENARIO
      dispatch({ type: 'SCENARIO_READY', error: data.error || 'Daily limit reached.' })
      return
    }

    if (!res.ok) {
      // Never surface a raw server error to a parent or child. The fallback
      // scenario is a complete, usable practice moment — present it as intended,
      // not as a failure.
      scenarioRef.current = FALLBACK_SCENARIO
      dispatch({ type: 'SCENARIO_READY', error: 'Showing a practice scenario.' })
      return
    }

    scenarioRef.current = data.scenario
    dispatch({ type: 'SCENARIO_READY' })
  }, [childId, weekNumber, saveProgress])

  const tryAnother = useCallback(() => {
    const nextAttempt = state.scenarioCount
    dispatch({ type: 'TRY_ANOTHER' })
    generateScenario(nextAttempt)
  }, [state.scenarioCount, generateScenario])

  const completeWeek = useCallback(() => {
    dispatch({ type: 'COMPLETE_WEEK' })
    saveProgress({ completed: true, currentStep: 'complete', chunkIndex: 0 })
    // Fire-and-forget pre-generation
    if (weekNumber < 13) {
      fetch('/api/scenario/pregenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, completedWeekNumber: weekNumber }),
      }).catch(() => {})
    }
  }, [childId, weekNumber, saveProgress])

  const proceedToChallenge = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_CHALLENGE' })
  }, [])

  const nextScreen = useCallback(() => {
    if (weekNumber === 13 && state.step === 'pledge') {
      // Transition reducer to 'complete' step — shows pledge card + celebration
      dispatch({ type: 'NEXT_SCREEN' })
    } else if (weekNumber === 13 && state.step === 'complete') {
      // FIX: Route to celebration page instead of dashboard
      // The /complete page sends the completion email and shows the certificate
      router.push(`/complete?child=${childId}`)
    } else {
      router.push('/dashboard')
    }
  }, [weekNumber, state.step, childId, router])

  const toggleParentNote = useCallback(() => {
    dispatch({ type: 'TOGGLE_PARENT_NOTE' })
  }, [])

  const setChallengeResponse = useCallback((response: 'yes' | 'not-yet') => {
    dispatch({ type: 'SET_CHALLENGE_RESPONSE', response })
    if (response === 'yes') {
      fetch(`/api/challenges/${childId}/${weekNumber - 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      }).catch(() => {})
    }
  }, [childId, weekNumber])

  const pickPath = useCallback((path: 'discipline' | 'default') => {
    dispatch({ type: 'PICK_PATH', path })
  }, [])

  // ─── Derived values ──────────────────────────────────────────────────────────

  const chunk = lesson.chunks[state.chunkIndex]
  const isLastChunk = state.chunkIndex >= lesson.chunks.length - 1
  const vtype = chunk?.visual || 'standard'
  const isLastSeal = state.sealIndex >= lesson.seal.length - 1
  const scenario = scenarioRef.current
  const iconData = scenario ? getIconData(scenario) : CONTEXT_ICON_MAP.other

  return {
    state,
    weekColor: week.color,
    chunk,
    isLastChunk,
    vtype,
    isLastSeal,
    iconData,
    scenario,
    dispatch,
    goBack,
    startLesson,
    tapCheck,
    advanceChunk,
    tapSeal,
    advanceSeal,
    generateScenario,
    tryAnother,
    completeWeek,
    proceedToChallenge,
    nextScreen,
    toggleParentNote,
    setChallengeResponse,
    pickPath,
  }
}
