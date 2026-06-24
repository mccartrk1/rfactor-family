// application/use-cases/GetScenarioUseCase.ts
//
// Orchestrates: rate limit → cache → generate → background cache write.
// Depends only on interfaces (ports). No Prisma, no Claude, no HTTP.
//
// To test: inject mocks for each port. The orchestration logic is isolated.

import type { IScenarioGenerator, ScenarioPayload } from '../ports/IScenarioGenerator'
import type { IRateLimiter } from '../ports/IRateLimiter'
import type { IScenarioCache } from '../ports/IScenarioCache'
import type { ChildProfileData } from '@/domain/entities/ChildProfile'

export type ScenarioResult =
  | { source: 'cache'; scenario: ScenarioPayload }
  | { source: 'generated'; scenario: ScenarioPayload }
  | { source: 'rate_limited'; error: string }
  | { source: 'error'; error: string }

export interface GetScenarioInput {
  profile: ChildProfileData
  childId: string
  weekNumber: number
  attempt: number
  userId: string
}

export class GetScenarioUseCase {
  constructor(
    private readonly generator: IScenarioGenerator,
    private readonly cache: IScenarioCache,
    private readonly rateLimiter: IRateLimiter
  ) {}

  async execute(input: GetScenarioInput): Promise<ScenarioResult> {
    const { profile, childId, weekNumber, attempt, userId } = input

    // 1. Rate limit — fail fast before any DB or AI work
    const limit = await this.rateLimiter.check(`ai:${userId}`)
    if (!limit.allowed) {
      return {
        source: 'rate_limited',
        error: `Too many requests. Resets at ${limit.resetAt.toLocaleTimeString()}.`,
      }
    }

    // 2. Cache hit — return immediately, no AI cost
    const cached = await this.cache.get(childId, weekNumber, attempt)
    if (cached) {
      return { source: 'cache', scenario: cached }
    }

    // 3. Generate — the expensive path
    try {
      const scenario = await this.generator.generate(profile, weekNumber, attempt)

      // 4. Background cache write — don't block the response
      this.cache.set(childId, weekNumber, attempt, scenario).catch(e =>
        console.error('ScenarioCache.set failed (non-fatal):', e)
      )

      return { source: 'generated', scenario }
    } catch (e) {
      return {
        source: 'error',
        error: e instanceof Error ? e.message : 'Generation failed',
      }
    }
  }
}
