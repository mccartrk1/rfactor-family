# R Factor Family ... system design

This document describes the system as it is actually built and deployed, then lays out how it scales from one family to thousands. It is written to hand to an engineer joining the project. For a plain-language tour, read ARCHITECTURE.md instead. This is the technical companion.

## 1. Architecture

The system is a single Next.js 14 application using the App Router, deployed on Vercel as serverless functions, with a PostgreSQL database on Supabase reached through Prisma. There is no separate backend service. Server-side rendering and API routes run in the same project, which keeps the deployment surface small and the data path short.

The code follows a hexagonal (ports and adapters) layout so that business rules do not depend on infrastructure:

    app/                Next.js routes (pages + API endpoints) ... the delivery layer
    domain/             Entities, repository interfaces, pure services ... no I/O
    application/        Use-cases that orchestrate domain + ports
    infrastructure/     Prisma repositories, Claude generator, rate limiter ... real I/O
    lib/                Cross-cutting helpers (db, auth, email, stripe, container)
    content/            Curriculum data for each track (kid and adult)
    components/         Reusable UI

The dependency rule points inward. `domain` knows nothing about Prisma or Next. `application` depends on domain interfaces, not concrete implementations. `infrastructure` implements those interfaces. `lib/container.ts` wires the concrete classes together (a small dependency-injection container). This is why the two production crashes earlier were each isolated to one layer and fixable without touching the rest.

## 2. Component structure

Request handling splits into three component types.

Server Components and page routes under `app/` load data directly through repositories and render finished HTML. They never expose secrets to the browser.

Client Components (the lesson machine, the profile editor, the dashboard shell) handle interactivity. They hold local state and call API routes for anything that needs the server.

API routes under `app/api/` are the write and compute surface: scenario generation, progress updates, billing, admin, webhooks. The newer endpoints live under `app/api/v1/` and share a common middleware in `lib/api/` for auth, validation, and consistent error envelopes.

The core domain components are the ChildProfile entity (which owns the rules for a valid learner), the LessonNavigator service (which decides what week a learner is on and what unlocks next), the scenario generator port (the boundary in front of the AI), and the repository interfaces for families, children, and progress.

## 3. Data flow

A representative read, opening a lesson:

1. Browser requests `/lesson/[week]`.
2. The page route authenticates the session (NextAuth, JWT), then loads the child and that week's progress through repositories.
3. If the lesson needs an AI scenario, a Client Component calls `POST /api/scenario`.
4. The scenario endpoint checks the cache first. On a hit it returns immediately. On a miss it builds a prompt from the child's profile and the week's concept, calls Claude through the generator adapter, stores the result in the cache, and returns it.
5. The learner picks a path and answers the reflection. A `POST` to the progress endpoint writes the result.

The important properties: secrets stay server-side, the AI is never called when a cached scenario exists, and every write goes through an endpoint that re-checks ownership before touching the database.

## 4. API design

APIs follow a consistent shape. The `v1` routes return a uniform envelope, either `{ ok: true, data }` or `{ ok: false, error }`, with validation handled by `lib/api/validation.ts` before any handler logic runs. Admin routes are wrapped by `withAdmin` and `withAdminAndBody`, which enforce the admin allowlist and parse the body through a typed validator in one step.

Representative endpoints:

    POST /api/scenario                 Generate or return a cached lesson scenario
    GET  /api/v1/children/[childId]     Read one child (ownership-checked)
    PUT  /api/v1/children/[childId]     Update a child's profile (partial, validated)
    GET  /api/v1/families/me            The signed-in user's family and children
    POST /api/v1/billing/checkout       Create a Stripe checkout session
    POST /api/webhooks/stripe           Stripe subscription lifecycle events
    GET  /api/v1/health                 Liveness probe for deploy verification

Ownership is enforced at the data layer, not just the route. The Child table carries a denormalized `userId` so an ownership check is a single indexed lookup (`WHERE id = $1 AND userId = $2`) rather than a join back through Family. Writes that add a child now pass `userId` through the repository interface so this denormalized field is always set correctly.

## 5. Database schema

Fifteen tables. The operational core:

    Family              A household; owns children and an invite code
    Child               A learner. Columns: id, familyId, userId (denormalized),
                        track, profile (JSONB), timestamps. Indexed on familyId,
                        userId, and (userId, familyId).
    LessonProgress      One row per child per week: status, current step, response
    ChallengeResponse   A learner's answer to a week's challenge
    ScenarioCache       Cached AI scenarios, keyed by child + week
    RateLimit           Per-identity request counters for the AI endpoint

