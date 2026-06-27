import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // ── Login-protected email test ────────────────────────────────────────────
  // Visit /api/test?email=1 while signed in to confirm Resend delivery.
  // Safe: it ONLY emails the signed-in user's own address — never an arbitrary
  // recipient, so it cannot be used to send mail to anyone else.
  // Remove this branch once email delivery is verified.
  if (url.searchParams.get('email')) {
    const session = await getServerSession(authOptions)
    const to = session?.user?.email
    if (!to) {
      return Response.json(
        { ok: false, error: 'Sign in first — this endpoint only emails your own address.' },
        { status: 401 }
      )
    }
    const result = await sendWelcomeEmail({
      to,
      familyName: 'Test',
      childName: 'your test learner',
      weekOneTitle: 'E + R = O — The Formula',
    })
    return Response.json({ ok: result.success, result, sentTo: to })
  }

  // ── Env diagnostic ─────────────────────────────────────────────────────────
  return Response.json({
    has_secret: !!process.env.NEXTAUTH_SECRET,
    secret_length: process.env.NEXTAUTH_SECRET?.length ?? 0,
    has_google_id: !!process.env.GOOGLE_CLIENT_ID,
    has_google_secret: !!process.env.GOOGLE_CLIENT_SECRET,
    has_resend_key: !!process.env.RESEND_API_KEY,
    resend_from: process.env.RESEND_FROM_EMAIL ?? null,
    nextauth_url: process.env.NEXTAUTH_URL,
    node_env: process.env.NODE_ENV,
  })
}
