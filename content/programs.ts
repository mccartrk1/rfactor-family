// content/programs.ts
//
// Program selector keyed by `track`. The audience only changes the CONTENT and
// the scenario framing — the lesson engine is shared. This module exposes only
// the lightweight week metadata so it is safe to import from client components.
// The heavy curriculum (LESSONS / LESSONS_ADULT) is selected server-side in the
// lesson page via getLessonsForTrack, keeping it out of the client bundle.
import type { Week, Lesson } from '@/types'
import { WEEKS } from '@/content/weeks'
import { WEEKS_ADULT } from '@/content/weeks-adult'

export const ADULT_TRACK = 'adult'

export function isAdultTrack(track: string | null | undefined): boolean {
  return track === ADULT_TRACK
}

// Client-safe: week metadata only.
export function getProgramWeeks(track: string | null | undefined): Week[] {
  return isAdultTrack(track) ? WEEKS_ADULT : WEEKS
}

// Server-only: pulls the heavy curriculum. Call from RSC/route handlers only.
export async function getLessonsForTrack(track: string | null | undefined): Promise<Record<number, Lesson>> {
  if (isAdultTrack(track)) {
    const { LESSONS_ADULT } = await import('@/content/curriculum-adult')
    return LESSONS_ADULT
  }
  const { LESSONS } = await import('@/content/curriculum')
  return LESSONS
}
