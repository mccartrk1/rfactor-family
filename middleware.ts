// middleware.ts
// Edge middleware — runs before any page renders.
//
// RESPONSIBILITY 1: Authentication
//   Routes require auth. Unauthenticated requests redirect to /auth/login.
//   Admin routes additionally require email in ADMIN_EMAILS.
//
// RESPONSIBILITY 2: Root redirect
//   / → /dashboard (authenticated) or /auth/login (unauthenticated)
//   Handled at the edge using the JWT token — zero DB cost.
//
// RESPONSIBILITY 3: Public routes
//   /auth/*, /api/auth/*, /api/v1/invites/validate, /api/v1/waitlist,
//   /api/webhooks/stripe, /pricing, /join/*, /unsubscribed
//   All public — no auth required.
//
// NOTE: Subscription gating is NOT done here (middleware runs at the Edge
// without Node.js APIs, can't query Postgres).
// Subscription checks happen in server components using getSubscriptionStatus().
// This is correct — middleware handles auth, components handle subscription.

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Routes that don't require authentication
const PUBLIC_PREFIXES = [
  '/auth/',
  '/api/auth/',
  '/api/v1/invites/validate',
  '/api/v1/waitlist',
  '/api/webhooks/',
  '/pricing',
  '/join/',           // referral landing pages
  '/unsubscribed',    // email unsubscribe confirmation
  '/trial-expired',   // shown to expired users before they upgrade
]

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/pricing') return true
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const isAuthenticated = !!req.nextauth.token

    // Root redirect
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(isAuthenticated ? '/dashboard' : '/auth/login', req.url)
      )
    }

    // Authenticated users who hit login page go to dashboard
    if (pathname === '/auth/login' && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes — always allowed
        if (isPublicRoute(pathname)) return true

        // Admin routes: auth + admin email required
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
          if (!token) return false
          const adminEmails = (process.env.ADMIN_EMAILS ?? '')
            .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
          return adminEmails.includes((token.email as string ?? '').toLowerCase())
        }

        // Billing routes: require auth only (subscription state handled in component)
        if (pathname.startsWith('/billing') || pathname.startsWith('/pricing')) {
          return !!token
        }

        // All other routes require authentication
        return !!token
      },
    },
    pages: { signIn: '/auth/login', },
  }
)

export const config = {
  // Match all paths except static assets and images
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
}
