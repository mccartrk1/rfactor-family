// app/api/v1/scenarios/batch-generate/route.ts
//
// Triggers batch pre-generation of all scenarios for specified children.
// Called after family enrollment completes.
//
// Security: requires authenticated session + ownership of all provided childIds.
// Runs synchronously (may take 2-3 minutes for 2 children × 39 scenarios).
// In production, move to a background queue (Vercel Queue or similar) if timeout is a concern.
//
// Usage from onboarding completion:
//   await fetch('/api/v1/scenarios/batch-generate', {
//     method: 'POST',
//     body: JSON.stringify({ childIds: [child.id] }),
//   }) // fire and forget — don't await in UI

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { batchPregenerate } from '@/lib/scenario-batch'
import { ok, err } from '@/lib/api'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return err('UNAUTHORIZED', 'Authentication required')
  }

  let childIds: string[]
  try {
    const body = await req.json()
    childIds = Array.isArray(body.childIds) ? body.childIds : []
  } catch {
    return err('VALIDATION_ERROR', 'Invalid request body')
  }

  if (childIds.length === 0) {
    return err('VALIDATION_ERROR', 'childIds must be a non-empty array')
  }

  if (childIds.length > 10) {
    return err('VALIDATION_ERROR', 'Maximum 10 children per batch request')
  }

  // Verify ownership: all provided childIds must belong to this user
  const owned = await db.child.findMany({
    where: { id: { in: childIds }, userId: session.user.id },
    select: { id: true },
  })

  const ownedIds = new Set(owned.map(c => c.id))
  const unauthorized = childIds.filter(id => !ownedIds.has(id))
  if (unauthorized.length > 0) {
    return err('FORBIDDEN', 'One or more children not found')
  }

  // Run batch generation for each child sequentially
  // This runs synchronously — the Vercel function timeout is 60s (set in vercel.json)
  // For 2 children × 39 scenarios × 200ms delay = ~16 seconds total
  const results: Record<string, { generated: number; skipped: number; failed: number }> = {}

  for (const childId of childIds) {
    const result = await batchPregenerate(childId)
    results[childId] = {
      generated: result.generated,
      skipped: result.skipped,
      failed: result.failed,
    }
  }

  const totalGenerated = Object.values(results).reduce((s, r) => s + r.generated, 0)

  return ok({
    results,
    summary: {
      totalGenerated,
      estimatedCostUsd: (totalGenerated * 0.008).toFixed(3),
    },
  })
}
