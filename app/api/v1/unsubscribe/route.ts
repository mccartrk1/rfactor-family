// app/api/v1/unsubscribe/route.ts
//
// One-click email unsubscribe — CAN-SPAM Section 5(a)(3) compliance.
//
// HOW IT WORKS:
// Every email footer contains a link:
//   GET /api/v1/unsubscribe?token=[signed_token]
//
// The token is a base64-encoded JSON blob signed with NEXTAUTH_SECRET:
//   { userId: string, email: string, exp: number }
//
// On GET: verify token, set User.emailOptOut = true, redirect to /unsubscribed
// On POST: same, returns JSON (for programmatic use)
//
// SECURITY:
// - Token is time-limited (90 days) to prevent indefinite unsubscribe links
// - Token is HMAC-signed — cannot be forged without NEXTAUTH_SECRET
// - Does not require the user to be logged in — email recipients click directly
// - Logs the unsubscribe event for audit trail
//
// SCHEMA NOTE:
// This requires User.emailOptOut: Boolean field (see migration below).
// The cron job checks emailOptOut before sending. If true, skip that user.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const TOKEN_EXPIRY_DAYS = 90

function signToken(userId: string, email: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? ''
  const payload = JSON.stringify({
    userId,
    email,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  })
  const encoded = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('hex')
  return `${encoded}.${sig}`
}

function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET ?? ''
    const [encoded, sig] = token.split('.')
    if (!encoded || !sig) return null

    // Timing-safe signature verification
    const expectedSig = createHmac('sha256', secret).update(encoded).digest('hex')
    const sigBuf = Buffer.from(sig, 'hex')
    const expBuf = Buffer.from(expectedSig, 'hex')
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.exp < Date.now()) return null  // expired
    return { userId: payload.userId, email: payload.email }
  } catch { return null }
}

async function processUnsubscribe(token: string): Promise<{ ok: boolean; error?: string }> {
  const payload = verifyToken(token)
  if (!payload) return { ok: false, error: 'Invalid or expired unsubscribe link' }

  try {
    await db.user.update({
      where: { id: payload.userId },
      data: { emailOptOut: true } as any,  // field added in migration 006
    })
    logger.info('email.unsubscribed', { userId: payload.userId })
    return { ok: true }
  } catch (e) {
    logger.error('email.unsubscribe_failed', { userId: payload.userId, error: String(e) })
    return { ok: false, error: 'Could not process unsubscribe' }
  }
}

// GET: browser click from email footer
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const result = await processUnsubscribe(token)
  // Always redirect — success or failure — to avoid user confusion
  const dest = result.ok ? '/unsubscribed' : '/unsubscribed?error=1'
  return NextResponse.redirect(new URL(dest, req.url))
}

// POST: programmatic use
export async function POST(req: NextRequest) {
  let token: string
  try { token = (await req.json()).token ?? '' }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const result = await processUnsubscribe(token)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}

// Export for use in email template generation
export { signToken as generateUnsubscribeToken }
