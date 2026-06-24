// lib/child.ts
// Single place for Prisma Child → ChildProfile mapping.
// Add a field once here; everything else picks it up automatically.

import type { Child } from '@prisma/client'
import type { ChildProfile } from '@/types'

export function toChildProfile(child: Child): ChildProfile {
  return {
    id: child.id,
    familyId: child.familyId,
    name: child.name,
    familyName: child.familyName,
    age: child.age,
    grade: child.grade,
    school: child.school,
    mascot: child.mascot,
    teacher: child.teacher,
    bestFriend: child.bestFriend,
    friends: child.friends,
    activity: child.activity,
    game: child.game,
    loveFood: child.loveFood,
    hateFood: child.hateFood,
    athlete: child.athlete,
    team: child.team,
    grandparent: child.grandparent,
    trustedAdults: child.trustedAdults,
    babysitter: child.babysitter,
    hardThing: child.hardThing,
    flashPoint: child.flashPoint,
    siblings: child.siblings,
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
