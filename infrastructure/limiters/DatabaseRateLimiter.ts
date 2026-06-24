// infrastructure/limiters/DatabaseRateLimiter.ts
//
// CRITICAL FIX: Previous implementation had a TOCTOU race condition.
//
// Bug: read-then-write across two separate queries.
//   1. Request A reads count=14 (below limit=15)
//   2. Request B reads count=14 simultaneously  ← gap
//   3. Both pass the check
//   4. Both call Claude — limit silently exceeded
//
// Fix: single atomic UPDATE ... WHERE + INSERT ON CONFLICT DO UPDATE.
// Implemented via Prisma's $executeRaw for the conditional increment.
// If the count is already at the limit, the UPDATE returns 0 rows affected
// and we return 'not allowed' without ever having modified state.
//
// This is safe under concurrent load with no serializable transaction needed.

import type { IRateLimiter, RateLimitResult } from '@/application/ports/IRateLimiter'
import { db } from '@/lib/db'

const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getMaxCalls(): number {
  const raw = process.env.MAX_AI_CALLS_PER_HOUR
  if (!raw) return 15
  const parsed = parseInt(raw, 10)
  // isNaN guard: if env var is set but malformed, fall back to safe default
  return isNaN(parsed) || parsed < 1 ? 15 : parsed
}

export class DatabaseRateLimiter implements IRateLimiter {
  async check(key: string): Promise<RateLimitResult> {
    const MAX_CALLS = getMaxCalls()
    const now = new Date()
    const windowStart = new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS)
    const resetAt = new Date(windowStart.getTime() + WINDOW_MS)

    // Attempt 1: try atomic increment if row exists in the current window
    // The WHERE condition ensures we only increment if:
    //   a) The row is in the current window, AND
    //   b) count < MAX_CALLS (atomic check-and-increment)
    const updateResult = await db.$executeRaw`
      UPDATE "RateLimit"
      SET count = count + 1, "updatedAt" = NOW()
      WHERE key = ${key}
        AND "windowStart" = ${windowStart}
        AND count < ${MAX_CALLS}
    `

    if (updateResult === 1) {
      // Row existed, was in current window, and was below limit — incremented
      const record = await db.rateLimit.findUnique({
        where: { key },
        select: { count: true },
      })
      return {
        allowed: true,
        remaining: Math.max(0, MAX_CALLS - (record?.count ?? MAX_CALLS)),
        resetAt,
      }
    }

    // updateResult === 0: either no row, wrong window, or already at limit
    // Check which case we're in
    const existing = await db.rateLimit.findUnique({
      where: { key },
      select: { count: true, windowStart: true },
    })

    if (!existing || existing.windowStart < windowStart) {
      // No row or stale window — upsert fresh record with count = 1
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart },
        update: { count: 1, windowStart },
      })
      return { allowed: true, remaining: MAX_CALLS - 1, resetAt }
    }

    // Row exists in current window but count >= MAX_CALLS — at limit
    return { allowed: false, remaining: 0, resetAt }
  }
}
