# R Factor Family App — 18-Month Technical Roadmap

> CTO Advisory Note: This roadmap is tied to the business milestone structure.
> Technical work unlocks business value at each stage. Nothing is built ahead of
> its time. Nothing critical is deferred past its window.

---

## Current state (Month 0)

**What exists and is production-ready:**
- 13-week lesson engine with pure state machine
- AI scenario generation with database cache
- Admin dashboard with program analytics
- v1 REST API with OpenAPI spec
- Security hardening (OWASP Top 10 addressed)
- CI/CD pipeline (4-gate: types → tests → build → CVE scan → deploy)
- Structured logging → Vercel Log Drain → Axiom
- 89 unit test cases

**Technical debt that exists but is managed:**
- `lib/scenario-service.ts` legacy facade (documented, won't bite in production)
- Child profile still in 22 VARCHAR columns (JSONB migration scripted, not yet run)
- Multi-tenancy not yet active (schema added, backfill scripted, code not reading orgId yet)

---

## Phase 1: Focus 3 Meeting (Months 1-2)

**Business goal:** Sign NDA, demonstrate prototype, begin deal discussion.
**Technical goal:** Make the app undeniably impressive in a 20-minute demo.

### P1.1 — Eliminate all loading spinners (Week 1-2)

**The single most impactful UX change before the demo.**

Current: First lesson opens → 3-second spinner → scenario appears.
After: First lesson opens → scenario is there instantly.

How: Batch pre-generation triggers at family enrollment. All 39 scenarios (13 weeks × 3 attempts) pre-generated in the background for ~$0.31/child. Every lesson is a cache hit.

Implementation: `lib/scenario-batch.ts` + `/api/v1/scenarios/batch-generate` — already built. Wire into `POST /api/v1/children` response.

**Effort:** 2 days to wire in + test.
**Impact:** Demo goes from "impressive AI app" to "polished product."

### P1.2 — PWA: installable on home screen (Week 1)

**manifest.json + service worker — already built.** iOS 16.4+ and all Android support home screen install. When Ryan shows Focus 3 the product, he pulls it up from the iPhone home screen — not a browser tab.

**Effort:** Already done. Icons need to be created (PNG at 192px and 512px).
**Impact:** "App" feels real. Tab feels like a demo.

### P1.3 — Organization model activated (Week 2-3)

**Schema is built. Migration is scripted.** Code needs to be updated to:
1. Read `organizationId` from Family when checking admin scope
2. Show org context in admin dashboard ("Viewing: R Factor Pilot")
3. Create the "focus3" org and assign demo families to it

**Why before the meeting:** If Heather asks "how would we white-label this for Focus 3 trainers?" the answer is "here's how it works already" — not "we'd need to build that."

**Effort:** 1 week.
**Impact:** Turns "cool prototype" into "licensable platform."

### P1.4 — Demo environment hardening

A dedicated `rfactor-demo` Vercel environment with:
- Pre-seeded family: "The Demo Family" with John and Nick
- All 26 scenarios pre-generated
- No rate limits during demo
- Admin login: demo@rfactorfamily.com

**Effort:** 1 day.
**Impact:** No live API calls during the pitch. Zero risk of 429 or timeout.

---

## Phase 2: Focus 3 Deal (Months 3-6)

**Business goal:** Sign licensing agreement, deploy to first Focus 3 cohort.
**Technical goal:** Multi-org production deployment, white-label branding.

### P2.1 — Full multi-tenancy (Month 3)

With the Organization schema already in the database, activate the code layer:
- Admin dashboard shows org selector for users in multiple orgs
- Invite codes are org-scoped (Focus 3 admins create their own codes)
- Analytics are org-scoped (Focus 3 can't see Ryan's pilot families)
- Family count enforces `org.maxFamilies` limit
- API responses include `organizationId` in meta

**Effort:** 2-3 weeks.

### P2.2 — White-label branding system (Month 3-4)

Organization model already has `logoUrl` and `primaryColor`. Activate:
- Dashboard header reads `org.logoUrl` and renders it
- Primary color pulled from `org.primaryColor` at render time
- Email templates branded per org (if/when email is added)
- `/org/[slug]` subdomain routing (Focus 3 families see rfactor.focus3.com)

**Effort:** 1 week (design tokens already support variable colors).

### P2.3 — Email/notification layer (Month 4-5)

The retention problem for weekly programs: families forget to come back.

Solution: Weekly reminder emails via Resend ($0.001/email, 3,000/month free).
- "John's Week 3 lesson is ready" — sent 7 days after Week 2 completion
- Welcome email on enrollment with app install instructions
- Completion certificate email after Week 13

**Effort:** 2 weeks.
**Impact:** +30-40% week-over-week retention (industry benchmark for reminder emails).

### P2.4 — Apple Sign In (Month 5)

Required by Apple for App Store submission. Families on iPhones prefer Apple Sign In.
Also serves families without Google accounts.

Add to NextAuth providers:
```typescript
AppleProvider({
  clientId: process.env.APPLE_ID!,
  clientSecret: process.env.APPLE_SECRET!,
})
```

**Effort:** 1 week (NextAuth has first-class Apple support).
**Impact:** Unblocks App Store if React Native is pursued in Phase 3.

### P2.5 — Curriculum versioning (Month 6)

Focus 3 will want to update lesson content without a code deployment. Currently lessons are hardcoded in `content/curriculum.ts`.

Architecture decision: Move lessons to the database with a `Curriculum` and `Lesson` model. Admin UI for editing lesson content. Version tagging ("v1.2 — updated Week 7 self-talk framework").

**Effort:** 3-4 weeks (significant — database schema + admin UI + content migration).
**Why now:** Focus 3 curriculum team will want to make changes. Code-locked content is a blocker.

---

## Phase 3: Scale (Months 7-12)

**Business goal:** 500-5,000 families. Possibly Series A.
**Technical goal:** React Native mobile app. Infrastructure for 10x current load.

### P3.1 — React Native app (Months 7-10)

**Why now and not sooner:** PWA covers 90% of the use case at pilot scale. React Native takes 3-4 months. By Month 7, there's enough usage data to know whether native features (offline sync, push notifications, biometric auth) are blocking adoption.

Shared code between web and native:
- Domain layer (LessonNavigator, validation) — already pure TypeScript, reusable
- API layer — all communication through v1 API (React Native just calls the same endpoints)
- Design tokens — exportable to React Native StyleSheet

What needs to be rebuilt for native:
- All UI components (React Native components, not HTML)
- Navigation (React Navigation, not Next.js router)
- Storage (AsyncStorage, not localStorage)

**Effort:** 3-4 months, 1 dedicated mobile engineer.

### P3.2 — Redis/Vercel KV for rate limiting (Month 8)

Current rate limiter uses PostgreSQL (fine at 500 families, starts to matter at 5,000).
At 5,000 concurrent active users, every scenario request does a DB write for rate limiting.

Swap `DatabaseRateLimiter` for `KVRateLimiter` using Vercel KV (Redis):
```typescript
class KVRateLimiter implements IRateLimiter {
  async check(key: string): Promise<RateLimitResult> {
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 3600)
    // ...
  }
}
```

**Effort:** 3 days (the IRateLimiter interface was designed for this swap).
**Cost:** Vercel KV $0/month (250k operations/day free).

### P3.3 — Fine-tuned model (Month 10-12)

By Month 10, if 5,000+ families have completed the program, there's a dataset of:
- 5,000 × 2 children × 39 scenarios = 390,000 scenario examples
- Each with child profile + week number → generated scenario

This is enough to fine-tune a smaller, cheaper model that produces equally good scenarios at a fraction of the cost.

Fine-tuning options:
- OpenAI fine-tuning (fastest path)
- Anthropic fine-tuning (model alignment, same provider)
- Open-source Llama on Modal/RunPod (maximum cost reduction, more ops work)

**Don't build this before Month 10.** You need the data first. The data quality matters more than the architecture.

---

## Phase 4: Platform (Months 13-18)

**Business goal:** Platform licensing. Focus 3 trainers have their own admin accounts.
**Technical goal:** Self-service org management, billing, marketplace.

### P4.1 — Self-service organization management

Currently: Ryan creates organizations by running SQL.
Goal: Focus 3 trainers create their own org, invite their families, manage their program.

New pages:
- `/orgs/new` — create an organization
- `/orgs/[slug]/settings` — manage branding, plan, invite codes
- `/orgs/[slug]/families` — manage enrolled families
- `/orgs/[slug]/analytics` — program analytics for this org

**Effort:** 4-6 weeks.

### P4.2 — Billing infrastructure

Current: $0 revenue.
Goal: $X/family/month subscription or per-org flat fee.

Tech stack: Stripe
- `stripe.customers.create` per organization
- `stripe.subscriptions.create` with metered billing per active family
- Webhook handler for subscription events
- Billing portal at `/settings/billing`

**Effort:** 2-3 weeks.
**Do not build until:** Business model is agreed with Focus 3. Building billing before knowing the revenue model wastes time.

### P4.3 — Outcomes research API

Focus 3's academic credibility comes from research. A research API allows:
- Anonymized, aggregated behavioral data export
- Cohort comparison (families who completed vs. dropped off)
- Before/after challenge response rates
- Longitudinal program effectiveness studies

Requires:
- IRB-compliant data handling procedures (not a tech problem)
- Anonymization pipeline (remove PII, keep behavioral patterns)
- Read-only research API with academic institution auth

**Effort:** 3-4 weeks technical, months of IRB approval process.

---

## Technical debt payoff schedule

| Debt item | Pay off when |
|---|---|
| `lib/scenario-service.ts` facade | Phase 1.1 — wire batch gen, remove facade |
| Child profile VARCHAR → JSONB | Phase 1 deployment — run migration 003, drop old columns |
| Child.profile type mismatch in old code | Phase 2.1 — clean up during multi-tenancy activation |
| Curriculum hardcoded in TypeScript | Phase 2.5 — move to database |
| `lib/rate-limit.ts` legacy file | Phase 3.2 — delete after KV rate limiter ships |

---

## Architecture evolution diagram

```
CURRENT (Month 0):
  Next.js → Prisma → Supabase
  Single tenant, single deployment

PHASE 1 (Month 2):
  Next.js → Prisma → Supabase
  + Organization model (soft multi-tenant)
  + PWA (installable)
  + Batch pre-generation (no spinners)

PHASE 2 (Month 6):
  Next.js (org-scoped) → Prisma → Supabase
  + Resend (email)
  + Apple OAuth
  + White-label subdomains
  + Content CMS (DB-driven curriculum)

PHASE 3 (Month 12):
  Next.js + React Native → v1 API → Prisma → Supabase
  + Vercel KV (rate limiting)
  + Fine-tuned model (AI cost reduction)
  + Push notifications (web + mobile)

PHASE 4 (Month 18):
  Full SaaS platform
  + Stripe billing
  + Self-service org management
  + Research data API
  + Multiple AI models
```

---

## What NOT to build

**Blockchain/NFT certificates** — "verified on-chain completion certificate" is a distraction from behavioral coaching.

**Social features** — leaderboards between families, sharing progress publicly. This is a private family tool. Social mechanics add privacy risk and implementation cost.

**Gamification beyond what exists** — badges, streaks, XP systems. The curriculum has natural progression. Adding artificial engagement mechanics competes with genuine learning moments.

**Custom LLM** — before 50,000 families and 5M scenarios in the training set, fine-tuning a custom model is expensive research, not engineering.

**Native desktop app** — lessons happen on mobile. No family is pulling up the Mac app to do R Factor with their child.
