// lib/api/index.ts
//
// The foundation of the v1 API layer.
//
// Every endpoint uses these four utilities:
//   ok(data, status?)          → standard success response
//   paginated(data, meta)      → paginated list response
//   err(code, msg, status?)    → standard error response
//   requestId()                → generates a traceable request ID
//
// The standard envelope ensures every response — success or error — has:
//   meta.requestId   → correlate client errors with server logs
//   meta.timestamp   → detect stale cached responses
//   meta.version     → which API version served this response
//
// Error codes are machine-readable strings. Clients switch on the code,
// not on the message text (which can change without a breaking change).

import { NextResponse } from 'next/server'

// ─── API version ──────────────────────────────────────────────────────────────

export const API_VERSION = '1'

// ─── Error codes ──────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'UNAUTHORIZED'       // 401 — no valid session
  | 'FORBIDDEN'          // 403 — authenticated but not authorized
  | 'NOT_FOUND'          // 404 — resource doesn't exist or ownership check failed
  | 'VALIDATION_ERROR'   // 400 — request body/params failed validation
  | 'CONFLICT'           // 409 — unique constraint violated
  | 'RATE_LIMITED'       // 429 — too many requests
  | 'INVALID_INVITE'     // 403 — invite code doesn't exist
  | 'INVITE_USED'        // 409 — invite code already consumed
  | 'INTERNAL_ERROR'     // 500 — unexpected server error

export const ERROR_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED:    401,
  FORBIDDEN:       403,
  NOT_FOUND:       404,
  VALIDATION_ERROR:400,
  CONFLICT:        409,
  RATE_LIMITED:    429,
  INVALID_INVITE:  403,
  INVITE_USED:     409,
  INTERNAL_ERROR:  500,
}

// ─── Request ID ───────────────────────────────────────────────────────────────
// Each request gets a unique ID injected into the response meta.
// The client should log this ID so you can find the matching server log.
// Format: rf_<timestamp_base36>_<random_4_chars>

export function requestId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `rf_${ts}_${rand}`
}

// ─── Response meta ────────────────────────────────────────────────────────────

export interface ApiMeta {
  requestId: string
  timestamp: string
  version: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// ─── Response builders ────────────────────────────────────────────────────────

/** Standard success response */
export function ok<T>(
  data: T,
  status = 200,
  rid = requestId()
): NextResponse {
  return NextResponse.json(
    {
      data,
      meta: { requestId: rid, timestamp: new Date().toISOString(), version: API_VERSION },
    },
    { status }
  )
}

/** Paginated list response */
export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  rid = requestId()
): NextResponse {
  return NextResponse.json({
    data,
    meta: {
      requestId: rid,
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      pagination,
    },
  })
}

/** Standard error response */
export function err(
  code: ErrorCode,
  message: string,
  status?: number,
  details?: Record<string, string>,
  rid = requestId()
): NextResponse {
  return NextResponse.json(
    {
      error: { code, message, ...(details && { details }) },
      meta: { requestId: rid, timestamp: new Date().toISOString(), version: API_VERSION },
    },
    { status: status ?? ERROR_STATUS[code] }
  )
}

/** Parse pagination query params with safe defaults */
export function parsePagination(url: URL, maxLimit = 100): { page: number; limit: number; offset: number } {
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1', 10)  || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50))
  return { page, limit, offset: (page - 1) * limit }
}

/** Parse an integer URL param with bounds check */
export function parseIntParam(
  value: string,
  min: number,
  max: number
): number | null {
  const n = parseInt(value, 10)
  return isNaN(n) || n < min || n > max ? null : n
}

/** Extract IP from request for rate limiting */
export function clientIp(req: Request): string {
  return (
    (req.headers as Headers).get('x-forwarded-for')?.split(',')[0]?.trim() ??
    (req.headers as Headers).get('x-real-ip') ??
    'unknown'
  )
}
