export const runtime = 'nodejs'

export async function GET() {
  return Response.json({
    has_secret: !!process.env.NEXTAUTH_SECRET,
    secret_length: process.env.NEXTAUTH_SECRET?.length ?? 0,
    has_google_id: !!process.env.GOOGLE_CLIENT_ID,
    has_google_secret: !!process.env.GOOGLE_CLIENT_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL,
    node_env: process.env.NODE_ENV,
  })
}
