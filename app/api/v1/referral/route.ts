// app/api/v1/referral/route.ts
//
// Viral referral system — families invite families.
//
// HOW IT WORKS:
//   1. Every authenticated family gets a unique referral code (e.g., "mccarty7")
//   2. Sharing URL: rfactorfamily.com/join/mccarty7
//   3. When a new family signs up via the code, both get a reward
//   4. Referrer reward: 1 free month or $10 account credit
//   5. Referee reward: extended trial (21 days instead of 14)
//
// GROWTH LOOP:
//   Families share to other school parents, church friends, sports teams
//   Each referral that converts adds to the viral coefficient
//   Target: K > 1.0 (each family brings in more than 1 new family)
//
// SCHEMA (requires migration 007):
//   User.referralCode: String unique
//   Referral: { referrerId, refereeId, status, createdAt }

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { logger } from '@/lib/logger'

// Generate a referral code from family name + random suffix
function generateCode(familyName: string): string {
  const base = familyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
  const suffix = Math.floor(Math.random() * 900 + 100)  // 100-999
  return `${base}${suffix}`
}

// GET: get or create referral code + stats for current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Authentication required')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      referralCode: true,
      family: { select: { familyName: true } },
    } as any,
  })

  if (!user) return err('NOT_FOUND', 'User not found')

  let code = (user as any).referralCode as string | null

  // Generate code if doesn't exist yet
  if (!code) {
    const familyName = (user as any).family?.familyName ?? user.name ?? 'family'
    let newCode = generateCode(familyName)

    // Retry if collision
    for (let i = 0; i < 5; i++) {
      const exists = await db.user.findFirst({ where: { referralCode: newCode } as any })
      if (!exists) break
      newCode = generateCode(familyName)
    }

    await db.user.update({ where: { id: session.user.id }, data: { referralCode: newCode } as any })
    code = newCode
  }

  // Count referrals this user has generated
  const referralCount = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Referral"
    WHERE "referrerId" = ${session.user.id}
  `.catch(() => [{ count: BigInt(0) }])

  const count = Number(referralCount[0]?.count ?? 0)
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://rfactorfamily.com'

  return ok({
    code,
    shareUrl: `${baseUrl}/join/${code}`,
    referralCount: count,
    reward: count > 0 ? `${count} family${count > 1 ? 'ies' : ''} joined — you've earned ${count} free month${count > 1 ? 's' : ''}!` : null,
  })
}

// POST: apply a referral code when a new family signs up
// Called during onboarding if user arrived via /join/[code]
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Authentication required')

  let code: string
  try {
    const body = await req.json()
    code = String(body.code ?? '').trim().toLowerCase()
  } catch {
    return err('VALIDATION_ERROR', 'Invalid request body')
  }

  if (!code) return err('VALIDATION_ERROR', 'Referral code required')

  // Find referrer by code
  const referrer = await db.user.findFirst({
    where: { referralCode: code } as any,
    select: { id: true },
  })

  if (!referrer) return err('NOT_FOUND', 'Referral code not found')
  if (referrer.id === session.user.id) return err('VALIDATION_ERROR', 'Cannot refer yourself')

  try {
    // Record referral (idempotent: one referee can only be referred once)
    await db.$executeRaw`
      INSERT INTO "Referral" (id, "referrerId", "refereeId", status, "createdAt")
      VALUES (gen_random_uuid()::TEXT, ${referrer.id}, ${session.user.id}, 'pending', NOW())
      ON CONFLICT ("refereeId") DO NOTHING
    `

    logger.info('referral.applied', { referrerId: referrer.id, refereeId: session.user.id })

    return ok({ applied: true, message: 'Referral applied. Your trial has been extended to 21 days.' })
  } catch (e) {
    logger.error('referral.error', { error: String(e) })
    return err('INTERNAL_ERROR', 'Could not apply referral code')
  }
}
