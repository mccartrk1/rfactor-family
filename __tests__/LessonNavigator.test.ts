// __tests__/LessonNavigator.test.ts
//
// Unit tests for the pure LessonNavigator reducer.
// No DOM. No React. No database. Just state + action → state.
//
// Why this matters: every lesson transition is tested here.
// Before deployment, run: npx jest __tests__/LessonNavigator.test.ts
//
// Install: npm install --save-dev jest @types/jest ts-jest
// Config in jest.config.js:
//   module.exports = { preset: 'ts-jest', testEnvironment: 'node',
//     moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' } }

import {
  lessonReduce,
  INITIAL_STATE,
  LessonMachineState,
  isSealAnswered,
  isSealCorrect,
  isCheckCorrect,
} from '../domain/services/LessonNavigator'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function from(partial: Partial<LessonMachineState>): LessonMachineState {
  return { ...INITIAL_STATE, ...partial }
}

function dispatch(state: LessonMachineState, ...actions: Parameters<typeof lessonReduce>[1][]) {
  return actions.reduce((s, action) => lessonReduce(s, action), state)
}

// ─── Initial state ────────────────────────────────────────────────────────────

describe('INITIAL_STATE', () => {
  test('starts at intro step', () => {
    expect(INITIAL_STATE.step).toBe('intro')
  })

  test('all indices start at 0', () => {
    expect(INITIAL_STATE.chunkIndex).toBe(0)
    expect(INITIAL_STATE.sealIndex).toBe(0)
  })

  test('all answers start as null', () => {
    expect(INITIAL_STATE.checkAnswer).toBeNull()
    expect(INITIAL_STATE.sealAnswer).toBeNull()
  })

  test('choice starts as null', () => {
    expect(INITIAL_STATE.choice).toBeNull()
  })
})

// ─── START_LESSON ─────────────────────────────────────────────────────────────

describe('START_LESSON', () => {
  test('transitions from intro to teaching', () => {
    const state = lessonReduce(INITIAL_STATE, { type: 'START_LESSON' })
    expect(state.step).toBe('teaching')
  })

  test('resets chunkIndex and checkAnswer on start', () => {
    const dirty = from({ step: 'intro', chunkIndex: 3, checkAnswer: 1 })
    const state = lessonReduce(dirty, { type: 'START_LESSON' })
    expect(state.chunkIndex).toBe(0)
    expect(state.checkAnswer).toBeNull()
  })
})

// ─── TAP_CHECK ────────────────────────────────────────────────────────────────

describe('TAP_CHECK', () => {
  const teaching = from({ step: 'teaching' })

  test('records the tapped option index', () => {
    const state = lessonReduce(teaching, { type: 'TAP_CHECK', optionIndex: 1 })
    expect(state.checkAnswer).toBe(1)
  })

  test('ignores second tap after first (prevents changing answer)', () => {
    const state = dispatch(teaching,
      { type: 'TAP_CHECK', optionIndex: 0 },
      { type: 'TAP_CHECK', optionIndex: 1 },  // should be ignored
    )
    expect(state.checkAnswer).toBe(0)
  })

  test('tapping option 0 is recorded (not treated as falsy)', () => {
    const state = lessonReduce(teaching, { type: 'TAP_CHECK', optionIndex: 0 })
    expect(state.checkAnswer).toBe(0)
  })
})

// ─── ADVANCE_CHUNK ────────────────────────────────────────────────────────────

