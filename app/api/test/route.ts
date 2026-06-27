export const runtime = 'nodejs'

// Retired diagnostic endpoint. It was used during email setup to confirm which
// environment variables were present. It now returns 404 so it discloses
// nothing about the deployment. Check the Vercel dashboard for env state.
export async function GET() {
  return new Response('Not found', { status: 404 })
}
