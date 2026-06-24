// app/api/challenges/[childId]/[week]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface Params { params: { childId: string; week: string } }

// OPTIMIZATION: Direct lookup using denormalized userId column.
// Before: JOIN Child → Family to verify ownership (2 table reads)
// After:  WHERE id AND userId on Child index (single index lookup)
// Requires Migration 002 (userId column on Child).
async function verifyOwnership(userId: string, childId: string) {
  return db.child.findFirst({
    where: { id: childId, userId },
    select: { id: true },
  })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await verifyOwnership(session.user.id, params.childId)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const weekNumber = parseInt(params.week)
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 13) {
    return NextResponse.json({ error: 'Invalid week number' }, { status: 400 })
  }

  let response: unknown
  try {
    const body = await req.json()
    response = body?.response
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (response !== 'yes' && response !== 'not-yet') {
    return NextResponse.json({ error: 'Invalid response value' }, { status: 400 })
  }

  await db.challengeResponse.upsert({
    where: { childId_weekNumber: { childId: params.childId, weekNumber } },
    create: { childId: params.childId, weekNumber, response },
    update: { response },
  })

  return NextResponse.json({ ok: true })
}
