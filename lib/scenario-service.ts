// lib/scenario-service.ts
//
// LEGACY FACADE — delegates to the clean architecture layer.
//
// This file exists only to preserve the import contracts of
// app/api/cron/cleanup/route.ts and app/api/scenario/pregenerate/route.ts
// which have not been migrated to import directly from the container.
//
// Do not add logic here. Migrate callers to import from:
//   @/infrastructure/cache/DatabaseScenarioCache
//   @/lib/container (for use cases)
//
// TODO: Remove this file once all callers are migrated.

export { cleanExpiredCache } from '@/infrastructure/cache/DatabaseScenarioCache'

import { db } from './db'
import { buildPrompt } from './prompt'
import { repairJSON } from './json'
import { DatabaseRateLimiter } from '@/infrastructure/limiters/DatabaseRateLimiter'
import { toChildProfile } from './child'
import type { Child } from '@prisma/client'
import type { ScenarioPayload } from '@/types'

const CACHE_TTL_DAYS = parseInt(process.env.SCENARIO_CACHE_TTL_DAYS ?? '30', 10)
const rateLimiter = new DatabaseRateLimiter()

// Re-export for pregenerate route
export async function pregenerateNext(
  child: Child,
  completedWeekNumber: number,
  userId: string
): Promise<void> {
  const nextWeek = completedWeekNumber + 1
  if (nextWeek > 13) return

  const existing = await db.scenarioCache.findUnique({
    where: { childId_weekNumber_attempt: { childId: child.id, weekNumber: nextWeek, attempt: 0 } },
    select: { expiresAt: true },
  })
  if (existing && existing.expiresAt > new Date()) return

  const limit = await rateLimiter.check(`ai:${userId}`)
  if (!limit.allowed) return

  try {
    const profile = toChildProfile(child)
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6', max_tokens: 800,
          messages: [{ role: 'user', content: buildPrompt(profile, nextWeek, 0) }] }),
        signal: controller.signal,
      })
      if (!res.ok) return

      const data = await res.json()
      const raw = (data.content as Array<{ type: string; text?: string }>).find(b => b.type === 'text')?.text ?? ''
      if (!raw) return

      const scenario = JSON.parse(repairJSON(raw)) as ScenarioPayload
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS)

      await db.scenarioCache.upsert({
        where: { childId_weekNumber_attempt: { childId: child.id, weekNumber: nextWeek, attempt: 0 } },
        create: { childId: child.id, weekNumber: nextWeek, attempt: 0, scenario: scenario as object, expiresAt },
        update: { scenario: scenario as object, expiresAt },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch {
    // Best-effort — pregeneration failure is not fatal
  }
}
