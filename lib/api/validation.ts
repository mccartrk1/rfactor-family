// lib/api/validation.ts
//
// Centralized validation functions for all API v1 routes.
//
// Each validator returns { ok: true, data } or { ok: false, errors }.
// The errors object maps field names to error messages.
// This structure feeds directly into the err() response builder's `details` field,
// giving clients machine-readable field-level validation feedback.
//
// No Zod — avoids an additional dependency. The validators are explicit and
// self-documenting. Add Zod if the validation surface grows significantly.

import type { BodyValidator } from './middleware'
import { VALID_TRACKS, DEFAULT_TRACK, isValidTrack } from '@/lib/tracks'

// ─── Primitive helpers ────────────────────────────────────────────────────────

function required(v: unknown, label: string): string | null {
  const s = String(v ?? '').trim()
  return s ? null : `${label} is required`
}

function maxLen(v: unknown, max: number, label: string): string | null {
  const s = String(v ?? '').trim()
  return s.length <= max ? null : `${label} must be ${max} characters or fewer`
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data }
}

function fail(errors: Record<string, string>): { ok: false; errors: Record<string, string> } {
  return { ok: false, errors }
}

// ─── Validators ───────────────────────────────────────────────────────────────

// Family update
export interface FamilyUpdateBody { familyName: string }
export const validateFamilyUpdate: BodyValidator<FamilyUpdateBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}
  const familyName = String(b.familyName ?? '').trim()
  if (!familyName) errors.familyName = 'Family name is required'
  if (familyName.length > 80) errors.familyName = 'Family name must be 80 characters or fewer'
  if (Object.keys(errors).length) return fail(errors)
  return ok({ familyName })
}

// Child profile fields (shared by POST /children and PUT /children/:id)
export interface ChildProfileInput {
  name: string
  familyName: string
  age: string
  grade: string
  school: string
  mascot: string
  teacher: string
  bestFriend: string
  friends: string
  activity: string
  game: string
  loveFood: string
  hateFood: string
  athlete: string
  team: string
  grandparent: string
  trustedAdults: string
  babysitter: string
  hardThing: string
  flashPoint: string
  siblings: string
  track?: string
}

export const validateChildProfile: BodyValidator<ChildProfileInput> = (raw) => {
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}

  const name = String(b.name ?? '').trim()
  if (!name) errors.name = 'Child name is required'
  if (name.length > 50) errors.name = 'Name must be 50 characters or fewer'

  const track = String(b.track ?? DEFAULT_TRACK).trim()
  if (!isValidTrack(track)) errors.track = `Track must be one of: ${VALID_TRACKS.join(', ')}`

  // Optional string fields — cap length, coerce to string
  const optionalFields: Array<[string, number]> = [
    ['familyName', 80], ['age', 20], ['grade', 40], ['school', 100],
    ['mascot', 60], ['teacher', 80], ['bestFriend', 80], ['friends', 200],
    ['activity', 100], ['game', 100], ['loveFood', 100], ['hateFood', 100],
    ['athlete', 80], ['team', 80], ['grandparent', 40], ['trustedAdults', 200],
    ['babysitter', 80], ['hardThing', 200], ['flashPoint', 200], ['siblings', 200],
  ]

  for (const [field, max] of optionalFields) {
    const v = String(b[field] ?? '').trim()
    if (v.length > max) errors[field] = `${field} must be ${max} characters or fewer`
  }

  if (Object.keys(errors).length) return fail(errors)

  return ok({
    name,
    familyName:    String(b.familyName    ?? '').trim(),
    age:           String(b.age           ?? '').trim(),
    grade:         String(b.grade         ?? '').trim(),
    school:        String(b.school        ?? '').trim(),
    mascot:        String(b.mascot        ?? '').trim(),
    teacher:       String(b.teacher       ?? '').trim(),
    bestFriend:    String(b.bestFriend    ?? '').trim(),
    friends:       String(b.friends       ?? '').trim(),
    activity:      String(b.activity      ?? '').trim(),
    game:          String(b.game          ?? '').trim(),
    loveFood:      String(b.loveFood      ?? '').trim(),
    hateFood:      String(b.hateFood      ?? '').trim(),
    athlete:       String(b.athlete       ?? '').trim(),
    team:          String(b.team          ?? '').trim(),
    grandparent:   String(b.grandparent   ?? '').trim(),
    trustedAdults: String(b.trustedAdults ?? '').trim(),
    babysitter:    String(b.babysitter    ?? '').trim(),
    hardThing:     String(b.hardThing     ?? '').trim(),
    flashPoint:    String(b.flashPoint    ?? '').trim(),
    siblings:      String(b.siblings      ?? '').trim(),
    track,
  })
}

