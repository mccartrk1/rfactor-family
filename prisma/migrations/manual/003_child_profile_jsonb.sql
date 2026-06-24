-- Migration 003: Consolidate 22 Child profile VARCHAR columns → single JSONB column
--
-- WHY:
-- The 22 profile columns (name, bestFriend, grandparent, etc.) are ALWAYS read
-- and written as a complete unit. Column-per-field provides:
--   - Zero query filtering benefit (we never do WHERE bestFriend = 'X')
--   - Zero join benefit (profile is always on the same row)
--   - 22x schema migration cost when adding new profile fields
--
-- JSONB gives:
--   - Same single-row read performance
--   - Zero-migration field additions (new fields just go in the JSON)
--   - Operators for path queries if ever needed: profile->>'name'
--   - GIN index support for full-text search over profile data
--
-- CAUTION: This is a multi-step migration. Do NOT run steps 4+ until
-- application code is deployed with JSONB support.
--
-- ROLLBACK: Keep old columns until step 6 (the DROP). Can revert at any point
-- before that by deploying old code that reads from the VARCHAR columns.

-- Step 1: Add profile column
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS profile JSONB;

-- Step 2: Populate from existing columns
UPDATE "Child" SET profile = jsonb_build_object(
  'name',         COALESCE(name, ''),
  'familyName',   COALESCE(family_name, ''),
  'age',          COALESCE(age, ''),
  'grade',        COALESCE(grade, ''),
  'school',       COALESCE(school, ''),
  'mascot',       COALESCE(mascot, ''),
  'teacher',      COALESCE(teacher, ''),
  'bestFriend',   COALESCE(best_friend, ''),
  'friends',      COALESCE(friends, ''),
  'activity',     COALESCE(activity, ''),
  'game',         COALESCE(game, ''),
  'loveFood',     COALESCE(love_food, ''),
  'hateFood',     COALESCE(hate_food, ''),
  'athlete',      COALESCE(athlete, ''),
  'team',         COALESCE(team, ''),
  'grandparent',  COALESCE(grandparent, ''),
  'trustedAdults',COALESCE(trusted_adults, ''),
  'babysitter',   COALESCE(babysitter, ''),
  'hardThing',    COALESCE(hard_thing, ''),
  'flashPoint',   COALESCE(flash_point, ''),
  'siblings',     COALESCE(siblings, '')
)
WHERE profile IS NULL;

-- Step 3: Verify row count matches
DO $$
DECLARE
  total INT;
  with_profile INT;
BEGIN
  SELECT COUNT(*) INTO total FROM "Child";
  SELECT COUNT(*) INTO with_profile FROM "Child" WHERE profile IS NOT NULL;
  IF total <> with_profile THEN
    RAISE EXCEPTION 'Profile migration incomplete: %/% rows populated', with_profile, total;
  END IF;
  RAISE NOTICE 'Profile migration verified: % rows', total;
END $$;

-- Step 4: Set NOT NULL (after verification)
ALTER TABLE "Child" ALTER COLUMN profile SET NOT NULL;

-- ── DEPLOY APPLICATION CODE WITH JSONB SUPPORT BEFORE STEP 5 ──────────────────

-- Step 5: Add GIN index for potential future full-text search over profiles
-- Only needed if you want to do profile->>'name' queries at scale.
-- Skip if not needed.
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_child_profile_gin
--   ON "Child" USING GIN (profile);

-- Step 6: Drop old VARCHAR columns (ONLY after step 4 + app deployed + tested)
-- ALTER TABLE "Child"
--   DROP COLUMN IF EXISTS name,
--   DROP COLUMN IF EXISTS family_name,
--   DROP COLUMN IF EXISTS age,
--   DROP COLUMN IF EXISTS grade,
--   DROP COLUMN IF EXISTS school,
--   DROP COLUMN IF EXISTS mascot,
--   DROP COLUMN IF EXISTS teacher,
--   DROP COLUMN IF EXISTS best_friend,
--   DROP COLUMN IF EXISTS friends,
--   DROP COLUMN IF EXISTS activity,
--   DROP COLUMN IF EXISTS game,
--   DROP COLUMN IF EXISTS love_food,
--   DROP COLUMN IF EXISTS hate_food,
--   DROP COLUMN IF EXISTS athlete,
--   DROP COLUMN IF EXISTS team,
--   DROP COLUMN IF EXISTS grandparent,
--   DROP COLUMN IF EXISTS trusted_adults,
--   DROP COLUMN IF EXISTS babysitter,
--   DROP COLUMN IF EXISTS hard_thing,
--   DROP COLUMN IF EXISTS flash_point,
--   DROP COLUMN IF EXISTS siblings;