describe('ADVANCE_CHUNK', () => {
  test('advances to next chunk and clears checkAnswer', () => {
    const state = from({ step: 'teaching', chunkIndex: 0, checkAnswer: 1 })
    const next = lessonReduce(state, { type: 'ADVANCE_CHUNK', totalChunks: 3 })
    expect(next.chunkIndex).toBe(1)
    expect(next.checkAnswer).toBeNull()
    expect(next.step).toBe('teaching')
  })

  test('transitions to seal on last chunk', () => {
    const state = from({ step: 'teaching', chunkIndex: 2 })
    const next = lessonReduce(state, { type: 'ADVANCE_CHUNK', totalChunks: 3 })
    expect(next.step).toBe('seal')
    expect(next.sealIndex).toBe(0)
    expect(next.sealAnswer).toBeNull()
  })

  test('single-chunk lesson goes directly to seal', () => {
    const state = from({ step: 'teaching', chunkIndex: 0 })
    const next = lessonReduce(state, { type: 'ADVANCE_CHUNK', totalChunks: 1 })
    expect(next.step).toBe('seal')
  })
})

// ─── TAP_SEAL ─────────────────────────────────────────────────────────────────

describe('TAP_SEAL', () => {
  const seal = from({ step: 'seal' })

  test('records seal answer', () => {
    const state = lessonReduce(seal, { type: 'TAP_SEAL', optionIndex: 1 })
    expect(state.sealAnswer).toBe(1)
  })

  test('ignores second tap (no changing seal answer)', () => {
    const state = dispatch(seal,
      { type: 'TAP_SEAL', optionIndex: 0 },
      { type: 'TAP_SEAL', optionIndex: 1 },
    )
    expect(state.sealAnswer).toBe(0)
  })
})

// ─── ADVANCE_SEAL ─────────────────────────────────────────────────────────────

describe('ADVANCE_SEAL', () => {
  test('advances to next seal question and clears sealAnswer', () => {
    const state = from({ step: 'seal', sealIndex: 0, sealAnswer: 1 })
    const next = lessonReduce(state, { type: 'ADVANCE_SEAL', totalSeals: 2 })
    expect(next.sealIndex).toBe(1)
    expect(next.sealAnswer).toBeNull()
    expect(next.step).toBe('seal')
  })

  test('transitions to loading on last seal', () => {
    const state = from({ step: 'seal', sealIndex: 1 })
    const next = lessonReduce(state, { type: 'ADVANCE_SEAL', totalSeals: 2 })
    expect(next.step).toBe('loading')
  })

  test('single seal lesson goes directly to loading', () => {
    const state = from({ step: 'seal', sealIndex: 0 })
    const next = lessonReduce(state, { type: 'ADVANCE_SEAL', totalSeals: 1 })
    expect(next.step).toBe('loading')
  })
})

// ─── SCENARIO_READY / PICK_PATH ───────────────────────────────────────────────

describe('SCENARIO_READY', () => {
  test('transitions from loading to scenario', () => {
    const state = from({ step: 'loading' })
    const next = lessonReduce(state, { type: 'SCENARIO_READY' })
    expect(next.step).toBe('scenario')
    expect(next.apiError).toBeNull()
  })

  test('records API error but still shows scenario (fallback)', () => {
    const state = from({ step: 'loading' })
    const next = lessonReduce(state, { type: 'SCENARIO_READY', error: 'Rate limited' })
    expect(next.step).toBe('scenario')
    expect(next.apiError).toBe('Rate limited')
  })
})

describe('PICK_PATH', () => {
  test('records discipline choice', () => {
    const state = from({ step: 'scenario' })
    const next = lessonReduce(state, { type: 'PICK_PATH', path: 'discipline' })
    expect(next.choice).toBe('discipline')
  })

  test('records default choice', () => {
    const state = from({ step: 'scenario' })
    const next = lessonReduce(state, { type: 'PICK_PATH', path: 'default' })
    expect(next.choice).toBe('default')
  })

  test('allows changing path (no lock)', () => {
    const state = dispatch(
      from({ step: 'scenario' }),
      { type: 'PICK_PATH', path: 'discipline' },
      { type: 'PICK_PATH', path: 'default' },
    )
    expect(state.choice).toBe('default')
  })
})

// ─── COMPLETE_WEEK / PLEDGE / COMPLETE ────────────────────────────────────────

