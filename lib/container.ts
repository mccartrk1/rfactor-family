// lib/container.ts — Composition root.
//
// FIX: Environment validation at module load.
// Missing required vars fail loudly at startup, not on first request.
//
// Required env vars are validated here. Optional ones use safe defaults.
// This means a misconfigured deployment fails immediately on cold start
// rather than returning cryptic 500s to families during a lesson.

import { ClaudeScenarioGenerator }   from '@/infrastructure/generators/ClaudeScenarioGenerator'
import { DatabaseScenarioCache }      from '@/infrastructure/cache/DatabaseScenarioCache'
import { DatabaseRateLimiter }        from '@/infrastructure/limiters/DatabaseRateLimiter'
import { PrismaChildRepository }      from '@/infrastructure/repositories/PrismaChildRepository'
import { PrismaFamilyRepository }     from '@/infrastructure/repositories/PrismaFamilyRepository'
import { GetScenarioUseCase }         from '@/application/use-cases/GetScenarioUseCase'
import { CreateFamilyUseCase }        from '@/application/use-cases/CreateFamilyUseCase'

// ─── Env validation ───────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Add it to .env.local (development) or your Vercel project settings (production).`
    )
  }
  return value
}

// ─── Infrastructure ───────────────────────────────────────────────────────────

const scenarioGenerator = new ClaudeScenarioGenerator(
  requireEnv('ANTHROPIC_API_KEY')
  // Model is read from ANTHROPIC_MODEL env var inside the constructor
)

const scenarioCache = new DatabaseScenarioCache()
const rateLimiter   = new DatabaseRateLimiter()

// ─── Repositories ─────────────────────────────────────────────────────────────

export const childRepository  = new PrismaChildRepository()
export const familyRepository = new PrismaFamilyRepository()

// ─── Use cases ────────────────────────────────────────────────────────────────

export const getScenarioUseCase = new GetScenarioUseCase(
  scenarioGenerator,
  scenarioCache,
  rateLimiter
)

export const createFamilyUseCase = new CreateFamilyUseCase(familyRepository)
