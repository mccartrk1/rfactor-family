// app/page.tsx
//
// BUG 11 FIX: The previous version called getServerSession() here, adding a DB
// query on every root hit. The middleware already makes this decision at the edge
// using the JWT token (zero DB queries). This page's server component was
// redundant — it ran AFTER the middleware and duplicated its work.
//
// The middleware's authorized() callback allows '/' through (returns true), so
// this server component runs, then reads the session from the DB, then redirects.
// That's two auth checks per root hit.
//
// Fix: Let the middleware handle root redirects by not returning true for '/'.
// This page becomes a static fallback only hit when middleware hasn't redirected.

import { redirect } from 'next/navigation'

// If we ever reach here, middleware didn't redirect, meaning no token — go to login.
export default function RootPage() {
  redirect('/auth/login')
}