describe('COMPLETE_WEEK → NEXT_SCREEN', () => {
  test('COMPLETE_WEEK goes to pledge', () => {
    const state = from({ step: 'challenge' })
    const next = lessonReduce(state, { type: 'COMPLETE_WEEK' })
    expect(next.step).toBe('pledge')
  })

  test('NEXT_SCREEN from pledge goes to complete', () => {
    const state = from({ step: 'pledge' })
    const next = lessonReduce(state, { type: 'NEXT_SCREEN' })
    expect(next.step).toBe('complete')
  })

  test('NEXT_SCREEN from non-pledge step does nothing', () => {
    const state = from({ step: 'scenario' })
    const next = lessonReduce(state, { type: 'NEXT_SCREEN' })
    expect(next.step).toBe('scenario')
  })
})

// ─── TRY_ANOTHER ─────────────────────────────────────────────────────────────

describe('TRY_ANOTHER', () => {
  test('increments scenarioCount and resets to loading', () => {
    const state = from({ step: 'scenario', scenarioCount: 1, choice: 'discipline' })
    const next = lessonReduce(state, { type: 'TRY_ANOTHER' })
    expect(next.step).toBe('loading')
    expect(next.scenarioCount).toBe(2)
    expect(next.choice).toBeNull()
    expect(next.apiError).toBeNull()
  })
})

// ─── BACK navigation ──────────────────────────────────────────────────────────

describe('BACK', () => {
  test('from teaching chunk > 0 → decrements chunkIndex', () => {
    const state = from({ step: 'teaching', chunkIndex: 2 })
    const next = lessonReduce(state, { type: 'BACK' })
    expect(next.chunkIndex).toBe(1)
    expect(next.checkAnswer).toBeNull()
  })

  test('from teaching chunk 0 → back to intro', () => {
    const state = from({ step: 'teaching', chunkIndex: 0 })
    const next = lessonReduce(state, { type: 'BACK' })
    expect(next.step).toBe('intro')
  })

  test('from seal sealIndex > 0 → decrements sealIndex', () => {
    const state = from({ step: 'seal', sealIndex: 1 })
    const next = lessonReduce(state, { type: 'BACK' })
    expect(next.sealIndex).toBe(0)
    expect(next.sealAnswer).toBeNull()
  })

  test('from seal sealIndex 0 → back to teaching', () => {
    const state = from({ step: 'seal', sealIndex: 0 })
    const next = lessonReduce(state, { type: 'BACK' })
    expect(next.step).toBe('teaching')
  })

  test('from loading → back to seal', () => {
    const state = from({ step: 'loading' })
    const next = lessonReduce(state, { type: 'BACK' })
    expect(next.step).toBe('seal')
  })

  test('from scenario → back to seal, resets choice', () => {
    const state = from({ step: 'scenario', choice: 'discipline' })
    const next = lessonReduce(state, { type: 'BACK' })
    expect(next.step).toBe('seal')
    expect(next.sealAnswer).toBeNull()
  })

  test('from challenge → back to scenario', () => {
    const next = lessonReduce(from({ step: 'challenge' }), { type: 'BACK' })
    expect(next.step).toBe('scenario')
    expect(next.choice).toBeNull()
  })

  test('from pledge → back to challenge', () => {
    const next = lessonReduce(from({ step: 'pledge' }), { type: 'BACK' })
    expect(next.step).toBe('challenge')
  })

  test('from intro → no-op (routing handled by hook)', () => {
    const next = lessonReduce(from({ step: 'intro' }), { type: 'BACK' })
    expect(next.step).toBe('intro')
  })
})

// ─── Derived state helpers ────────────────────────────────────────────────────

describe('isSealAnswered', () => {
  test('false when sealAnswer is null', () => {
    expect(isSealAnswered(from({ sealAnswer: null }))).toBe(false)
  })
  test('true when sealAnswer is 0 (not falsy!)', () => {
    expect(isSealAnswered(from({ sealAnswer: 0 }))).toBe(true)
  })
  test('true when sealAnswer is 1', () => {
    expect(isSealAnswered(from({ sealAnswer: 1 }))).toBe(true)
  })
})

