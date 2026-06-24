// infrastructure/cache/DatabaseScenarioCache.ts
//
// Implements IScenarioCache using PostgreSQL via Prisma.
// TTL is enforced on read: expired entries are treated as misses.
// Cleanup is handled separately by the cron job.

import type { IScenarioCache } from '@/application/ports/IScenarioCache'
import type { ScenarioPayload } from '@/application/ports/IScenarioGenerator'
import { db } from '@/lib/db'

const TTL_DAYS = parseInt(process.env.SCENARIO_CACHE_TTL_DAYS ?? '30')

export class DatabaseScenarioCache implements IScenarioCache {
  async get(
    childId: string,
    weekNumber: number,
    attempt: number
  ): Promise<ScenarioPayload | null> {
    // OPTIMIZATION: expiresAt check moved into the WHERE clause.
    // Old: fetch row, compare expiresAt in JavaScript.
    // New: PostgreSQL filters expired rows using the idx_scenario_cache_expires index.
    // Expired rows never make the round trip to the application.
    const record = await db.scenarioCache.findFirst({
      where: {
        childId,
        weekNumber,
        attempt,
        expiresAt: { gt: new Date() },
      },
      select: { scenario: true },
    })

    return record ? (record.scenario as ScenarioPayload) : null
  }

  async set(
    childId: string,
    weekNumber: number,
    attempt: number,
    scenario: ScenarioPayload
  ): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TTL_DAYS)

    await db.scenarioCache.upsert({
      where: { childId_weekNumber_attempt: { childId, weekNumber, attempt } },
      create: { childId, weekNumber, attempt, scenario: scenario as object, expiresAt },
      update: { scenario: scenario as object, expiresAt },
    })
  }

  // Called by /api/cron/cleanup — deletes expired cache entries
  async clean(): Promise<number> {
    const result = await db.scenarioCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return result.count
  }

  async exists(childId: string, weekNumber: number, attempt: number): Promise<boolean> {
    const record = await db.scenarioCache.findUnique({
      where: { childId_weekNumber_attempt: { childId, weekNumber, attempt } },
      select: { expiresAt: true },
    })
    return !!record && record.expiresAt > new Date()
  }
}

// Standalone export for backward compatibility with legacy callers
export async function cleanExpiredCache(): Promise<number> {
  return new DatabaseScenarioCache().clean()
}
