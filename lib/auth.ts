// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'database',
    // HIGH-03 FIX: Reduce session lifetime from NextAuth default (30 days)
    // to 7 days. A stolen session cookie expires sooner.
    // Families actively using the app re-authenticate weekly at most.
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    // Update session expiry on activity — active users don't get logged out
    updateAge: 24 * 60 * 60,  // refresh every 24 hours of activity
  },
  cookies: {
    // Enforce secure, HttpOnly, SameSite=Lax on session cookie
    // NextAuth sets these by default in production; explicit here for clarity
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
