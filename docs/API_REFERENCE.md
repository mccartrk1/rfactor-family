# R Factor Family ... API reference

This documents the API as it is built and deployed. It is a reference for the existing system, not a proposal. For how the layers fit together, see SYSTEM_DESIGN.md. For the data model, see the ERD.

## Overview

The API is a set of Next.js App Router route handlers under `app/api`. The current, stable surface lives under `/api/v1`. Older routes under `/api` remain for internal use and are being consolidated into v1 over time.

Base URL in production: `https://rfactor-family.vercel.app`

Content type: `application/json` for all request and response bodies, except the Stripe webhook, which receives the raw body for signature verification.

## Authentication

Authentication is session-based through NextAuth with Google as the only provider, using JWT sessions. There is no API key or bearer token for end users. A logged-in browser session carries the identity.

Four guard types protect routes:

Session guard. Most data routes call `getServerSession`. No valid session returns `UNAUTHORIZED` (401).

Ownership guard (`withOwnership`). Routes scoped to a child verify the child belongs to the caller with a single indexed check (`WHERE id = childId AND userId = session.user.id`). A miss returns `NOT_FOUND` (404) rather than revealing that the record exists.

Admin guard (`withAdmin`, `withAdminParams`). Admin routes require the session email to be in the `ADMIN_EMAILS` allowlist. No session is 401, a non-admin session is `FORBIDDEN` (403).

Machine guards. Cron routes require a `CRON_SECRET` bearer token compared in constant time. The Stripe webhook requires a valid `stripe-signature`.

## Response envelope

Every response, success or error, carries a `meta` block for tracing and versioning.

Success:

```json
{
  "data": { "...": "..." },
  "meta": {
    "requestId": "rf_lt4k2p_a1b2",
    "timestamp": "2026-06-27T17:00:00.000Z",
    "version": "1"
  }
}
```

Paginated success adds pagination to meta:

```json
{
  "data": [ { "...": "..." } ],
  "meta": {
    "requestId": "rf_lt4k2p_a1b2",
    "timestamp": "2026-06-27T17:00:00.000Z",
    "version": "1",
    "pagination": { "page": 1, "limit": 20, "total": 134, "hasMore": true }
  }
}
```

Error:

```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Slug is required" },
  "meta": {
    "requestId": "rf_lt4k2p_a1b2",
    "timestamp": "2026-06-27T17:00:00.000Z",
    "version": "1"
  }
}
```

The `requestId` (format `rf_<timestamp>_<random>`) is logged on the server. A user reporting a problem can give you that ID and you can find the exact server log line.

## Error codes

Clients switch on `error.code`, not on the message text, which may change without being a breaking change.

| Code               | HTTP | Meaning                                              |
|--------------------|------|------------------------------------------------------|
| `UNAUTHORIZED`     | 401  | No valid session                                     |
| `FORBIDDEN`        | 403  | Authenticated but not allowed                        |
| `NOT_FOUND`        | 404  | Resource missing, or ownership check failed          |
| `VALIDATION_ERROR` | 400  | Body or params failed validation                     |
| `CONFLICT`         | 409  | Unique constraint violated                           |
| `RATE_LIMITED`     | 429  | Too many requests                                    |
| `INVALID_INVITE`   | 403  | Invite code does not exist                           |
| `INVITE_USED`      | 409  | Invite code already consumed                         |
| `INTERNAL_ERROR`   | 500  | Unexpected server error                              |

`VALIDATION_ERROR` responses may include a `fields` object mapping each invalid field to a message.

## Validation

Request bodies pass through typed validators in `lib/api/validation.ts` before any handler logic runs. Admin write routes compose validation with the auth guard via `withAdminAndBody(action, validator)`, so an invalid body is rejected before the handler executes. Validators return either `{ ok: true, data }` or `{ ok: false, errors }`.

## Rate limiting

The AI scenario endpoint is the expensive path and is guarded by a database-backed limiter keyed per user (`ai:{userId}`), enforced through the `RateLimit` table. Exceeding the window returns `RATE_LIMITED` (429). The public invite-check endpoint has its own limiter (5 attempts per IP per 15 minutes) plus blind responses and fixed response timing to resist enumeration.

