// lib/rate-limit.ts
//
// Sliding window rate limiter backed by PostgreSQL.
// Max AI calls per userId per hour: configurable via MAX_AI_CALLS_PER_HOUR env.
//
// PERF FIX 3: Correctness bug fixed.
//
// ORIGINAL BUG: The upsert ALWAYS wrote `windowStart` to the new window value,
// regardless of whether the window had actually rolled over. This meant
// `record.windowStart < windowStart` was ALWAYS false after the upsert because
// the upsert had just set them to the same value. The reset branch never ran.
// Counts incremented forever, never resetting hourly as intended.
//
// FIX: Read first, then write once with the correct logic.
// A single read + conditional write replaces the buggy double-write pattern.

import { db } from './db'

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_CALLS = parseInt(process.env.MAX_AI_CALLS_PER_HOUR ?? '15')

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const key = `ai:${userId}`
  const now = new Date()
  const windowStart = new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS)
  const resetAt = new Date(windowStart.getTime() + WINDOW_MS)

  // Read the current record
  const existing = await db.rateLimit.findUnique({ where: { key } })

  if (!existing || existing.windowStart < windowStart) {
    // No record yet, or the window has rolled over — start fresh at 1
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart },
      update: { count: 1, windowStart },
    })
    return { allowed: true, remaining: MAX_CALLS - 1, resetAt }
  }

  // Within the same window — increment
  const updated = await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })

  const allowed = updated.count <= MAX_CALLS
  const remaining = Math.max(0, MAX_CALLS - updated.count)

  return { allowed, remaining, resetAt }
}
