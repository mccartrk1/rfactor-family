export const runtime = 'nodejs'

// Diagnostic endpoint: reports which env vars are present (booleans only, no
// secret values). The temporary login-protected email test send was removed
// after email delivery was verified in production.
export async function GET() {
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
