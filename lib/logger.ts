// lib/logger.ts
//
// Structured logger for the R Factor Family App.
//
// Replaces scattered console.error() calls with JSON-structured output that:
//   - Ships to Axiom via Vercel Log Drain (production)
//   - Stays human-readable in development
//   - Always includes requestId for log correlation
//   - Always includes timestamp and severity
//
// Vercel Log Drain setup:
//   Dashboard → Project → Settings → Log Drains → Add Drain
//   URL: https://api.axiom.co/v1/datasets/rfactor-logs/ingest
//   HTTP Header: Authorization: Bearer [AXIOM_API_TOKEN]
//   Format: JSON
//
// Usage:
//   import { logger } from '@/lib/logger'
//   logger.info('scenario.generated', { childId, weekNumber, source: 'ai' })
//   logger.error('claude.timeout', { childId, weekNumber, durationMs: 31000 })
//   logger.warn('rate_limit.approaching', { userId, count, max: 15 })

const isDev = process.env.NODE_ENV !== 'production'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogEvent = Record<string, unknown>

interface LogEntry {
  level: LogLevel
  event: string
  timestamp: string
  service: 'rfactor-family'
  environment: string
  [key: string]: unknown
}

function log(level: LogLevel, event: string, data: LogEvent = {}): void {
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    service: 'rfactor-family',
    environment: process.env.NODE_ENV ?? 'development',
    ...data,
  }

  if (isDev) {
    // Human-readable in development
    const icon = { debug: '🔍', info: '📋', warn: '⚠️ ', error: '🔴' }[level]
    const extra = Object.entries(data)
      .filter(([k]) => k !== 'requestId')
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ')
    console.log(`${icon} [${level.toUpperCase()}] ${event}${extra ? ' — ' + extra : ''}`)
  } else {
    // JSON in production — Axiom/Vercel Log Drain parses this
    const output = level === 'error' ? console.error : console.log
    output(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (event: string, data?: LogEvent) => log('debug', event, data),
  info:  (event: string, data?: LogEvent) => log('info',  event, data),
  warn:  (event: string, data?: LogEvent) => log('warn',  event, data),
  error: (event: string, data?: LogEvent) => log('error', event, data),

  // Convenience: measure an async operation duration
  async time<T>(event: string, fn: () => Promise<T>, data: LogEvent = {}): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      log('info', `${event}.success`, { ...data, durationMs: Date.now() - start })
      return result
    } catch (e) {
      log('error', `${event}.failed`, {
        ...data,
        durationMs: Date.now() - start,
        error: e instanceof Error ? e.message : String(e),
      })
      throw e
    }
  },
}

// ─── Standard event names (keeps log queries consistent) ─────────────────────
//
// Use these constants instead of string literals to avoid typos:
//
// logger.info(LogEvents.SCENARIO_GENERATED, { childId, weekNumber, source })
// logger.error(LogEvents.CLAUDE_TIMEOUT,    { childId, weekNumber, durationMs })

export const LogEvents = {
  // Scenario generation
  SCENARIO_CACHE_HIT:      'scenario.cache_hit',
  SCENARIO_GENERATED:      'scenario.generated',
  SCENARIO_PREGENERATED:   'scenario.pregenerated',
  SCENARIO_FAILED:         'scenario.failed',
  CLAUDE_TIMEOUT:          'claude.timeout',
  CLAUDE_ERROR:            'claude.error',

  // Rate limiting
  RATE_LIMIT_CHECKED:      'rate_limit.checked',
  RATE_LIMIT_EXCEEDED:     'rate_limit.exceeded',

  // Auth
  USER_SIGNED_IN:          'auth.signed_in',
  USER_SIGNED_OUT:         'auth.signed_out',

  // Family management
  FAMILY_CREATED:          'family.created',
  CHILD_CREATED:           'child.created',
  CHILD_UPDATED:           'child.updated',
  CHILD_DELETED:           'child.deleted',

  // Progress
  WEEK_COMPLETED:          'progress.week_completed',
  PROGRAM_COMPLETED:       'progress.program_completed',

  // Admin
  ADMIN_ACCESS:            'admin.access',
  INVITE_CREATED:          'admin.invite_created',
  INVITE_DELETED:          'admin.invite_deleted',

  // System
  HEALTH_CHECK:            'system.health_check',
  CRON_CLEANUP:            'system.cron_cleanup',
  DB_ERROR:                'system.db_error',
  STARTUP_VALIDATION_FAILED: 'system.startup_validation_failed',
} as const

// ─── Axiom query reference ────────────────────────────────────────────────────
//
// Useful Axiom queries for production monitoring:
//
// Error rate (last 1h):
//   dataset: rfactor-logs | where level == "error" | count() by bin_auto(timestamp)
//
// Claude generation p95 latency:
//   dataset: rfactor-logs | where event == "scenario.generated"
//   | summarize percentile(durationMs, 95) by bin(1h, timestamp)
//
// Rate limit hits per day:
//   dataset: rfactor-logs | where event == "rate_limit.exceeded" | count() by bin(1d, timestamp)
//
// Families completing program (week 13):
//   dataset: rfactor-logs | where event == "progress.program_completed" | count()
