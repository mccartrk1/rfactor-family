// domain/services/LessonNavigator.ts
//
// Pure state machine for lesson navigation.
// No React. No fetches. No side effects. Input: state + action → output: new state.
//
// This is the business rule layer for "how a lesson flows."
// Testable without a browser, without a database, without React.
//
// The useLessonMachine hook in /hooks/ drives this reducer and adds React-specific
// concerns (side effects, progress saves, scenario fetches).

export type LessonStep =
  | 'intro'
  | 'teaching'
  | 'seal'
  | 'loading'
  | 'scenario'
  | 'challenge'
  | 'pledge'
  | 'complete'

export interface LessonMachineState {
  step: LessonStep
  chunkIndex: number
  checkAnswer: number | null    // which option was tapped, null = unanswered
  sealIndex: number
  sealAnswer: number | null     // null = unanswered
  scenarioCount: number         // how many times "Try another" was used
  choice: 'discipline' | 'default' | null
  parentNoteOpen: boolean
  challengeResponse: 'yes' | 'not-yet' | null
  apiError: string | null
}

export type LessonAction =
  | { type: 'BACK' }
  | { type: 'START_LESSON' }
  | { type: 'TAP_CHECK'; optionIndex: number }
  | { type: 'ADVANCE_CHUNK'; totalChunks: number }
  | { type: 'TAP_SEAL'; optionIndex: number }
  | { type: 'ADVANCE_SEAL'; totalSeals: number }
  | { type: 'START_GENERATING' }
  | { type: 'SCENARIO_READY'; error?: string }
  | { type: 'PICK_PATH'; path: 'discipline' | 'default' }
  | { type: 'TRY_ANOTHER' }
  | { type: 'PROCEED_TO_CHALLENGE' }
  | { type: 'COMPLETE_WEEK' }
  | { type: 'NEXT_SCREEN' }                 // pledge → complete or dashboard
  | { type: 'TOGGLE_PARENT_NOTE' }
  | { type: 'SET_CHALLENGE_RESPONSE'; response: 'yes' | 'not-yet' }

export const INITIAL_STATE: LessonMachineState = {
  step: 'intro',
  chunkIndex: 0,
  checkAnswer: null,
  sealIndex: 0,
  sealAnswer: null,
  scenarioCount: 1,
  choice: null,
  parentNoteOpen: false,
  challengeResponse: null,
  apiError: null,
}

// Pure reducer. Every transition is explicit and traceable.
export function lessonReduce(
  state: LessonMachineState,
  action: LessonAction
): LessonMachineState {
  switch (action.type) {

    case 'START_LESSON':
      return { ...state, step: 'teaching', chunkIndex: 0, checkAnswer: null }

    case 'TAP_CHECK':
      // Only register the first tap — prevent changing answer after selection
      if (state.checkAnswer !== null) return state
      return { ...state, checkAnswer: action.optionIndex }

    case 'ADVANCE_CHUNK': {
      const isLast = state.chunkIndex >= action.totalChunks - 1
      if (isLast) {
        return { ...state, step: 'seal', sealIndex: 0, sealAnswer: null }
      }
      return { ...state, chunkIndex: state.chunkIndex + 1, checkAnswer: null }
    }

    case 'TAP_SEAL':
      if (state.sealAnswer !== null) return state
      return { ...state, sealAnswer: action.optionIndex }

    case 'ADVANCE_SEAL': {
      const isLast = state.sealIndex >= action.totalSeals - 1
      if (isLast) {
        return { ...state, step: 'loading' }
      }
      return { ...state, sealIndex: state.sealIndex + 1, sealAnswer: null }
    }

    case 'START_GENERATING':
      return { ...state, step: 'loading', choice: null, apiError: null }

    case 'SCENARIO_READY':
      return {
        ...state,
        step: 'scenario',
        apiError: action.error ?? null,
      }

    case 'PICK_PATH':
      return { ...state, choice: action.path }

    case 'TRY_ANOTHER':
      return {
        ...state,
        step: 'loading',
        scenarioCount: state.scenarioCount + 1,
        choice: null,
        apiError: null,
      }

    case 'PROCEED_TO_CHALLENGE':
      return { ...state, step: 'challenge' }

    case 'COMPLETE_WEEK':
      return { ...state, step: 'pledge' }

    case 'NEXT_SCREEN': {
      // pledge → complete (week 13) handled by caller passing the result
      if (state.step === 'pledge') return { ...state, step: 'complete' }
      return state
    }

    case 'BACK': {
      switch (state.step) {
        case 'teaching':
          if (state.chunkIndex > 0) {
            return { ...state, chunkIndex: state.chunkIndex - 1, checkAnswer: null }
          }
          return { ...state, step: 'intro' }
        case 'seal':
          if (state.sealIndex > 0) {
            return { ...state, sealIndex: state.sealIndex - 1, sealAnswer: null }
          }
          return { ...state, step: 'teaching', checkAnswer: null }
        case 'loading':
          return { ...state, step: 'seal' }
        case 'scenario':
          return { ...state, step: 'seal', sealAnswer: null }
        case 'challenge':
          return { ...state, step: 'scenario', choice: null }
        case 'pledge':
          return { ...state, step: 'challenge' }
        case 'complete':
          return { ...state, step: 'pledge' }
        default:
          return state // intro: navigation handled by hook (router.push)
      }
    }

    case 'TOGGLE_PARENT_NOTE':
      return { ...state, parentNoteOpen: !state.parentNoteOpen }

    case 'SET_CHALLENGE_RESPONSE':
      return { ...state, challengeResponse: action.response }

    default:
      return state
  }
}

// ─── Derived state helpers ─────────────────────────────────────────────────────
// Pure functions the UI can call instead of recomputing inline.

export function isSealAnswered(state: LessonMachineState): boolean {
  return state.sealAnswer !== null
}

export function isSealCorrect(
  state: LessonMachineState,
  correctAnswer: number
): boolean {
  return state.sealAnswer !== null && state.sealAnswer === correctAnswer
}

export function isCheckCorrect(
  state: LessonMachineState,
  correctAnswer: number
): boolean {
  return state.checkAnswer !== null && state.checkAnswer === correctAnswer
}
