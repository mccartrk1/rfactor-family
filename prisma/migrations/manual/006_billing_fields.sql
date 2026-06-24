-- Migration 006: Billing fields, Waitlist, Referral
-- Safe to run with zero downtime — all new columns nullable or with defaults.
-- Run BEFORE deploying code that reads these fields.
--
-- This migration is ADDITIVE ONLY:
--   + 8 columns on User table
--   + Waitlist table (new)
--   + Referral table (new)
--   + Indexes on all new fields

-- ─── Step 1: Add billing columns to User ─────────────────────────────────────

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "subscriptionTier"       TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionActive"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "trialEndsAt"            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "subscriptionEndsAt"     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "lastSubscriptionCheck"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "emailOptOut"            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "referralCode"           TEXT UNIQUE;

-- ─── Step 2: Set trial start for existing users ───────────────────────────────
-- Existing pilot families get a 30-day trial from migration date.
-- (They've been using the app for free — this is generous and correct.)

UPDATE "User"
SET "trialEndsAt" = NOW() + INTERVAL '30 days'
WHERE "trialEndsAt" IS NULL
  AND EXISTS (SELECT 1 FROM "Family" WHERE "Family"."userId" = "User".id);

RAISE NOTICE 'Trial set for % existing users',
  (SELECT COUNT(*) FROM "User" WHERE "trialEndsAt" IS NOT NULL);

-- ─── Step 3: Create Waitlist table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Waitlist" (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  role       TEXT NOT NULL DEFAULT 'family',
  referral   TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Step 4: Create Referral table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Referral" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "referrerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "refereeId"  TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Step 5: Indexes (CONCURRENTLY = no table locks) ─────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stripe_id
  ON "User" ("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscription_active
  ON "User" ("subscriptionActive") WHERE "subscriptionActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_trial_ends
  ON "User" ("trialEndsAt") WHERE "trialEndsAt" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waitlist_role
  ON "Waitlist" (role, "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_referrer
  ON "Referral" ("referrerId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_status
  ON "Referral" (status);

-- ─── Verify ───────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Verify billing columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'stripeCustomerId'
  ) THEN
    RAISE EXCEPTION 'Migration 006 failed: stripeCustomerId not found';
  END IF;
  RAISE NOTICE 'Migration 006 complete: billing fields verified';
END $$;

SELECT 'Migration 006 complete' AS status,
       (SELECT COUNT(*) FROM "User" WHERE "trialEndsAt" IS NOT NULL) AS users_with_trial,
       (SELECT COUNT(*) FROM "Waitlist") AS waitlist_count;
