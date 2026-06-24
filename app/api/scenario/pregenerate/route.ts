// app/api/scenario/pregenerate/route.ts
//
// Called immediately after a family completes a week.
// Generates the next week's scenario in the background so the loading
// spinner doesn't appear when they open the next lesson.
//
// The client fires this as a fire-and-forget fetch — it doesn't wait for the
// response. If pre-generation fails, the lesson falls back to generating
// on-demand at the normal time.
//
// Usage: POST /api/scenario/pregenerate { childId, completedWeekNumber }

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pregenerateNext } from '@/lib/scenario-service'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let childId: unknown, completedWeekNumber: unknown
  try {
    const body = await req.json()
    childId = body.childId
    completedWeekNumber = body.completedWeekNumber
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!childId || typeof completedWeekNumber !== 'number') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const child = await db.child.findFirst({
    where: { id: childId, family: { userId: session.user.id } },
  })
  if (!child) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Run pre-generation — this takes 2-5s but the client doesn't wait for it
  await pregenerateNext(child, completedWeekNumber, session.user.id)

  return NextResponse.json({ ok: true })
}
