// infrastructure/generators/ClaudeScenarioGenerator.ts
//
// Implements IScenarioGenerator using the Anthropic Claude API.
//
// FIXES:
//   1. API key validated at startup (constructor), not at first request
//   2. Model configurable via ANTHROPIC_MODEL env var — no deploy needed to change
//   3. AbortSignal.timeout(30_000) prevents hanging indefinitely on slow responses
//   4. Typed response parsing with defensive fallback
//   5. Structured error messages include HTTP status for easier debugging

import type { IScenarioGenerator, ScenarioPayload } from '@/application/ports/IScenarioGenerator'
import type { ChildProfileData } from '@/domain/entities/ChildProfile'
import { buildPrompt } from '@/lib/prompt'
import { logger, LogEvents } from '@/lib/logger'
import { repairJSON, validateScenarioPayload } from '@/lib/json'

const DEFAULT_MODEL   = 'claude-sonnet-4-6'
const REQUEST_TIMEOUT = 30_000 // 30 seconds — beyond this, Claude is unhealthy

export class ClaudeScenarioGenerator implements IScenarioGenerator {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model?: string) {
    // FIX 1: Validate at construction time, not first request.
    // In container.ts this runs at module-load. A missing key fails the
    // import with a clear message rather than a cryptic 500 at request time.
    if (!apiKey) {
      throw new Error(
        'ClaudeScenarioGenerator: ANTHROPIC_API_KEY is not set. ' +
        'Add it to your .env.local or Vercel environment variables.'
      )
    }
    this.apiKey = apiKey
    // FIX 2: Model from env var. Change model without a code deploy.
    this.model = model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
  }

  async generate(
    profile: ChildProfileData,
    weekNumber: number,
    attempt: number
  ): Promise<ScenarioPayload> {
    // FIX 3: 30-second timeout. Prevents serverless function from hanging
    // indefinitely and burning wall-clock time on a stalled Claude request.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const callStart = Date.now()
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 800,
          messages: [{ role: 'user', content: buildPrompt(profile, weekNumber, attempt) }],
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        // FIX 5: Include HTTP status in error message for debugging
        const err = await res.json().catch(() => ({}))
        const apiMsg = (err as { error?: { message?: string } })?.error?.message
        throw new Error(`Claude API error ${res.status}: ${apiMsg ?? 'Unknown error'}`)
      }

      const data = await res.json()
      const raw = (data.content as Array<{ type: string; text?: string }>)
        .find(b => b.type === 'text')?.text ?? ''

      if (!raw) throw new Error('Claude returned empty response')

      const parsed = JSON.parse(repairJSON(raw))
      logger.info(LogEvents.SCENARIO_GENERATED, {
        weekNumber,
        attempt,
        model: this.model,
        durationMs: Date.now() - callStart,
      })
      return validateScenarioPayload(parsed)

    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        logger.error(LogEvents.CLAUDE_TIMEOUT, {
          weekNumber,
          attempt,
          durationMs: REQUEST_TIMEOUT,
        })
        throw new Error(`Claude API timed out after ${REQUEST_TIMEOUT / 1000}s`)
      }
      logger.error(LogEvents.CLAUDE_ERROR, {
        weekNumber,
        attempt,
        error: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - callStart,
      })
      throw e
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
