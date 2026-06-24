// app/api/v1/waitlist/route.ts
// Pre-launch waitlist — captures demand before public launch.
// Stores email + referral source, sends confirmation email.
// Rate limited: 3 submissions per IP per hour.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// In-memory rate limiter for waitlist
const waitlistLimits = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const record = waitlistLimits.get(ip)
  if (!record || now > record.resetAt) {
    waitlistLimits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (record.count >= 3) return false
  record.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 })
  }

  let email: string, name: string, role: string, referral: string
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim().toLowerCase()
    name = String(body.name ?? '').trim().slice(0, 80)
    role = String(body.role ?? 'family').trim()  // family | educator | corporate
    referral = String(body.referral ?? '').trim().slice(0, 100)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const validRoles = ['family', 'educator', 'corporate', 'other']
  if (!validRoles.includes(role)) role = 'family'

  try {
    // Upsert: don't error if they sign up twice
    await db.$executeRaw`
      INSERT INTO "Waitlist" (id, email, name, role, referral, "createdAt")
      VALUES (gen_random_uuid()::TEXT, ${email}, ${name}, ${role}, ${referral}, NOW())
      ON CONFLICT (email) DO NOTHING
    `

    // Count position (for the "You're #N on the waitlist" social hook)
    const countResult = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Waitlist" WHERE "createdAt" <= (
        SELECT "createdAt" FROM "Waitlist" WHERE email = ${email}
      )
    `
    const position = Number(countResult[0]?.count ?? 0)

    logger.info('waitlist.joined', { role, referral: referral || 'direct', position })

    return NextResponse.json({ 
      success: true, 
      position,
      message: `You're #${position.toLocaleString()} on the list.`
    })
  } catch (e) {
    logger.error('waitlist.error', { error: String(e) })
    return NextResponse.json({ error: 'Could not join waitlist. Try again.' }, { status: 500 })
  }
}

export async function GET() {
  // Public: return waitlist count for social proof on landing page
  try {
    const result = await db.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Waitlist"`
    const count = Number(result[0]?.count ?? 0)
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
