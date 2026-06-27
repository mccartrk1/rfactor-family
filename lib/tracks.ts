// lib/tracks.ts
//
// Single source of truth for program tracks. Previously the track values and
// the "is this the adult program" check were duplicated across validation,
// content selection, and the AI prompt — easy to update one and miss another.
// Client-safe: pure constants and functions, no server-only imports.

export const DEFAULT_TRACK = 'elementary'
export const ADULT_TRACK = 'adult'

// All tracks a learner can be assigned. Adding a track here makes it valid
// everywhere validation runs.
export const VALID_TRACKS = ['elementary', 'middle', 'high', 'pre-k', 'adult'] as const

export type Track = (typeof VALID_TRACKS)[number]

export function isValidTrack(track: string): track is Track {
  return (VALID_TRACKS as readonly string[]).includes(track)
}

export function isAdultTrack(track: string | null | undefined): boolean {
  return track === ADULT_TRACK
}
