// app/api/invite/route.ts
//
// SECURITY: Public endpoint for invite code pre-validation.
//
// CRIT-01 FIX: Three layers of protection against enumeration:
//
// 1. Rate limiting: max 5 checks per IP per 15 minutes.
//    An attacker gets 5 attempts before being locked out.
//    Uses a simple in-memory store at this scale; replace with Redis at scale.
//
// 2. Blind response: valid, invalid, and used codes all return the same
//    HTTP status (200) with the same response structure. The client sees
//    { valid: true/false } with no distinguishing error text on the server side.
//    Error text comes from the HTTP status + boolean, not from differentially
//    informative error strings that reveal which condition was hit.
//    (Note: client-side UX still shows helpful messages to legitimate users.)
//
// 3. Minimum response time: responses are delayed to a fixed minimum (300ms)
//    so timing differences between DB hits and misses don't leak information.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// In-memory rate limiter: IP → { count, windowStart }
// Replace with Redis/Vercel KV at scale (>1000 families)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()
const RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_MAX       = 5               // 5 attempts per 15 minutes

function checkInviteRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (record.count >= RATE_MAX) return false

  record.count += 1
  return true
}

// Minimum response time prevents timing-based enumeration
async function withMinimumDelay<T>(fn: () => Promise<T>, minMs = 300): Promise<T> {
  const start = Date.now()
  const result = await fn()
  const elapsed = Date.now() - start
  if (elapsed < minMs) {
    await new Promise(r => setTimeout(r, minMs - elapsed))
  }
  return result
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'

  if (!checkInviteRateLimit(ip)) {
    // Return 429 with a fixed delay — same timing as valid responses
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json(
      { valid: false, error: 'Too many attempts. Please wait before trying again.' },
      { status: 429 }
    )
  }

  let code: string
  try {
    const body = await req.json()
    code = String(body.code ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }

  if (!code || code.length < 4 || code.length > 32) {
    // Consistent timing — don't short-circuit before the minimum delay
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ valid: false, error: 'Invalid code format' })
  }

  // withMinimumDelay ensures valid and invalid codes take the same time
  const valid = await withMinimumDelay(async () => {
    const invite = await db.inviteCode.findUnique({
      where: { code },
      select: { usedAt: true },  // only fetch what we need
    })
    // Return the same boolean regardless of WHY it's invalid
    // The client shows appropriate UX; the attacker sees no differential
    return !!invite && !invite.usedAt
  })

  // Blind response: same structure whether invalid, used, or valid
  // The boolean is necessary for UX, but no error text differentiates conditions
  return NextResponse.json({ valid })
}
