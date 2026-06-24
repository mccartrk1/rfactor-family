// app/api/v1/children/[childId]/route.ts
// GET    — fetch a single child's full profile
// PUT    — update child profile fields (post-onboarding edit)
// DELETE — remove a child (cascades to all related records)

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { withOwnership } from '@/lib/api/middleware'
import { validateChildProfileUpdate } from '@/lib/api/validation'

type Params = { params: { childId: string } }

// ─── GET ───────────────────────────────────────────────────────────────────────

export const GET = withOwnership(async (_req, _session, { childId }) => {
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      name: true,
      familyName: true,
      age: true,
      grade: true,
      school: true,
      mascot: true,
      teacher: true,
      bestFriend: true,
      friends: true,
      activity: true,
      game: true,
      loveFood: true,
      hateFood: true,
      athlete: true,
      team: true,
      grandparent: true,
      trustedAdults: true,
      babysitter: true,
      hardThing: true,
      flashPoint: true,
      siblings: true,
      track: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!child) return err('NOT_FOUND', 'Child not found')

  // Separate stable display fields from sensitive profile fields
  const { id, name, familyName, age, grade, school, track, createdAt, updatedAt, ...profile } = child

  return ok({
    child: { id, name, familyName, age, grade, school, track, createdAt, updatedAt, profile },
  })
})

// ─── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, ctx: Params) {
  return withOwnership(async (_req, _session, { childId }) => {
    // Parse and validate body manually here since withOwnership already wraps
    let raw: unknown
    try { raw = await req.json() } catch {
      return err('VALIDATION_ERROR', 'Invalid JSON in request body')
    }

    const validation = validateChildProfileUpdate(raw)
    if (!validation.ok) {
      return err('VALIDATION_ERROR', 'Validation failed', 400, validation.errors)
    }

    const updates = validation.data

    const updated = await db.child.update({
      where: { id: childId },
      data: updates,
      select: {
        id: true, name: true, familyName: true, age: true, grade: true,
        school: true, track: true, mascot: true, bestFriend: true,
        siblings: true, updatedAt: true,
      },
    })

    return ok({ child: updated })
  })(req, ctx)
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

export const DELETE = withOwnership(async (_req, _session, { childId }) => {
  // Cascade delete: Child → LessonProgress, ChallengeResponse, ScenarioCache
  // (Prisma schema has onDelete: Cascade on all child relations)
  await db.child.delete({ where: { id: childId } })
  return ok({ deleted: true })
})
