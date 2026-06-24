// app/api/progress/[childId]/route.ts
// GET all progress for one child
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface Params { params: { childId: string } }

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

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await verifyOwnership(session.user.id, params.childId)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const progress = await db.lessonProgress.findMany({
    where: { childId: params.childId },
    orderBy: { weekNumber: 'asc' },
  })

  return NextResponse.json({ progress })
}
