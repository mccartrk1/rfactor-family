// app/api/v1/health/route.ts
// Public health check — used by Vercel, uptime monitors, and load balancers.
// Pings the database to confirm the full stack is operational.

import { NextResponse } from 'next/server'
import { logger, LogEvents } from '@/lib/logger'
import { db } from '@/lib/db'

const START_TIME = Date.now()

export async function GET() {
  let dbStatus: 'ok' | 'error' = 'ok'

  try {
    // SELECT 1 — lightest possible DB round trip
    await db.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'error'
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded'

  logger.info(LogEvents.HEALTH_CHECK, { status, db: dbStatus })
  return NextResponse.json(
    {
      status,
      db: dbStatus,
      version: process.env.npm_package_version ?? '0.1.0',
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }
  )
}