// Partial child update (PUT /children/:id) — all fields optional
export type ChildProfileUpdateInput = Partial<ChildProfileInput>
export const validateChildProfileUpdate: BodyValidator<ChildProfileUpdateInput> = (raw) => {
  // Guard against null / non-object bodies before reading fields, otherwise a
  // `null` body throws instead of failing validation cleanly.
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return fail({ _: 'Request body must be an object' })
  }
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}
  const result: ChildProfileUpdateInput = {}

  if (b.name !== undefined) {
    const name = String(b.name).trim()
    if (!name) errors.name = 'Name cannot be empty'
    else if (name.length > 50) errors.name = 'Name must be 50 characters or fewer'
    else result.name = name
  }

  if (b.track !== undefined) {
    const track = String(b.track).trim()
    if (!isValidTrack(track)) errors.track = `Track must be one of: ${VALID_TRACKS.join(', ')}`
    else result.track = track
  }

  const optionalFields: Array<[string, number]> = [
    ['familyName', 80], ['age', 20], ['grade', 40], ['school', 100],
    ['mascot', 60], ['teacher', 80], ['bestFriend', 80], ['friends', 200],
    ['activity', 100], ['game', 100], ['loveFood', 100], ['hateFood', 100],
    ['athlete', 80], ['team', 80], ['grandparent', 40], ['trustedAdults', 200],
    ['babysitter', 80], ['hardThing', 200], ['flashPoint', 200], ['siblings', 200],
  ]

  for (const [field, max] of optionalFields) {
    if (b[field] !== undefined) {
      const v = String(b[field]).trim()
      if (v.length > max) errors[field] = `${field} must be ${max} characters or fewer`
      else (result as Record<string, string>)[field] = v
    }
  }

  if (Object.keys(errors).length) return fail(errors)
  if (Object.keys(result).length === 0) return fail({ _: 'At least one field must be provided' })
  return ok(result)
}

// Challenge response
export interface ChallengeResponseBody { response: 'yes' | 'not-yet' }
export const validateChallengeResponse: BodyValidator<ChallengeResponseBody> = (raw) => {
  const b = raw as Record<string, unknown>
  if (b.response !== 'yes' && b.response !== 'not-yet') {
    return fail({ response: 'Must be "yes" or "not-yet"' })
  }
  return ok({ response: b.response as 'yes' | 'not-yet' })
}

// Progress update
const VALID_STEPS = new Set(['intro','teaching','seal','loading','scenario','challenge','pledge','complete'])
const MAX_CHUNK = 8
const MAX_SEAL  = 5

export interface ProgressUpdateBody {
  currentStep?: string
  chunkIndex?: number
  sealIndex?: number
  completed?: boolean
}

export const validateProgressUpdate: BodyValidator<ProgressUpdateBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}
  const result: ProgressUpdateBody = {}

  if (b.currentStep !== undefined) {
    if (typeof b.currentStep !== 'string' || !VALID_STEPS.has(b.currentStep)) {
      errors.currentStep = `Must be one of: ${[...VALID_STEPS].join(', ')}`
    } else { result.currentStep = b.currentStep }
  }
  if (b.chunkIndex !== undefined) {
    if (!Number.isInteger(b.chunkIndex) || (b.chunkIndex as number) < 0 || (b.chunkIndex as number) > MAX_CHUNK) {
      errors.chunkIndex = `Must be integer 0–${MAX_CHUNK}`
    } else { result.chunkIndex = b.chunkIndex as number }
  }
  if (b.sealIndex !== undefined) {
    if (!Number.isInteger(b.sealIndex) || (b.sealIndex as number) < 0 || (b.sealIndex as number) > MAX_SEAL) {
      errors.sealIndex = `Must be integer 0–${MAX_SEAL}`
    } else { result.sealIndex = b.sealIndex as number }
  }
  if (b.completed !== undefined) {
    if (typeof b.completed !== 'boolean') errors.completed = 'Must be a boolean'
    else if (b.completed === true) result.completed = true
    // completed:false silently ignored — can only mark complete, not uncomplete
  }

  if (Object.keys(errors).length) return fail(errors)
  return ok(result)
}

// Invite code (admin)
export interface InviteCreateBody { code: string; note?: string }
export const validateInviteCreate: BodyValidator<InviteCreateBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}
  const code = String(b.code ?? '').trim().toLowerCase()
  const note = String(b.note ?? '').trim()

  if (!code) errors.code = 'Code is required'
  else if (!/^[a-z0-9-]+$/.test(code)) errors.code = 'Lowercase letters, numbers, hyphens only'
  else if (code.length < 4 || code.length > 32) errors.code = 'Must be 4–32 characters'

  if (note.length > 200) errors.note = 'Note must be 200 characters or fewer'

  if (Object.keys(errors).length) return fail(errors)
  return ok({ code, note: note || undefined })
}

// Invite validation (public)
export interface InviteValidateBody { code: string }
export const validateInviteCode: BodyValidator<InviteValidateBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const code = String(b.code ?? '').trim().toLowerCase()
  if (!code || code.length < 4 || code.length > 32) {
    return fail({ code: 'Invalid code format' })
  }
  return ok({ code })
}

// Account deletion
export interface AccountDeleteBody { confirmEmail: string }
export const validateAccountDelete: BodyValidator<AccountDeleteBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const confirmEmail = String(b.confirmEmail ?? '').trim().toLowerCase()
  if (!confirmEmail) return fail({ confirmEmail: 'Email confirmation is required' })
  return ok({ confirmEmail })
}

// Scenario generation
export interface ScenarioBody { childId: string; weekNumber: number; attempt?: number }
export const validateScenarioRequest: BodyValidator<ScenarioBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}
  const childId = String(b.childId ?? '').trim()
  if (!childId) errors.childId = 'childId is required'

  const weekNumber = b.weekNumber
  if (typeof weekNumber !== 'number' || !Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 13) {
    errors.weekNumber = 'Must be an integer 1–13'
  }

  const attempt = b.attempt
  if (attempt !== undefined && (typeof attempt !== 'number' || attempt < 0 || attempt > 10)) {
    errors.attempt = 'Must be an integer 0–10'
  }

  if (Object.keys(errors).length) return fail(errors)
  return ok({ childId, weekNumber: weekNumber as number, attempt: (attempt as number) ?? 0 })
}
