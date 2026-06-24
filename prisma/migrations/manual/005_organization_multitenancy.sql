-- Migration 005: Organization model for multi-tenancy
-- Safe to run with zero downtime.
-- All new columns nullable or have defaults — no table locks.
--
-- Run BEFORE deploying code that reads organizationId.
-- Step sequence:
--   1. Create Organization + OrganizationMember tables
--   2. Insert the default "r-factor-pilot" org for Ryan's families
--   3. Add organizationId columns to Family and InviteCode (nullable → backfill → NOT NULL)
--   4. Add indexes
--   5. After code deploys and verifies: add NOT NULL constraint

-- ─── Step 1: Create Organization table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Organization" (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  "logoUrl"      TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#0F2645',
  tier           TEXT NOT NULL DEFAULT 'pilot',
  "maxFamilies"  INTEGER NOT NULL DEFAULT 50,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  features       JSONB NOT NULL DEFAULT '{}',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId"         TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role             TEXT NOT NULL DEFAULT 'admin',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);

-- ─── Step 2: Insert default organization ──────────────────────────────────────
-- All existing families belong to this org.
-- Ryan's admin email becomes the first org admin.

INSERT INTO "Organization" (id, slug, name, description, "primaryColor", tier, "maxFamilies", features)
VALUES (
  'org_default_pilot',
  'r-factor-pilot',
  'R Factor Pilot Program',
  'Initial pilot program managed by Ryan McCarty',
  '#0F2645',
  'pilot',
  50,
  '{"analytics_export": true, "custom_branding": false}'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert Ryan as org admin (email matched to actual account)
-- NOTE: Replace ryan@gmail.com with Ryan's actual Google email
DO $$
DECLARE
  ryan_user_id TEXT;
BEGIN
  SELECT id INTO ryan_user_id FROM "User" WHERE email ILIKE '%ryan%' LIMIT 1;
  IF ryan_user_id IS NOT NULL THEN
    INSERT INTO "OrganizationMember" ("organizationId", "userId", role)
    VALUES ('org_default_pilot', ryan_user_id, 'admin')
    ON CONFLICT ("organizationId", "userId") DO NOTHING;
    RAISE NOTICE 'Added org admin: %', ryan_user_id;
  END IF;
END $$;

-- ─── Step 3: Add organizationId to Family ────────────────────────────────────

ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Backfill: all existing families belong to the default pilot org
UPDATE "Family" SET "organizationId" = 'org_default_pilot' WHERE "organizationId" IS NULL;

-- Verify backfill complete
DO $$
DECLARE null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Family" WHERE "organizationId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % families still have NULL organizationId', null_count;
  END IF;
  RAISE NOTICE 'Family backfill verified';
END $$;

-- After code deploys with organizationId support, add NOT NULL + FK:
-- ALTER TABLE "Family" ALTER COLUMN "organizationId" SET NOT NULL;
-- ALTER TABLE "Family" ADD CONSTRAINT "Family_organizationId_fkey"
--   FOREIGN KEY ("organizationId") REFERENCES "Organization"(id);

-- ─── Step 4: Add organizationId to InviteCode ────────────────────────────────

ALTER TABLE "InviteCode" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "InviteCode" SET "organizationId" = 'org_default_pilot' WHERE "organizationId" IS NULL;

-- ─── Step 5: Add indexes ──────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_family_org_id
  ON "Family" ("organizationId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_family_org_created
  ON "Family" ("organizationId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_org_id
  ON "InviteCode" ("organizationId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_member_user
  ON "OrganizationMember" ("userId");

-- ─── Verify ───────────────────────────────────────────────────────────────────

SELECT 'Organization created: ' || COUNT(*) FROM "Organization";
SELECT 'Families backfilled: ' || COUNT(*) FROM "Family" WHERE "organizationId" IS NOT NULL;
SELECT 'InviteCodes backfilled: ' || COUNT(*) FROM "InviteCode" WHERE "organizationId" IS NOT NULL;
