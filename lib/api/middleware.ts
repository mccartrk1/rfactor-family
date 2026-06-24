// lib/api/middleware.ts
//
// Composable middleware for Next.js App Router route handlers.
//
// Before: getServerSession() repeated in 8 route files.
// After:  wrap the handler, session is passed in typed.
//
// Usage patterns:
//
//   Simple auth (no params):
//     export const GET = withAuth(async (req, session) => ok({ hello: session.user.id }))
//
//   Auth with URL params:
//     export const GET = withParams(withAuth(async (req, session, ctx) => {
//       const { childId } = ctx.params
//       ...
//     }))
//
//   Auth + ownership check:
//     export const GET = withOwnership(async (req, session, ctx) => {
//       // ctx.childId is verified — belongs to session user
//     })
//
//   Admin only:
//     export const GET = withAdmin(async (req, adminEmail) => { ... })
//
//   Body parsing:
//     export const POST = withAuth(withBody(MySchema)(async (req, session, body) => { ... }))

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isAdminEmail, logAdminAccess } from '@/lib/admin'
import { err, requestId } from './index'
import type { Session } from 'next-auth'

// ─── Type definitions ─────────────────────────────────────────────────────────

export type AuthedHandler = (
  req: NextRequest,
  session: Session
) => Promise<NextResponse>

export type AdminHandler = (
  req: NextRequest,
  adminEmail: string
) => Promise<NextResponse>

export type ParamHandler<P extends Record<string, string>> = (
  req: NextRequest,
  session: Session,
  params: P
) => Promise<NextResponse>

export type OwnershipContext = { childId: string }
export type OwnershipHandler = (
  req: NextRequest,
  session: Session,
  ctx: OwnershipContext
) => Promise<NextResponse>

// ─── withAuth ─────────────────────────────────────────────────────────────────
// Wraps a handler, verifies session, injects typed session object.
// Returns 401 if no valid session.

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return err('UNAUTHORIZED', 'Authentication required')
    }
    return handler(req, session)
  }
}

// ─── withAdmin ────────────────────────────────────────────────────────────────
// Wraps a handler, verifies admin email, injects adminEmail string.
// Returns 401 if no session, 403 if not in ADMIN_EMAILS.

export function withAdmin(action: string, handler: AdminHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return err('UNAUTHORIZED', 'Authentication required')
    }
    if (!isAdminEmail(session.user.email)) {
      return err('FORBIDDEN', 'Admin access required')
    }
    logAdminAccess(action, session.user.email, req.url)
    return handler(req, session.user.email)
  }
}

// ─── withParams ───────────────────────────────────────────────────────────────
// Adapts a handler that expects separate params arg to Next.js App Router
// context format. Used with withAuth for parameterized routes.

export function withParams<P extends Record<string, string>>(
  handler: ParamHandler<P>
) {
  return (authedHandler: AuthedHandler) => {
    return async (req: NextRequest, ctx: { params: P }): Promise<NextResponse> => {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return err('UNAUTHORIZED', 'Authentication required')
      }
      return handler(req, session, ctx.params)
    }
  }
}

// ─── withOwnership ────────────────────────────────────────────────────────────
// Verifies that the childId URL param belongs to the authenticated user.
// Uses the denormalized userId column on Child for a direct index lookup.

export function withOwnership(
  handler: OwnershipHandler
) {
  return async (req: NextRequest, ctx: { params: { childId: string } }): Promise<NextResponse> => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return err('UNAUTHORIZED', 'Authentication required')
    }

    const { childId } = ctx.params
    const owned = await db.child.findFirst({
      where: { id: childId, userId: session.user.id },
      select: { id: true },
    })

    if (!owned) {
      return err('NOT_FOUND', 'Child not found')
    }

    return handler(req, session, { childId })
  }
}

// ─── withBody ─────────────────────────────────────────────────────────────────
// Parses and optionally validates the request body.
// Returns 400 on parse failure or validation failure.

export type BodyValidator<T> = (raw: unknown) => { ok: true; data: T } | { ok: false; errors: Record<string, string> }

export function withBody<T>(validator: BodyValidator<T>) {
  return (
    handler: (req: NextRequest, session: Session, body: T) => Promise<NextResponse>
  ): AuthedHandler => {
    return async (req: NextRequest, session: Session): Promise<NextResponse> => {
      let raw: unknown
      try {
        raw = await req.json()
      } catch {
        return err('VALIDATION_ERROR', 'Invalid JSON in request body')
      }

      const result = validator(raw)
      if (!result.ok) {
        return err('VALIDATION_ERROR', 'Request validation failed', 400, result.errors)
      }

      return handler(req, session, result.data)
    }
  }
}

// ─── withAdminAndBody ─────────────────────────────────────────────────────────
// Combines admin auth + body parsing for admin mutation endpoints.

export function withAdminAndBody<T>(action: string, validator: BodyValidator<T>) {
  return (
    handler: (req: NextRequest, adminEmail: string, body: T) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) return err('UNAUTHORIZED', 'Authentication required')
      if (!isAdminEmail(session.user.email)) return err('FORBIDDEN', 'Admin access required')
      logAdminAccess(action, session.user.email)

      let raw: unknown
      try { raw = await req.json() } catch {
        return err('VALIDATION_ERROR', 'Invalid JSON in request body')
      }

      const result = validator(raw)
      if (!result.ok) return err('VALIDATION_ERROR', 'Validation failed', 400, result.errors)

      return handler(req, session.user.email, result.data)
    }
  }
}

// ─── withAdminParams ─────────────────────────────────────────────────────────
// Admin middleware for routes with URL params (e.g., /admin/families/:id)

export function withAdminParams<P extends Record<string, string>>(
  action: string,
  handler: (req: NextRequest, adminEmail: string, params: P) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: P }): Promise<NextResponse> => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return err('UNAUTHORIZED', 'Authentication required')
    if (!isAdminEmail(session.user.email)) return err('FORBIDDEN', 'Admin access required')
    logAdminAccess(action, session.user.email, JSON.stringify(ctx.params))
    return handler(req, session.user.email, ctx.params)
  }
}