describe('isSealCorrect', () => {
  test('false when not answered', () => {
    expect(isSealCorrect(from({ sealAnswer: null }), 1)).toBe(false)
  })
  test('true when answer matches correct', () => {
    expect(isSealCorrect(from({ sealAnswer: 1 }), 1)).toBe(true)
  })
  test('false when answer does not match', () => {
    expect(isSealCorrect(from({ sealAnswer: 0 }), 1)).toBe(false)
  })
})

describe('isCheckCorrect', () => {
  test('false when not answered', () => {
    expect(isCheckCorrect(from({ checkAnswer: null }), 0)).toBe(false)
  })
  test('true when answer matches correct', () => {
    expect(isCheckCorrect(from({ checkAnswer: 0 }), 0)).toBe(true)
  })
  test('false when wrong option selected', () => {
    expect(isCheckCorrect(from({ checkAnswer: 1 }), 0)).toBe(false)
  })
})

// ─── Full lesson flow integration ─────────────────────────────────────────────

describe('Full lesson flow', () => {
  test('student completes 3-chunk, 2-seal lesson → reaches pledge', () => {
    let state = INITIAL_STATE

    // Start
    state = lessonReduce(state, { type: 'START_LESSON' })
    expect(state.step).toBe('teaching')

    // Chunk 1 with correct check answer
    state = lessonReduce(state, { type: 'TAP_CHECK', optionIndex: 1 })
    state = lessonReduce(state, { type: 'ADVANCE_CHUNK', totalChunks: 3 })
    expect(state.chunkIndex).toBe(1)
    expect(state.checkAnswer).toBeNull()

    // Chunk 2 — no check question
    state = lessonReduce(state, { type: 'ADVANCE_CHUNK', totalChunks: 3 })
    expect(state.chunkIndex).toBe(2)

    // Chunk 3 — last chunk → goes to seal
    state = lessonReduce(state, { type: 'ADVANCE_CHUNK', totalChunks: 3 })
    expect(state.step).toBe('seal')

    // Seal 1
    state = lessonReduce(state, { type: 'TAP_SEAL', optionIndex: 0 })
    state = lessonReduce(state, { type: 'ADVANCE_SEAL', totalSeals: 2 })
    expect(state.sealIndex).toBe(1)

    // Seal 2 — last seal → loading
    state = lessonReduce(state, { type: 'TAP_SEAL', optionIndex: 1 })
    state = lessonReduce(state, { type: 'ADVANCE_SEAL', totalSeals: 2 })
    expect(state.step).toBe('loading')

    // Scenario loads
    state = lessonReduce(state, { type: 'SCENARIO_READY' })
    expect(state.step).toBe('scenario')

    // Pick discipline path
    state = lessonReduce(state, { type: 'PICK_PATH', path: 'discipline' })
    expect(state.choice).toBe('discipline')

    // Proceed to challenge
    state = lessonReduce(state, { type: 'PROCEED_TO_CHALLENGE' })
    expect(state.step).toBe('challenge')

    // Complete week
    state = lessonReduce(state, { type: 'COMPLETE_WEEK' })
    expect(state.step).toBe('pledge')

    // Move to complete
    state = lessonReduce(state, { type: 'NEXT_SCREEN' })
    expect(state.step).toBe('complete')
  })

  test('student tries another scenario (Try Again)', () => {
    let state = from({ step: 'scenario', scenarioCount: 1, choice: 'default' })

    state = lessonReduce(state, { type: 'TRY_ANOTHER' })
    expect(state.step).toBe('loading')
    expect(state.scenarioCount).toBe(2)
    expect(state.choice).toBeNull()

    state = lessonReduce(state, { type: 'SCENARIO_READY' })
    expect(state.step).toBe('scenario')
  })
})
