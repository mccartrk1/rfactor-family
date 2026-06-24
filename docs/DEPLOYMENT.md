# R Factor Family App — Production Deployment Guide

## Architecture

```
GitHub (source) → GitHub Actions (CI/CD) → Vercel (Next.js hosting)
                                               ↕
                                    Supabase (PostgreSQL)
                                               ↕
                                    Anthropic API (Claude)
```

**Vercel Pro** — $20/month. Required for cron jobs (scenario cleanup) and 60s function timeout (Claude generation).
**Supabase Pro** — $25/month. Required for daily backups and higher connection limits.
**Total infrastructure cost at 50 families: ~$45/month.**

---

## First-time setup (one-time)

### 1. Vercel project

```bash
npm install -g vercel
cd rfactor-app
vercel link                      # follow prompts, select your org
cat .vercel/project.json         # save orgId and projectId
```

### 2. Supabase project

1. Create project at supabase.com
2. Project Settings → Database → Connection String (URI) → copy both
   - DATABASE_URL: Pooler connection (for app queries)
   - DIRECT_URL: Direct connection (for migrations)
3. Enable Row Level Security on all tables

### 3. Google OAuth

1. console.cloud.google.com → New project → Credentials → OAuth client
2. Authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (development)

### 4. Vercel environment variables

Set these in: Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Environment | Value |
|---|---|---|
| DATABASE_URL | Production, Preview | Supabase pooler URI |
| DIRECT_URL | Production, Preview | Supabase direct URI |
| NEXTAUTH_URL | Production | `https://your-domain.vercel.app` |
| NEXTAUTH_URL | Preview | Set per-deployment (Vercel handles automatically) |
| NEXTAUTH_SECRET | Production, Preview | `openssl rand -base64 32` |
| GOOGLE_CLIENT_ID | Production, Preview | From Google Console |
| GOOGLE_CLIENT_SECRET | Production, Preview | From Google Console |
| ANTHROPIC_API_KEY | Production, Preview | From console.anthropic.com |
| CRON_SECRET | Production | `openssl rand -base64 32` |
| ADMIN_EMAILS | Production | `your-email@gmail.com` |
| MAX_AI_CALLS_PER_HOUR | Production | `15` |

### 5. GitHub secrets

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| VERCEL_TOKEN | From vercel.com/account/tokens |
| VERCEL_ORG_ID | From `.vercel/project.json` |
| VERCEL_PROJECT_ID | From `.vercel/project.json` |
| DATABASE_URL | Same as Vercel env var |

### 6. Database migrations

Run in order, once, against production Supabase:

```bash
psql "$DATABASE_URL" -f prisma/migrations/manual/001_index_optimization.sql
psql "$DATABASE_URL" -f prisma/migrations/manual/002_child_userid_denormalize.sql
psql "$DATABASE_URL" -f prisma/migrations/manual/003_child_profile_jsonb.sql
psql "$DATABASE_URL" -f prisma/migrations/manual/004_admin_aggregate_view.sql
```

After 003 runs and code is deployed and verified, run the column drop:
```sql
-- Only after verifying profile JSONB is working in production
ALTER TABLE "Child" DROP COLUMN name, DROP COLUMN family_name, ... (see migration file)
```

### 7. Seed invite codes

```bash
DATABASE_URL="$PRODUCTION_DATABASE_URL" npx ts-node scripts/seed-invites.ts
```

---

## Deploy process

### Normal deploy

```bash
git add .
git commit -m "feat: describe the change"
git push origin main
```

CI runs automatically: TypeScript → Tests → Build → Security → Deploy.
Watch progress at: github.com/your-org/rfactor-app/actions

### Emergency hotfix deploy

```bash
git checkout -b hotfix/description
# make fix
git push origin hotfix/description
# Create PR → CI runs → merge → deploys
```

### Manual deploy (bypass CI — emergencies only)

```bash
vercel --prod
```
Only use this if GitHub Actions is down and the fix is critical.

---

## Rollback procedure

### Instant rollback (< 2 minutes)

Vercel Dashboard → Project → Deployments → find last known-good deployment → ⋯ → Promote to Production

This is atomic — traffic switches immediately. Database state is not affected.

### If a bad migration ran

1. Vercel rollback (above) to restore code
2. Assess database state:
   - If additive change (column added): rollback by removing reads in code, not schema
   - If data corruption: restore from Supabase backup (see Disaster Recovery)
3. Never revert migrations without data validation

---

## Monitoring setup

### BetterUptime (uptime monitoring)

1. betteruptime.com → New monitor
2. URL: `https://your-domain.vercel.app/api/v1/health`
3. Check interval: 1 minute
4. Alert: email + SMS if down for 3 consecutive checks
5. Alert contacts: your email

### Axiom (log aggregation)

1. axiom.co → New dataset: `rfactor-logs`
2. Vercel Dashboard → Project → Settings → Log Drains → Add
3. Destination URL: `https://api.axiom.co/v1/datasets/rfactor-logs/ingest`
4. HTTP Headers: `Authorization: Bearer [AXIOM_TOKEN]`
5. Format: JSON

