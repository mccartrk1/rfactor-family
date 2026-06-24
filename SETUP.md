# R Factor Family — Setup Guide

## What this is

A Next.js 14 web app with:
- Google Sign-In (no passwords)
- Supabase PostgreSQL for progress persistence
- Server-side AI (families never need an Anthropic key)
- Multi-child support
- Invite code gate for controlled access

---

## One-time setup (30 minutes)

### 1. Supabase — your database

1. Go to supabase.com, create a free project
2. From Project Settings → Database → Connection string, copy:
   - `DATABASE_URL` (connection pooling URL, port 6543)
   - `DIRECT_URL` (direct URL, port 5432)
3. Paste both into `.env.local`

### 2. Google OAuth

1. Go to console.cloud.google.com
2. Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
5. Copy Client ID and Client Secret to `.env.local`

### 3. Anthropic API key

1. Go to console.anthropic.com
2. Create an API key
3. Paste into `.env.local` as `ANTHROPIC_API_KEY`
4. **This key stays on the server. Families never see it.**

### 4. NextAuth secret

Run this in your terminal:
```bash
openssl rand -base64 32
```
Paste the output as `NEXTAUTH_SECRET` in `.env.local`

---

## Local development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Fill in all values in .env.local

# Push database schema
npm run db:push

# Seed invite codes
npx ts-node scripts/seed-invites.ts

# Start dev server
npm run dev
```

Open http://localhost:3000

---

## Add images

Copy all your app images to `public/images/`:
```
public/images/
  app-icon.png
  20-square-feet.png
  bedtime.png
  car-ride.png
  chores.png
  dad-and-son.png
  default-bot-full.png
  dinner.png
  ero-graphic.png
  friends.png
  grandparent.png
  homework.png
  losing-game.png
  mindset-cycle.png
  morning.png
  nerves-stage.png
  no-bcd-sign.png
  plans-changed.png
  radio.png
  ripple.png
  screen-time.png
  sharing-space.png
  sibling-conflict.png
  star.png
  three-rocks.png
  tiger-full.png
  tiger-head.png
  tiger-pause.png
  tiger-vs-robot.png
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow the prompts. Then in the Vercel dashboard:
- Project Settings → Environment Variables
- Add all variables from `.env.local`
- Change `NEXTAUTH_URL` to your Vercel URL: `https://your-app.vercel.app`
- Add your Vercel URL to Google OAuth authorized redirect URIs

Vercel auto-deploys on every git push.

---

## Manage invite codes

Add families by running the seed script with new codes:

```typescript
// Edit scripts/seed-invites.ts, add your new codes
const INVITE_CODES = [
  { code: 'jones2025',  note: 'Jones family' },
  { code: 'smith2025',  note: 'Smith family' },
  // ...
]
```

Then run: `npx ts-node scripts/seed-invites.ts`

---

## File structure

```
app/
  api/
    auth/nextauth/route.ts     ← Google auth handler
    children/route.ts          ← Create/list children
    progress/[childId]/        ← Get all progress
    progress/[childId]/[week]/ ← Save lesson progress
    challenges/[childId]/[week]/ ← Challenge responses
    scenario/route.ts          ← AI scenario generation (key server-side)
    invite/route.ts            ← Validate invite codes
  auth/login/page.tsx          ← Login screen
  dashboard/page.tsx           ← Week grid
  onboard/page.tsx             ← Child profile setup
  lesson/[week]/
    page.tsx                   ← Server wrapper
    client.tsx                 ← Full interactive lesson (client component)
components/
  cards/index.tsx              ← All visual card components
content/
  curriculum.ts                ← All 13 lessons
  weeks.ts                     ← Week colors/emoji
lib/
  auth.ts                      ← NextAuth config
  db.ts                        ← Prisma singleton
  prompt.ts                    ← AI prompt builder
prisma/
  schema.prisma                ← Database schema
scripts/
  seed-invites.ts              ← Create invite codes
```

---

## Cost at scale

| Families | AI cost (3 scenarios/week × 13 weeks) |
|----------|---------------------------------------|
| 10       | ~$3                                   |
| 50       | ~$16                                  |
| 100      | ~$31                                  |
| 500      | ~$155                                 |

Supabase free tier handles up to 500MB database and 50,000 monthly active users.
Vercel free tier handles up to 100GB bandwidth and unlimited deploys.

The only real cost at MVP scale is the Anthropic API. Add a paid tier when you have 200+ families.
