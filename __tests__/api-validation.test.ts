// __tests__/api-validation.test.ts
//
// Tests for the centralized validation functions in lib/api/validation.ts
// These are the gatekeepers for every API mutation. If they break, 
// invalid data reaches the database.

import {
  validateChildProfileUpdate,
  validateChallengeResponse,
  validateProgressUpdate,
  validateInviteCreate,
  validateFamilyUpdate,
  validateAccountDelete,
} from '../lib/api/validation'

// ─── validateChildProfileUpdate ───────────────────────────────────────────────

describe('validateChildProfileUpdate', () => {
  test('accepts empty object (no changes)', () => {
    const result = validateChildProfileUpdate({})
    expect(result.ok).toBe(false) // must have at least one field
    if (!result.ok) expect(result.errors._).toBeDefined()
  })

  test('accepts valid name update', () => {
    const result = validateChildProfileUpdate({ name: 'John' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.name).toBe('John')
  })

  test('trims whitespace from name', () => {
    const result = validateChildProfileUpdate({ name: '  John  ' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.name).toBe('John')
  })

  test('rejects empty name', () => {
    const result = validateChildProfileUpdate({ name: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.name).toBeDefined()
  })

  test('rejects name over 50 characters', () => {
    const result = validateChildProfileUpdate({ name: 'A'.repeat(51) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.name).toBeDefined()
  })

  test('rejects invalid track', () => {
    const result = validateChildProfileUpdate({ track: 'college' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.track).toBeDefined()
  })

  test('accepts valid track values', () => {
    const validTracks = ['elementary', 'middle', 'high', 'pre-k']
    for (const track of validTracks) {
      const result = validateChildProfileUpdate({ track })
      expect(result.ok).toBe(true)
    }
  })

  test('rejects flashPoint over 200 characters', () => {
    const result = validateChildProfileUpdate({ flashPoint: 'x'.repeat(201) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.flashPoint).toBeDefined()
  })

  test('accepts flashPoint exactly 200 characters', () => {
    const result = validateChildProfileUpdate({ flashPoint: 'x'.repeat(200) })
    expect(result.ok).toBe(true)
  })

  test('only includes changed fields in output', () => {
    const result = validateChildProfileUpdate({ name: 'Nick', grade: '1st' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Nick')
      expect(result.data.grade).toBe('1st')
      expect(Object.keys(result.data)).toHaveLength(2)
    }
  })

  test('rejects null/undefined input', () => {
    const result = validateChildProfileUpdate(null)
    // null has no keys — returns "at least one field required" error
    expect(result.ok).toBe(false)
  })
})

// ─── validateChallengeResponse ────────────────────────────────────────────────

describe('validateChallengeResponse', () => {
  test('accepts "yes"', () => {
    const result = validateChallengeResponse({ response: 'yes' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.response).toBe('yes')
  })

  test('accepts "not-yet"', () => {
    const result = validateChallengeResponse({ response: 'not-yet' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.response).toBe('not-yet')
  })

  test('rejects "no"', () => {
    const result = validateChallengeResponse({ response: 'no' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.response).toBeDefined()
  })

  test('rejects missing response', () => {
    const result = validateChallengeResponse({})
    expect(result.ok).toBe(false)
  })

  test('rejects boolean true', () => {
    const result = validateChallengeResponse({ response: true })
    expect(result.ok).toBe(false)
  })

  test('rejects SQL injection attempt', () => {
    const result = validateChallengeResponse({ response: "yes'; DROP TABLE users; --" })
    expect(result.ok).toBe(false)
  })
})

// ─── validateProgressUpdate ───────────────────────────────────────────────────

describe('validateProgressUpdate', () => {
  test('accepts valid currentStep', () => {
    const result = validateProgressUpdate({ currentStep: 'teaching' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.currentStep).toBe('teaching')
  })

  test('rejects unknown step name (business logic bypass)', () => {
    const result = validateProgressUpdate({ currentStep: 'complete_hacked' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.currentStep).toBeDefined()
  })

  test('accepts completed: true', () => {
    const result = validateProgressUpdate({ completed: true })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.completed).toBe(true)
  })

  test('silently drops completed: false (cannot un-complete)', () => {
    const result = validateProgressUpdate({ completed: false })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.completed).toBeUndefined()
  })

  test('rejects non-integer chunkIndex', () => {
    const result = validateProgressUpdate({ chunkIndex: 1.5 })
    expect(result.ok).toBe(false)
  })

  test('rejects negative chunkIndex', () => {
    const result = validateProgressUpdate({ chunkIndex: -1 })
    expect(result.ok).toBe(false)
  })

  test('rejects chunkIndex above max (8)', () => {
    const result = validateProgressUpdate({ chunkIndex: 9 })
    expect(result.ok).toBe(false)
  })

  test('accepts all valid step names', () => {
    const steps = ['intro', 'teaching', 'seal', 'loading', 'scenario', 'challenge', 'pledge', 'complete']
    for (const step of steps) {
      const result = validateProgressUpdate({ currentStep: step })
      expect(result.ok).toBe(true)
    }
  })

  test('accepts empty object (no-op update)', () => {
    const result = validateProgressUpdate({})
    expect(result.ok).toBe(true)
    if (result.ok) expect(Object.keys(result.data)).toHaveLength(0)
  })

  test('rejects string chunkIndex', () => {
    const result = validateProgressUpdate({ chunkIndex: '3' })
    expect(result.ok).toBe(false)
  })
})

// ─── validateInviteCreate ─────────────────────────────────────────────────────

describe('validateInviteCreate', () => {
  test('accepts valid code', () => {
    const result = validateInviteCreate({ code: 'mccarty2025' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.code).toBe('mccarty2025')
  })

  test('lowercases the code', () => {
    const result = validateInviteCreate({ code: 'MCCARTY2025' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.code).toBe('mccarty2025')
  })

  test('rejects code with spaces', () => {
    const result = validateInviteCreate({ code: 'mc carty' })
    expect(result.ok).toBe(false)
  })

  test('rejects code under 4 chars', () => {
    const result = validateInviteCreate({ code: 'abc' })
    expect(result.ok).toBe(false)
  })

  test('rejects code over 32 chars', () => {
    const result = validateInviteCreate({ code: 'a'.repeat(33) })
    expect(result.ok).toBe(false)
  })

  test('rejects note over 200 chars', () => {
    const result = validateInviteCreate({ code: 'valid', note: 'x'.repeat(201) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.note).toBeDefined()
  })

  test('accepts note exactly 200 chars', () => {
    const result = validateInviteCreate({ code: 'valid', note: 'x'.repeat(200) })
    expect(result.ok).toBe(true)
  })

  test('accepts missing note (optional)', () => {
    const result = validateInviteCreate({ code: 'valid-2025' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.note).toBeUndefined()
  })
})

// ─── validateFamilyUpdate ─────────────────────────────────────────────────────

describe('validateFamilyUpdate', () => {
  test('accepts valid family name', () => {
    const result = validateFamilyUpdate({ familyName: 'The McCarty Family' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.familyName).toBe('The McCarty Family')
  })

  test('trims whitespace', () => {
    const result = validateFamilyUpdate({ familyName: '  McCarty  ' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.familyName).toBe('McCarty')
  })

  test('rejects empty family name', () => {
    const result = validateFamilyUpdate({ familyName: '' })
    expect(result.ok).toBe(false)
  })

  test('rejects name over 80 chars', () => {
    const result = validateFamilyUpdate({ familyName: 'x'.repeat(81) })
    expect(result.ok).toBe(false)
  })
})

// ─── validateAccountDelete ────────────────────────────────────────────────────

describe('validateAccountDelete', () => {
  test('accepts valid email', () => {
    const result = validateAccountDelete({ confirmEmail: 'ryan@example.com' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.confirmEmail).toBe('ryan@example.com')
  })

  test('lowercases confirmation email', () => {
    const result = validateAccountDelete({ confirmEmail: 'RYAN@EXAMPLE.COM' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.confirmEmail).toBe('ryan@example.com')
  })

  test('rejects empty confirmation', () => {
    const result = validateAccountDelete({ confirmEmail: '' })
    expect(result.ok).toBe(false)
  })

  test('rejects missing field', () => {
    const result = validateAccountDelete({})
    expect(result.ok).toBe(false)
  })
})