## Endpoint catalog

### System

```
GET  /api/v1/health          Liveness + database check. Public. Returns status, db, version, uptime.
```

### Family and learners

```
GET    /api/v1/families/me               The caller's family and children. Session.
GET    /api/v1/children/{childId}        One child. Ownership.
PUT    /api/v1/children/{childId}        Update child profile (partial). Ownership + validation.
DELETE /api/v1/children/{childId}        Delete a child (cascades). Ownership.
GET    /api/v1/challenges/{childId}      Challenge responses for a child. Ownership.
```

### Lessons and AI

```
POST /api/scenario                       Return a cached scenario or generate one. Session + rate limit.
POST /api/scenario/pregenerate           Warm next week's scenario. Session.
POST /api/v1/scenarios/batch-generate    Bulk warm scenarios. Session/admin.
GET  /api/progress/{childId}             Progress across weeks. Session/ownership.
GET  /api/progress/{childId}/{week}      One week's progress. Session/ownership.
PUT  /api/progress/{childId}/{week}      Advance step / mark complete. Session/ownership.
PUT  /api/challenges/{childId}/{week}    Record a yes / not-yet answer. Session/ownership.
```

### Onboarding and growth

```
POST /api/invite                         Pre-validate an invite code. Public, rate limited, blind.
POST /api/v1/waitlist                    Join the waitlist. Public.
POST /api/v1/referral                    Generate or read a referral code. Session.
GET  /api/v1/unsubscribe?token=...       Opt out of email via signed HMAC token. Public, token-gated.
```

### Billing

```
POST /api/v1/billing/checkout            Create a Stripe Checkout session. Session + validation.
POST /api/v1/billing/portal              Open the Stripe billing portal. Session.
```

### Admin

```
GET  /api/v1/admin/analytics                 Program-wide metrics and engagement. Admin.
GET  /api/v1/admin/families                  List families. Admin, paginated.
GET  /api/v1/admin/families/{familyId}       Family detail with per-child progress. Admin.
GET  /api/v1/admin/orgs                       List organizations. Admin.
POST /api/v1/admin/orgs                       Create an organization. Admin + validation.
GET  /api/v1/admin/orgs/{slug}                Org detail. Admin.
PUT  /api/v1/admin/orgs/{slug}                Update org. Admin + validation.
GET/POST /api/admin/invites                   List or create invite codes. Admin.
```

### Machine to machine

```
POST /api/webhooks/stripe                Stripe subscription lifecycle. Signature-verified.
GET  /api/cron/email-reminders           Weekly reminder send. CRON_SECRET bearer.
GET  /api/cron/cleanup                    Purge expired cache and rate-limit rows. CRON_SECRET bearer.
GET/POST /api/auth/[...nextauth]          NextAuth handlers (Google).
```

## Representative examples

Update a child profile:

```
PUT /api/v1/children/clx123
Cookie: <session>
Content-Type: application/json

{ "flashPoint": "bedtime stalling", "siblings": "Nick, Michael" }
```

```json
{
  "data": { "id": "clx123", "track": "elementary", "profile": { "...": "..." }, "updatedAt": "2026-06-27T17:00:00.000Z" },
  "meta": { "requestId": "rf_lt4k2p_a1b2", "timestamp": "2026-06-27T17:00:00.000Z", "version": "1" }
}
```

Ownership failure on someone else's child:

```json
{
  "error": { "code": "NOT_FOUND", "message": "Child not found" },
  "meta": { "requestId": "rf_lt4k3q_c3d4", "timestamp": "2026-06-27T17:00:01.000Z", "version": "1" }
}
```

Rate-limited scenario request:

```json
{
  "error": { "code": "RATE_LIMITED", "message": "Too many requests. Try again shortly." },
  "meta": { "requestId": "rf_lt4k4r_e5f6", "timestamp": "2026-06-27T17:00:02.000Z", "version": "1" }
}
```

## Database integration

Every handler reaches Postgres through a single shared Prisma client (`lib/db.ts`), reused per warm serverless function. Data access for the core domain goes through repositories and use-cases in `application` and `infrastructure`; server components read directly for rendering. The schema, indexes, and scaling plan are in SYSTEM_DESIGN.md and the ERD.
