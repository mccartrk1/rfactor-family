-- Migration 007: Enable Row-Level Security on every table
--
-- WHY:
-- Supabase exposes an auto-generated data API (PostgREST) reachable with the
-- project URL and the public anon key. Any table in the `public` schema without
-- Row-Level Security is readable, writable, and deletable through that API by
-- anyone. Supabase flagged this as rls_disabled_in_public and
-- sensitive_columns_exposed (User email, Account tokens, Session tokens, etc.).
--
-- THIS APP DOES NOT USE THE SUPABASE DATA API.
-- All database access goes through Prisma over the direct Postgres connection as
-- the `postgres` role, and login runs through NextAuth (Supabase Auth is
-- disabled). The `postgres` role owns these tables and has BYPASSRLS, so
-- enabling RLS does NOT affect the application.
--
-- WHAT THIS DOES:
--   1. Enables (and FORCEs) RLS on all 15 tables. With no policies defined, the
--      public `anon` and `authenticated` API roles are denied all access.
--   2. Revokes all table privileges from `anon` and `authenticated` as
--      defense-in-depth, since nothing legitimately uses those roles.
--
-- SAFE TO RUN WITH ZERO DOWNTIME. Idempotent — re-running is a no-op.
-- Run against production Supabase (direct connection / DIRECT_URL), e.g.:
--   psql "$DIRECT_URL" -f prisma/migrations/manual/007_enable_rls.sql

-- ─── Step 1: Enable + force RLS on every table ───────────────────────────────
-- FORCE ensures RLS applies even to the table owner if the app is ever pointed
-- at a non-superuser role; the `postgres` role still bypasses via BYPASSRLS.

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'Account',
    'Session',
    'VerificationToken',
    'User',
    'Family',
    'InviteCode',
    'Child',
    'LessonProgress',
    'ChallengeResponse',
    'ScenarioCache',
    'RateLimit',
    'Organization',
    'OrganizationMember',
    'Waitlist',
    'Referral'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;

-- ─── Step 2: Revoke public-API role privileges (defense-in-depth) ────────────
-- No table policies exist, so these roles already get nothing. This makes the
-- intent explicit and covers any table added before RLS is enabled on it.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Prevent future auto-granted privileges to the API roles on new objects.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- ─── Verification ────────────────────────────────────────────────────────────
-- After running, confirm no table is left unprotected. This query should return
-- ZERO rows:
--
--   SELECT tablename
--   FROM pg_tables
--   WHERE schemaname = 'public' AND rowsecurity = false;
--
-- In the Supabase dashboard, re-run the Security Advisor / linter and confirm
-- the rls_disabled_in_public and sensitive_columns_exposed issues are cleared.
