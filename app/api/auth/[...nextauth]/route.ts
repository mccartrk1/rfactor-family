import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const runtime = 'nodejs'

const handler = NextAuth({
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ['state'],
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
})

export async function GET(req: Request, ctx: any) {
  console.log('[AUTH] GET called', req.url)
  return handler(req, ctx)
}

export async function POST(req: Request, ctx: any) {
  console.log('[AUTH] POST called', req.url)
  return handler(req, ctx)
}
