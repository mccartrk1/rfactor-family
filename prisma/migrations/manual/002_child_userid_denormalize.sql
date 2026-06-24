-- Migration 002: Denormalize userId onto Child
-- Eliminates the JOIN in the ownership check query.
--
-- Ownership check before: 
--   SELECT 1 FROM "Child" c JOIN "Family" f ON c.family_id = f.id
--   WHERE c.id = $1 AND f.user_id = $2
--
-- Ownership check after:
--   SELECT 1 FROM "Child" WHERE id = $1 AND user_id = $2  ← index-only lookup
--
-- This check runs on every progress save, scenario request, and challenge update.
-- At 50 families doing lessons simultaneously: 150+ JOIN queries per minute → 150 direct lookups.
--
-- Safe to run with zero downtime. Steps:
--   1. Add column (nullable, no default — safe, doesn't block reads or writes)
--   2. Backfill in batches (reads only existing data)
--   3. Set NOT NULL (fast if no NULLs exist)
--   4. Add index

-- Step 1: Add nullable column
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Step 2: Backfill from Family
-- Run in batches of 1000 to avoid locking
DO $$
DECLARE
  batch_size INT := 1000;
  offset_val INT := 0;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE "Child" c
    SET user_id = f.user_id
    FROM "Family" f
    WHERE c.family_id = f.id
      AND c.user_id IS NULL
    LIMIT batch_size;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;
    
    PERFORM pg_sleep(0.01); -- 10ms pause between batches
    RAISE NOTICE 'Backfilled % rows', rows_updated;
  END LOOP;
  RAISE NOTICE 'Backfill complete';
END $$;

-- Step 3: Verify no NULLs remain
DO $$
DECLARE
  null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Child" WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % rows still have NULL user_id', null_count;
  END IF;
  RAISE NOTICE 'Backfill verified: no NULLs';
END $$;

-- Step 4: Set NOT NULL constraint
ALTER TABLE "Child" ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_child_user_id
  ON "Child" (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_child_user_family
  ON "Child" (user_id, family_id);

-- Step 6: Verify with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM "Child"
WHERE id = 'sample-id' AND user_id = 'sample-user-id';
-- Expected: Index Scan using idx_child_user_id, not Seq Scan

