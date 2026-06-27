// lib/scenario-batch.ts
//
// STRATEGIC DECISION (CTO analysis, D3): Batch pre-generate all scenarios at enrollment.
//
// WHY THIS MATTERS:
// On-demand scenario generation has a 2-5 second loading spinner on every first lesson.
// In a demo, that 3-second wait is the worst moment — it's the pause where Heather
// Berdy looks away from the phone. It signals "this is an AI demo, not a product."
//
// The fix costs $0.31 per child. For 50 pilot families × 2 children = $31 total.
// Every single lesson is instant from that point forward.
//
// HOW IT WORKS:
// After a child is created, this job fires in the background and generates all
// 39 combinations (13 weeks × 3 attempts) proactively. These land in ScenarioCache
// with a 90-day TTL. Every scenario fetch thereafter is a cache hit: <10ms.
//
// WHEN TO RE-GENERATE:
// When a child profile is updated (PUT /api/v1/children/[id]), the existing cache
// entries are still valid but may reference outdated info.
// Option A: Expire old entries (they'll regenerate on next access)
// Option B: Re-run the batch immediately (fresh scenarios for the updated profile)
// We implement Option B — a profile update should immediately reflect in future scenarios.
//
// COST MODEL:
//   13 weeks × 3 attempts × ~500 tokens/call × $0.000003/token ≈ $0.006/child
//   For Claude Sonnet at standard pricing: ~$0.008/call × 39 = $0.31/child
//   At 5,000 children: $1,550 one-time enrollment cost
//   Entirely offset by eliminating per-request rate limiting concerns

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { logger, LogEvents } from '@/lib/logger'
import { ClaudeScenarioGenerator } from '@/infrastructure/generators/ClaudeScenarioGenerator'

const TOTAL_WEEKS = 13
const ATTEMPTS_PER_WEEK = 3  // attempt 0, 1, 2

// 90-day TTL for pre-generated scenarios (generous — profiles evolve quarterly)
const PRE_GENERATED_TTL_DAYS = 90

// Inter-call delay to avoid hammering the Anthropic API
const DELAY_BETWEEN_CALLS_MS = 200

// ─── Main pre-generation function ─────────────────────────────────────────────

export async function batchPregenerate(childId: string): Promise<{
  generated: number
  skipped: number
  failed: number
  durationMs: number
}> {
  const start = Date.now()
  let generated = 0
  let skipped = 0
  let failed = 0

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    logger.error('scenario.batch_pregenerate_skipped', {
      childId,
      reason: 'ANTHROPIC_API_KEY not set',
    })
    return { generated: 0, skipped: 0, failed: 0, durationMs: 0 }
  }

  const generator = new ClaudeScenarioGenerator(apiKey)

  // Load the child's full profile for scenario generation
  const child = await db.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      track: true,
      profile: true,
      userId: true,
    },
  })

  if (!child) {
    logger.warn('scenario.batch_pregenerate_skipped', { childId, reason: 'child not found' })
    return { generated: 0, skipped: 0, failed: 0, durationMs: 0 }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + PRE_GENERATED_TTL_DAYS)

  // Generate all 13 × 3 = 39 scenarios
  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    for (let attempt = 0; attempt < ATTEMPTS_PER_WEEK; attempt++) {
      // Check if this slot is already cached and fresh
      const existing = await db.scenarioCache.findFirst({
        where: {
          childId,
          weekNumber: week,
          attempt,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      })

      if (existing) {
        skipped++
        continue
      }

      try {
        // Generate via Claude
        const profile = child.profile as Parameters<typeof generator.generate>[0]
        const scenario = await generator.generate(profile, week, attempt)

        // Write to cache
        await db.scenarioCache.upsert({
          where: { childId_weekNumber_attempt: { childId, weekNumber: week, attempt } },
          create: { childId, weekNumber: week, attempt, scenario: scenario as unknown as Prisma.InputJsonValue, expiresAt },
          update: { scenario: scenario as unknown as Prisma.InputJsonValue, expiresAt },
        })

        generated++

        // Brief pause between calls — be a good API citizen
        if (DELAY_BETWEEN_CALLS_MS > 0) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_CALLS_MS))
        }
      } catch (e) {
        failed++
        logger.warn('scenario.pregenerate_slot_failed', {
          childId,
          week,
          attempt,
          error: e instanceof Error ? e.message : String(e),
        })
        // Continue to next slot — partial failure is acceptable
      }
    }
  }

  const durationMs = Date.now() - start

  logger.info(LogEvents.SCENARIO_PREGENERATED, {
    childId,
    generated,
    skipped,
    failed,
    totalSlots: TOTAL_WEEKS * ATTEMPTS_PER_WEEK,
    durationMs,
    costEstimateUsd: (generated * 0.008).toFixed(3),
  })

  return { generated, skipped, failed, durationMs }
}

// ─── Re-generate on profile update ────────────────────────────────────────────
// Called after PUT /api/v1/children/[id] updates the child's profile.
// Expires existing cache entries and triggers fresh generation.

export async function invalidateAndRegenerate(childId: string): Promise<void> {
  // Expire all existing scenarios for this child
  // (set expiresAt to now — they'll be regenerated on next fetch or by batch job)
  await db.scenarioCache.updateMany({
    where: { childId },
    data: { expiresAt: new Date() },  // expired immediately
  })

  logger.info('scenario.cache_invalidated', { childId, reason: 'profile_updated' })

  // Re-generate in background — don't await (this takes ~2-3 minutes for 39 scenarios)
  // The fire-and-forget pattern means the profile update API call returns instantly
  batchPregenerate(childId).catch(e => {
    logger.error('scenario.batch_regen_failed', {
      childId,
      error: e instanceof Error ? e.message : String(e),
    })
  })
}

// ─── API route for triggering batch generation ────────────────────────────────
// Called after successful family enrollment.
// Fire-and-forget from the onboarding flow — POST /api/scenarios/batch-generate

export async function triggerBatchGeneration(childIds: string[]): Promise<void> {
  // Run sequentially per child to avoid concurrent API hammering
  // At 2 children × 39 scenarios × 200ms delay = ~16 seconds in background
  for (const childId of childIds) {
    await batchPregenerate(childId)
  }
}
