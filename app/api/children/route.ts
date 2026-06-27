// app/api/children/route.ts
//
// Thin HTTP adapter. Three responsibilities only:
//   1. Parse the HTTP request
//   2. Resolve the authenticated session
//   3. Call the use case, serialize the result
//
// Invite validation, transaction logic, and child profile validation
// all live in CreateFamilyUseCase and its dependencies.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createFamilyUseCase, familyRepository } from '@/lib/container'
import { sendWelcomeEmail } from '@/lib/email'
import { initializeTrial } from '@/lib/subscription'
import { logger, LogEvents } from '@/lib/logger'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // SECURITY FIX: Use select projection — only return fields the client needs.
  // Previously returned ALL child fields including flashPoint (biggest home trigger),
  // trustedAdults, hardThing (something scary) — personal info the dashboard doesn't need.
  // Scenario generation happens server-side; clients only need id + name + track.
  // Profile fields live inside the JSONB `profile` column. Select `profile` and
  // `track`, then flatten only the fields the client needs.
  const family = await db.family.findUnique({
    where: { userId: session.user.id },
    select: {
      children: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          track: true,
          createdAt: true,
          profile: true,
        },
      },
    },
  })

  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const children = (family?.children ?? []).map((c: { id: string; track: string; createdAt: Date; profile: unknown }) => {
    const p = (c.profile as Record<string, unknown> | null) ?? {}
    return {
      id: c.id,
      name: str(p.name),
      familyName: str(p.familyName),
      age: str(p.age),
      grade: str(p.grade),
      school: str(p.school),
      track: c.track,
      createdAt: c.createdAt,
      // Profile fields needed for onboarding completion UI
      mascot: str(p.mascot),
      bestFriend: str(p.bestFriend),
      siblings: str(p.siblings),
    }
  })

  return NextResponse.json({ children })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Upsert user record — JWT mode has no database adapter so NextAuth
  // never writes a User row. Create it here so the Family foreign key works.
  await db.user.upsert({
    where: { id: session.user.id },
    update: { name: session.user.name ?? null, email: session.user.email ?? null },
    create: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    },
  })

  // Find out whether this user already has a family (determines invite code requirement)
  const existingFamily = await familyRepository.findByUserId(session.user.id)

  const result = await createFamilyUseCase.execute({
    userId: session.user.id,
    userName: session.user.name ?? null,
    childData: body,
    inviteCode: body.inviteCode as string | undefined,
    isNewFamily: !existingFamily,
    existingFamilyId: existingFamily?.id,
  })

  if (!result.success) {
    const status = result.code === 'CONFLICT' ? 409
      : result.code === 'VALIDATION' ? 400
      : 403
    return NextResponse.json({ error: result.error }, { status })
  }

  // Initialize trial on first child creation (14 days from first use)
  if (result.success && !existingFamily) {
    initializeTrial(session.user.id).catch(e => 
      logger.error('subscription.trial_init_failed', { error: String(e) })
    )
  }

  // Fire-and-forget welcome email on first child creation
  // Not awaited — email failure should never block enrollment response
  if (result.success && !existingFamily && session.user.email) {
    sendWelcomeEmail({
      to: session.user.email,
      familyName: String(body.familyName ?? session.user.name ?? 'Family'),
      childName: String(body.name ?? 'your child'),
      weekOneTitle: 'E + R = O — The Formula',
    }).catch(e => logger.error('email.welcome_failed', { error: String(e) }))
  }

  return NextResponse.json({ child: { id: result.childId } }, { status: 201 })
}
