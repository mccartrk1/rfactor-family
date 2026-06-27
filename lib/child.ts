// lib/child.ts
// Single place for Prisma Child → ChildProfile mapping.
// Add a field once here; everything else picks it up automatically.

import type { Child } from '@prisma/client'
import type { ChildProfile } from '@/types'

export function toChildProfile(child: Child): ChildProfile {
  // Descriptive fields live in the JSONB profile column, not as columns.
  const p = (child.profile as unknown as Record<string, unknown> | null) ?? {}
  const s = (k: string): string => (p[k] as string) ?? ''
  return {
    id: child.id,
    familyId: child.familyId,
    name: s('name'),
    familyName: s('familyName'),
    age: s('age'),
    grade: s('grade'),
    school: s('school'),
    mascot: s('mascot'),
    teacher: s('teacher'),
    bestFriend: s('bestFriend'),
    friends: s('friends'),
    activity: s('activity'),
    game: s('game'),
    loveFood: s('loveFood'),
    hateFood: s('hateFood'),
    athlete: s('athlete'),
    team: s('team'),
    grandparent: s('grandparent'),
    trustedAdults: s('trustedAdults'),
    babysitter: s('babysitter'),
    hardThing: s('hardThing'),
    flashPoint: s('flashPoint'),
    siblings: s('siblings'),
    track: child.track,
  }
}

// Type-safe field extraction for creating/updating a child from request body.
// Returns only the fields the schema accepts, with safe defaults for optional ones.
export function childFieldsFromBody(body: Record<string, unknown>) {
  return {
    name:         String(body.name         ?? ''),
    familyName:   String(body.familyName   ?? ''),
    age:          String(body.age          ?? ''),
    grade:        String(body.grade        ?? ''),
    school:       String(body.school       ?? ''),
    mascot:       String(body.mascot       ?? ''),
    teacher:      String(body.teacher      ?? ''),
    bestFriend:   String(body.bestFriend   ?? ''),
    friends:      String(body.friends      ?? ''),
    activity:     String(body.activity     ?? ''),
    game:         String(body.game         ?? ''),
    loveFood:     String(body.loveFood     ?? ''),
    hateFood:     String(body.hateFood     ?? ''),
    athlete:      String(body.athlete      ?? ''),
    team:         String(body.team         ?? ''),
    grandparent:  String(body.grandparent  ?? ''),
    trustedAdults:String(body.trustedAdults?? ''),
    babysitter:   String(body.babysitter   ?? ''),
    hardThing:    String(body.hardThing    ?? ''),
    flashPoint:   String(body.flashPoint   ?? ''),
    siblings:     String(body.siblings     ?? ''),
  }
}
