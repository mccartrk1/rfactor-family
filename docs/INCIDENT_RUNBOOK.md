# R Factor Family App — Incident Runbook

Quick reference for on-call response. Each scenario: what happened, how to know, what to do, how long it takes.

---

## Severity levels

| Level | Definition | Response time |
|---|---|---|
| P1 | App completely down — no families can use it | < 15 minutes |
| P2 | Core feature broken (scenarios fail, login fails) | < 1 hour |
| P3 | Degraded performance or non-critical feature broken | < 4 hours |
| P4 | Minor issue, workaround exists | Next business day |

---

## P1: App completely down

**How you know:** BetterUptime alert fires. `/api/v1/health` returns non-200.

**Triage (5 minutes):**
```bash
# Check health endpoint
curl https://rfactor-family.vercel.app/api/v1/health

# Check Vercel deployment status
# vercel.com/dashboard → Project → check last deployment status

# Check Supabase status
# status.supabase.com
```

**Most likely causes, in order:**
1. Failed deployment pushed bad code → Rollback in Vercel dashboard (< 2 min)
2. Database connection pool exhausted → Supabase dashboard → restart pool (< 5 min)
3. Supabase outage → Wait + monitor status page
4. Vercel outage → Wait + monitor vercel.com/status

**Rollback steps:**
1. Vercel Dashboard → rfactor-family → Deployments
2. Find last green deployment
3. Click ⋯ → Promote to Production
4. Verify health check returns 200

---

## P2: Scenarios not generating

**How you know:** Axiom alert: `scenario.failed` count > 5 in 10 minutes. Or family reports.

**Check Axiom:**
```apl
['rfactor-logs'] | where event == "claude.error" or event == "claude.timeout"
| sort by timestamp desc | limit 20
```

**Triage:**

| Symptom | Cause | Fix |
|---|---|---|
| `claude.timeout` in logs | Claude slow, taking > 30s | Check status.anthropic.com |
| `401` from Anthropic | API key revoked or expired | Rotate key in Anthropic console, update Vercel env |
| `429` from Anthropic | Rate limit hit | Reduce MAX_AI_CALLS_PER_HOUR, wait for reset |
| `rate_limited` source in app | Our own rate limit firing | Check if attack, else increase limit |
| Fallback scenario showing | Any of the above | Families see generic scenario, not blocked |

**The fallback:** The app automatically serves a generic non-personalized scenario when Claude fails. Families can still complete lessons. This is P2 (degraded), not P1 (broken).

---

## P2: Login broken

**How you know:** Family reports can't sign in. `/api/auth/callback/google` returns error.

**Check:**
1. Google Cloud Console → OAuth consent screen → has `vercel.app` domain authorized?
2. Vercel env → GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET correct?
3. NEXTAUTH_URL matches actual domain?
4. NEXTAUTH_SECRET set and long enough (32+ chars)?

**Most common cause:** NEXTAUTH_URL doesn't match the production URL. If you renamed the Vercel project, the callback URL changed.

**Fix:**
1. Update NEXTAUTH_URL in Vercel environment variables
2. Update Google OAuth redirect URIs to include new URL
3. Redeploy

---

## P2: Admin dashboard inaccessible

**How you know:** `/admin` returns 403 for Ryan.

**Check:**
1. ADMIN_EMAILS env var contains Ryan's actual Google email address (case-insensitive)
2. Ryan is logging in with the same Google account as the email in ADMIN_EMAILS
3. Session hasn't expired (7-day max)

**Fix:**
```bash
# In Vercel env vars
ADMIN_EMAILS="ryan@gmail.com,ryan@roberthalftechnology.com"
# Redeploy to pick up env var change
```

---

## P3: Slow performance

**How you know:** Axiom alert: p95 latency > 5s. Or family reports slowness.

**Check latency breakdown:**
```apl
['rfactor-logs'] | where event == "scenario.generated"
| summarize avg(durationMs), percentile(durationMs, 95), percentile(durationMs, 99)
by bin(1h, timestamp)
```

**Common causes:**

| Cause | Diagnosis | Fix |
|---|---|---|
| Claude slow | `durationMs` > 20s in logs | Nothing to do — Claude's latency |
| DB slow | Queries taking > 100ms | Check Supabase metrics, verify indexes |
| Cold start | First request to sleeping function | Normal — Vercel Pro keeps functions warm |
| High load | Many concurrent requests | Check Vercel request volume |

---

## P4: Specific family has corrupted progress

**How you know:** Family reports their progress is wrong (completed weeks showing incomplete, etc).

**Investigate:**
```sql
-- In Supabase SQL editor
SELECT lp.*, c.name, f."familyName"
FROM "LessonProgress" lp
JOIN "Child" c ON lp."childId" = c.id
JOIN "Family" f ON c."familyId" = f.id
WHERE f."familyName" = 'McCarty'
ORDER BY c.name, lp."weekNumber";
```

**Fix (manual correction):**
```sql
-- Reset a specific week's progress
UPDATE "LessonProgress"
SET completed = false, "completedAt" = NULL, "currentStep" = 'intro', "chunkIndex" = 0, "sealIndex" = 0
WHERE "childId" = 'child-id-here' AND "weekNumber" = 3;
```

---

## Cost spike alert

**How you know:** Anthropic alert fires > $50/month.

**Check Anthropic usage dashboard** for unusual spike.

**Most likely cause:** Bot or automated script with a valid invite code generating scenarios in a loop.

**Mitigation already in place:**
- Rate limit: 15 scenarios/hour per userId
- Invite codes are single-use (can't create unlimited accounts)

**If active attack:**
1. Anthropic Console → API Keys → Revoke key
2. Create new key
3. Update Vercel env var
4. Redeploy
5. Block the user's family in Supabase

---

## How to contact Ryan for P1/P2 issues

This is a private pilot. There is no on-call rotation. All alerts go to Ryan's email.
For P1 issues during a family session: families can email [support email] and Ryan will respond.

---

## Useful Supabase SQL queries

```sql
-- Count active families
SELECT COUNT(*) FROM "Family";

-- Recent lesson activity (last 7 days)
SELECT c.name, f."familyName", MAX(lp."updatedAt") as last_active
FROM "LessonProgress" lp
JOIN "Child" c ON lp."childId" = c.id
JOIN "Family" f ON c."familyId" = f.id
WHERE lp."updatedAt" >= NOW() - INTERVAL '7 days'
GROUP BY c.name, f."familyName"
ORDER BY last_active DESC;

-- Families stuck on a specific week (no progress in 7+ days)
SELECT c.name, lp."weekNumber", lp."currentStep", lp."updatedAt"
FROM "LessonProgress" lp
JOIN "Child" c ON lp."childId" = c.id
WHERE lp.completed = false
AND lp."updatedAt" < NOW() - INTERVAL '7 days';

-- AI cost this month
SELECT COUNT(*) * 0.007 AS estimated_cost_usd FROM "ScenarioCache"
WHERE "createdAt" >= DATE_TRUNC('month', NOW());
```
