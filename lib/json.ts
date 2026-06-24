// lib/json.ts
// Shared utility for repairing malformed JSON from LLM responses.
// Strips markdown fences and attempts to close unclosed objects.

export function repairJSON(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('```json')) s = s.slice(7)
  if (s.startsWith('```')) s = s.slice(3)
  if (s.endsWith('```')) s = s.slice(0, -3)
  s = s.trim()
  const opens = (s.match(/{/g) || []).length
  const closes = (s.match(/}/g) || []).length
  for (let i = 0; i < opens - closes; i++) s += '}'
  return s
}

// ─── ScenarioPayload validation ──────────────────────────────────────────────
//
// Validates that a parsed object matches the expected ScenarioPayload shape.
// Called after JSON.parse(repairJSON(raw)) to catch malformed Claude responses
// before they reach the React render tree.
//
// A successfully-parsed-but-malformed object (e.g. disciplinePath is a string
// instead of an object) would crash the scenario screen with an unhandled
// TypeError. This guard converts those crashes into handled errors.

export interface ScenarioPayload {
  setup: string
  event: string
  disciplinePath: { choice: string; result: string }
  defaultPath: { choice: string; result: string }
  question: string
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

export function validateScenarioPayload(data: unknown): ScenarioPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Scenario response is not an object')
  }

  const d = data as Record<string, unknown>

  if (!isNonEmptyString(d.setup))     throw new Error('Missing or empty: setup')
  if (!isNonEmptyString(d.event))     throw new Error('Missing or empty: event')
  if (!isNonEmptyString(d.question))  throw new Error('Missing or empty: question')

  const dp = d.disciplinePath
  if (!dp || typeof dp !== 'object')  throw new Error('disciplinePath is not an object')
  const dpo = dp as Record<string, unknown>
  if (!isNonEmptyString(dpo.choice))  throw new Error('Missing: disciplinePath.choice')
  if (!isNonEmptyString(dpo.result))  throw new Error('Missing: disciplinePath.result')

  const def = d.defaultPath
  if (!def || typeof def !== 'object') throw new Error('defaultPath is not an object')
  const defo = def as Record<string, unknown>
  if (!isNonEmptyString(defo.choice)) throw new Error('Missing: defaultPath.choice')
  if (!isNonEmptyString(defo.result)) throw new Error('Missing: defaultPath.result')

  // Strip any unexpected keys and return a clean, typed object
  return {
    setup:          String(d.setup),
    event:          String(d.event),
    disciplinePath: { choice: String(dpo.choice), result: String(dpo.result) },
    defaultPath:    { choice: String(defo.choice), result: String(defo.result) },
    question:       String(d.question),
  }
}
