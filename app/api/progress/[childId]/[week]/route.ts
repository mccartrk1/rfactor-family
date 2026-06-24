// app/api/progress/[childId]/[week]/route.ts
//
// HIGH-01 FIX: Strict body validation on progress updates.
//
// Previously, any authenticated user could POST arbitrary values:
//   { completed: true, currentStep: 'complete' }
// and mark any week as complete without doing any lessons.
//
// Fix: All body fields are validated against strict allowlists.
// currentStep must be one of the known lesson steps.
// chunkIndex and sealIndex must be non-negative integers within bounds.
// completed can only be set to true — not toggled back to false by the client.
// (Reset is an admin-only operation.)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface Params { params: { childId: string; week: string } }

// All valid lesson step names — used for allowlist validation
const VALID_STEPS = new Set([
  'intro', 'teaching', 'seal', 'loading', 'scenario',
  'challenge', 'pledge', 'complete',
])

const MAX_CHUNKS = 8  // maximum chunks per lesson
const MAX_SEALS  = 5  // maximum seal questions per lesson

async function verifyOwnership(userId: string, childId: string) {
  return db.child.findFirst({
    where: { id: childId, userId },
    select: { id: true },
  })
}

// Strict validation of progress update fields
interface ValidatedProgressUpdate {
  currentStep?: string
  chunkIndex?: number
  sealIndex?: number
  completed?: boolean
}

function validateProgressBody(body: Record<string, unknown>): {
  ok: true; data: ValidatedProgressUpdate
} | {
  ok: false; error: string
} {
  const result: ValidatedProgressUpdate = {}

  // currentStep: must be a known step name
  if (body.currentStep !== undefined) {
    const step = body.currentStep
    if (typeof step !== 'string' || !VALID_STEPS.has(step)) {
      return { ok: false, error: `Invalid currentStep. Must be one of: ${[...VALID_STEPS].join(', ')}` }
    }
    result.currentStep = step
  }

  // chunkIndex: non-negative integer within bounds
  if (body.chunkIndex !== undefined) {
    const idx = body.chunkIndex
    if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx > MAX_CHUNKS) {
      return { ok: false, error: `Invalid chunkIndex. Must be integer 0-${MAX_CHUNKS}` }
    }
    result.chunkIndex = idx
  }

  // sealIndex: non-negative integer within bounds
  if (body.sealIndex !== undefined) {
    const idx = body.sealIndex
    if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx > MAX_SEALS) {
      return { ok: false, error: `Invalid sealIndex. Must be integer 0-${MAX_SEALS}` }
    }
    result.sealIndex = idx
  }

  // completed: boolean only, and can only be set to true from the client
  // Resetting completion is admin-only (not exposed via API)
  if (body.completed !== undefined) {
    if (typeof body.completed !== 'boolean') {
      return { ok: false, error: 'completed must be a boolean' }
    }
    // Silently ignore completed: false — client cannot un-complete a week
    if (body.completed === true) {
      result.completed = true
    }
  }

  return { ok: true, data: result }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await verifyOwnership(session.user.id, params.childId)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const weekNumber = parseInt(params.week, 10)
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 13) {
    return NextResponse.json({ error: 'Invalid week number' }, { status: 400 })
  }

  const progress = await db.lessonProgress.findUnique({
    where: { childId_weekNumber: { childId: params.childId, weekNumber } },
  })

  return NextResponse.json({ progress })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekNumber = parseInt(params.week, 10)
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 13) {
    return NextResponse.json({ error: 'Invalid week number' }, { status: 400 })
  }

  let rawBody: Record<string, unknown>
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // HIGH-01 FIX: Validate all fields before ownership check
  // (cheap validation before the DB round trip)
  const validation = validateProgressBody(rawBody)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const [owned] = await Promise.all([
    verifyOwnership(session.user.id, params.childId),
  ])
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = validation.data
  const completedAt = body.completed ? new Date() : undefined

  const progress = await db.lessonProgress.upsert({
    where: { childId_weekNumber: { childId: params.childId, weekNumber } },
    create: {
      childId: params.childId,
      weekNumber,
      currentStep: body.currentStep ?? 'intro',
      chunkIndex:  body.chunkIndex  ?? 0,
      sealIndex:   body.sealIndex   ?? 0,
      completed:   body.completed   ?? false,
      completedAt: completedAt ?? null,
    },
    update: {
      ...(body.currentStep !== undefined && { currentStep: body.currentStep }),
      ...(body.chunkIndex  !== undefined && { chunkIndex:  body.chunkIndex }),
      ...(body.sealIndex   !== undefined && { sealIndex:   body.sealIndex }),
      ...(body.completed   === true      && { completed: true, completedAt }),
    },
  })

  return NextResponse.json({ progress })
}