Plus auth tables (User, Account, Session, VerificationToken), billing and grouping (Organization, OrganizationMember, InviteCode, Referral), and a Waitlist.

The deliberate design decision is the `profile` JSONB column on Child. Roughly two dozen descriptive fields (name, age, grade, friends, triggers, and the rest) live inside one JSON document rather than as individual columns. The benefit is that adding a new profile question requires no schema migration. The cost is that code must read through the ChildProfile entity, which knows the document's shape, instead of expecting flat columns. Both earlier crashes happened where older code violated that rule. The entity is now the single reader of the profile shape.

Indexing is intentional rather than incidental. The dashboard query (a user's children) and the per-request ownership check each have a covering index, so the hot paths are index-only lookups.

## 6. Caching strategy

There are three layers, each aimed at a specific cost.

AI scenario cache. The most expensive operation is a Claude call. Scenarios are cached per child per week in the ScenarioCache table, so the second open of any lesson is instant and free. A separate pregeneration path can warm the next week's scenario ahead of time so the learner never waits.

Rate limiting. The AI endpoint is guarded by a database-backed limiter (`infrastructure/limiters`) keyed per identity, so one account cannot run up cost or latency for everyone.

Render and data caching. Next.js caches server-rendered output and static assets at Vercel's edge. Profile and progress reads are small indexed queries, so they do not need a separate cache today. Images are pre-optimized and served as static assets.

The guiding rule: cache the expensive and slow (AI), rate-limit the abusable (AI endpoint), and leave the cheap indexed reads uncached until measurement says otherwise.

## 7. How it scales

The current design carries a long way before anything structural has to change, because the app is stateless at the function layer and all state lives in Postgres and the cache table.

Near term, from a handful of families to a few thousand, nothing needs to change except confidence. The serverless functions scale horizontally on Vercel automatically. The database is the only shared resource, and the hot queries are indexed.

The first real bottleneck as usage grows is the database connection count, because serverless functions each open connections. The fix is connection pooling (Supabase provides PgBouncer; point Prisma at the pooled URL for the app and keep the direct URL only for migrations). This is a configuration change, not a redesign.

The second is AI cost and latency under load. The cache already absorbs repeat reads. The next step is to make pregeneration the default for the upcoming week, and to add a short-lived in-memory cache in front of the database cache for the busiest scenarios.

The third, much later, is read scaling on the database. If dashboards and progress reads dominate, a read replica or a denormalized progress summary per child removes the load. The denormalized `userId` pattern already in use is the same idea applied early.

None of these are needed now. They are listed so the order of moves is known before the pressure arrives.

## 8. Implementation: production hardening shipped with this design

A design is only as safe as the gate that enforces it. The highest-leverage gap was that the production build shipped even when the code had type errors (`typescript.ignoreBuildErrors` was set to true in `next.config.js`). That is how two crashes reached users despite a CI typecheck existing.

This pass fixed every genuine type error the compiler found, independent of Prisma's generated types:

- A real runtime crash on the family-join page, which imported `useEffect` from `next/navigation` (where it does not exist) instead of from `react`.
- Four UI components referencing transition tokens by names that no longer existed (`A.transition`, `A.transitionSlow`), which silently produced undefined CSS. Repointed to the real tokens (`A.base`, `A.slow`).
- A billing component referencing a non-existent color token (`C.green`), repointed to `C.success`.
- The Stripe client's pinned API version not matching the SDK's type, resolved without changing the runtime version.
- The ChildProfile entity's fields failing strict initialization checks, and a duplicate-key object spread in `toCreateInput`.
- The family repository interface missing the optional `userId` parameter its implementation already accepted ... the ownership field discussed in section 4.
- A checkout route widening a plan type beyond what the Stripe layer accepts, narrowed to the guarded set.
- A test importing a validator that was declared but not exported.

After these fixes the only remaining compiler complaints are the absence of Prisma's generated model types, which exist only because the code generator cannot run in an offline sandbox. They are produced automatically during `prisma generate` in CI and on Vercel.

The verification path is the existing `ci.yml` pipeline, which runs `prisma generate` then `tsc --noEmit` in an environment where generation works. Once that check is green on these fixes, `ignoreBuildErrors` can be set to false so the production build enforces types the same way CI does, closing the gap that let the original crashes ship. That config flip is the single remaining step and should follow a green CI run, not precede it.
