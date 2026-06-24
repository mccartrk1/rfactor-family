// app/api/cron/cleanup/route.ts
//
// Deletes expired ScenarioCache entries.
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * 0" }] }
// Runs weekly at 3am Sunday. Protected by CRON_SECRET.

import { NextRequest, NextResponse } from 'next/server'
import { logger, LogEvents } from '@/lib/logger'
import { cleanExpiredCache } from '@/lib/scenario-service'
import { db } from '@/lib/db'

// Purge RateLimit rows older than 2 days.
// These are stale sliding windows that will never be active again.
// Uses the idx_rate_limit_updated_at index added in Migration 001.
async function cleanStaleRateLimits(): Promise<number> {
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const result = await db.rateLimit.deleteMany({
    where: { updatedAt: { lt: twoDaysAgo } },
  })
  return result.count
}

import { timingSafeEqual } from 'crypto'

// MED-01 FIX: Timing-safe comparison for bearer token.
// JavaScript's !== is not constant-time — an attacker observing response
// timing can extract the secret character by character.
// crypto.timingSafeEqual always takes the same time regardless of match position.
function timingSafeCompareStrings(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    // Buffers must be the same length for timingSafeEqual
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const expected   = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!timingSafeCompareStrings(authHeader, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [scenarioCount, rateLimitCount] = await Promise.all([
    cleanExpiredCache(),
    cleanStaleRateLimits(),
  ])

  const result = { scenariosDeleted: scenarioCount, rateLimitsDeleted: rateLimitCount }
  logger.info(LogEvents.CRON_CLEANUP, {
    scenariosDeleted: result.scenariosDeleted,
    rateLimitsDeleted: result.rateLimitsDeleted,
  })

  return NextResponse.json(result)
}
