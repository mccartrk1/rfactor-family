// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('[NEXTAUTH_ERROR]', code, JSON.stringify(message))
    },
    warn(code) {
      console.warn('[NEXTAUTH_WARN]', code)
    },
    debug(code, ...message) {
      console.log('[NEXTAUTH_DEBUG]', code, JSON.stringify(message))
    },
  },
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
}
