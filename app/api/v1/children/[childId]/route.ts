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
  // Profile fields live inside the JSONB `profile` column, not as top-level
  // Child columns. Select `profile` and flatten it for the response.
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      track: true,
      profile: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!child) return err('NOT_FOUND', 'Child not found')

  const p = (child.profile as Record<string, unknown> | null) ?? {}
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

  // Stable display fields vs. the remaining sensitive profile fields
  const { name, familyName, age, grade, school, ...profile } = p as Record<string, unknown>

  return ok({
    child: {
      id: child.id,
      name: str(name),
      familyName: str(familyName),
      age: str(age),
      grade: str(grade),
      school: str(school),
      track: child.track,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
      profile,
    },
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

    // `track` is a real Child column; every other field lives inside the JSONB
    // `profile` column. Merge the profile updates into the existing profile so
    // partial edits do not wipe untouched fields.
    const { track, ...profileUpdates } = updates as Record<string, unknown>

    const existing = await db.child.findUnique({
      where: { id: childId },
      select: { profile: true },
    })
    if (!existing) return err('NOT_FOUND', 'Child not found')

    const mergedProfile = {
      ...((existing.profile as Record<string, unknown> | null) ?? {}),
      ...profileUpdates,
    }

    const updated = await db.child.update({
      where: { id: childId },
      data: {
        profile: mergedProfile,
        ...(track !== undefined ? { track: track as string } : {}),
      },
      select: { id: true, track: true, profile: true, updatedAt: true },
    })

    const mp = (updated.profile as Record<string, unknown> | null) ?? {}
    return ok({
      child: {
        id: updated.id,
        name: mp.name ?? '',
        track: updated.track,
        updatedAt: updated.updatedAt,
      },
    })
  })(req, ctx)
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

export const DELETE = withOwnership(async (_req, _session, { childId }) => {
  // Cascade delete: Child → LessonProgress, ChallengeResponse, ScenarioCache
  // (Prisma schema has onDelete: Cascade on all child relations)
  await db.child.delete({ where: { id: childId } })
  return ok({ deleted: true })
})