**Key dashboards to create in Axiom:**

```apl
# Error rate (last 1h)
['rfactor-logs'] | where level == "error" | count() by bin_auto(timestamp)

# Claude generation latency (p95)
['rfactor-logs'] | where event == "scenario.generated"
| summarize percentile(durationMs, 95) by bin(1h, timestamp)

# Rate limit hits
['rfactor-logs'] | where event == "rate_limit.exceeded" | count() by bin(1d, timestamp)

# Program completions
['rfactor-logs'] | where event == "progress.program_completed" | count()
```

### Vercel Analytics

Dashboard → Project → Analytics → Enable
Tracks: page load times, Core Web Vitals, traffic patterns.

---

## Disaster recovery

### Scenario: Claude API down

**Impact:** Families can't get new AI scenarios.
**Fallback:** The `FALLBACK_SCENARIO` in `useLessonMachine.ts` renders automatically.
**Action:** Monitor Anthropic status page. No intervention needed — fallback is live.
**Recovery time:** Automatic when Anthropic restores service.

### Scenario: Database connection lost

**Impact:** All pages fail. Health check returns 503.
**Action:**
1. Check Supabase status page (status.supabase.com)
2. Check DATABASE_URL in Vercel (connection string not rotated?)
3. Supabase Dashboard → Database → Check connection pool usage
4. If pool exhausted: restart pool via Supabase dashboard
**Recovery time:** < 5 minutes for pool issues, depends on Supabase for outage.

### Scenario: Data corruption / accidental delete

**Supabase Pro backup restore:**
1. Supabase Dashboard → Project → Database → Backups
2. Select the backup from before the incident
3. Restore to a new project
4. Export the affected data
5. Re-import to production

**PITR (Point in Time Recovery)** — available on Supabase Pro:
1. Contact Supabase support with timestamp of last known-good state
2. Specify which tables to restore
3. Estimated recovery: 1-4 hours

**What to restore for common incidents:**
- Accidental `child.delete`: restore Child + LessonProgress + ChallengeResponse + ScenarioCache for that child ID
- Accidental `family.delete`: restore Family + all children and their data
- Corrupt progress data: restore LessonProgress table entries for affected children

### Scenario: Vercel deployment fails post-merge

**Action:**
1. Vercel Dashboard → Project → Deployments → Rollback to previous deployment
2. Investigate CI logs for build failure reason
3. Create hotfix branch, fix, redeploy

### Scenario: ANTHROPIC_API_KEY compromised

**Action (execute in this order):**
1. console.anthropic.com → API Keys → Revoke the compromised key
2. Create new API key immediately
3. Vercel Dashboard → Environment Variables → Update ANTHROPIC_API_KEY
4. Trigger redeployment: `vercel --prod`
5. Check Anthropic usage dashboard for unauthorized spend
**Recovery time:** < 10 minutes.

### Scenario: NEXTAUTH_SECRET rotated (all sessions invalidated)

**Impact:** Every logged-in user is logged out immediately.
**When this is acceptable:** Suspected session token compromise.
**Action:**
1. Generate new secret: `openssl rand -base64 32`
2. Vercel → Update NEXTAUTH_SECRET
3. Redeploy
4. Communicate to pilot families: "You may need to sign in again."

---

## Cost monitoring

### Anthropic spend alert

Anthropic Console → Usage → Set budget alert at $50/month.
At $0.007/scenario × 15 scenarios/hour × 24 hours × 50 families peak = ~$126/day maximum.
This only happens if every family hits the rate limit simultaneously — practically impossible.

### Vercel spend

Vercel Pro: $20/month flat. No overage at this scale.
Monitor: Vercel Dashboard → Usage → Bandwidth (1TB/month limit).

### Supabase spend

Supabase Pro: $25/month. 8GB database storage included.
At current schema: ~1KB/child profile + ~200 bytes/week progress = ~15KB per child program completion.
50 families × 2 children × 15KB = 1.5MB. Nowhere near the limit.

---

## Security checklist (pre-launch)

- [ ] All env vars set in Vercel (Production environment)
- [ ] NEXTAUTH_SECRET is 32+ random characters (not a word or phrase)
- [ ] CRON_SECRET is 32+ random characters
- [ ] Google OAuth redirect URIs updated to production domain
- [ ] Supabase → Authentication → disabled (we use NextAuth, not Supabase Auth)
- [ ] Supabase → API → anon key NOT in any app code or env file
- [ ] Admin email list contains only Ryan's actual email(s)
- [ ] `npm audit --audit-level=high` returns zero findings
- [ ] `/api/v1/health` returns `{"status":"ok","db":"ok"}`
- [ ] Test Google login in production environment
- [ ] Test scenario generation end-to-end
- [ ] Admin dashboard accessible only with admin email

---

## Local development setup

```bash
git clone https://github.com/your-org/rfactor-app
cd rfactor-app
cp .env.example .env.local
# Fill in .env.local with development values

npm install
npx prisma generate
npx prisma db push   # applies schema to your local/dev DB

npm run dev          # http://localhost:3000
npm test             # run 89 test cases
```
