// app/api/scenario/route.ts
//
// Thin HTTP adapter. Responsibilities:
//   1. Parse and validate the HTTP request
//   2. Resolve the authenticated user
//   3. Call the use case
//   4. Serialize the HTTP response
//
// Zero business logic. Zero Prisma. Zero Claude. All of that lives in the
// application and infrastructure layers, wired up in lib/container.ts.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { childRepository, getScenarioUseCase } from '@/lib/container'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { childId, weekNumber, attempt = 0 } = body

  if (!childId || typeof weekNumber !== 'number' || weekNumber < 1 || weekNumber > 13) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Ownership check — verifies child belongs to this user
  const child = await childRepository.findByIdForUser(childId, session.user.id as string)
  if (!child) {
    return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  }

  const result = await getScenarioUseCase.execute({
    profile: child,
    childId,
    weekNumber,
    attempt,
    userId: session.user.id,
  })

  switch (result.source) {
    case 'rate_limited':
      return NextResponse.json({ error: result.error }, { status: 429 })
    case 'error':
      return NextResponse.json({ error: result.error }, { status: 500 })
    default:
      return NextResponse.json({ scenario: result.scenario, source: result.source })
  }
}
