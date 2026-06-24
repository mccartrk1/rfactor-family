-- Migration 004: Materialized view for admin family list
--
-- Problem: getFamilyList() currently issues 5 queries and transfers 660K rows
-- at 5,000 families just to compute 5 aggregates per family.
--
-- Solution: A single aggregating SQL query computes all metrics server-side.
-- Prisma's $queryRaw executes this as a prepared statement.
--
-- The view below is provided as documentation of the query structure.
-- The actual implementation uses $queryRaw in lib/admin.ts — a view is not
-- required, but provided here for reference and potential future use as a
-- materialized view if admin loads are heavy.

-- Optional: Create as a regular view (no caching, always fresh)
CREATE OR REPLACE VIEW v_family_summary AS
SELECT
  f.id                                          AS family_id,
  f.family_name,
  f.created_at,
  u.email,
  COUNT(DISTINCT c.id)                          AS child_count,
  COUNT(lp.id) FILTER (WHERE lp.completed)     AS total_completions,
  MAX(lp.week_number) FILTER (WHERE lp.completed) AS max_week_completed,
  COUNT(cr.id) FILTER (WHERE cr.response = 'yes') AS challenge_yes_count,
  COUNT(sc.id)                                  AS ai_call_count,
  MAX(lp.updated_at)                            AS last_activity,
  COUNT(DISTINCT c.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM "LessonProgress" lp2
      WHERE lp2.child_id = c.id
        AND lp2.week_number = 13
        AND lp2.completed = true
    )
  )                                             AS programs_complete
FROM "Family" f
JOIN "User" u ON f.user_id = u.id
LEFT JOIN "Child" c ON c.family_id = f.id
LEFT JOIN "LessonProgress" lp ON lp.child_id = c.id
LEFT JOIN "ChallengeResponse" cr ON cr.child_id = c.id
LEFT JOIN "ScenarioCache" sc ON sc.child_id = c.id
GROUP BY f.id, f.family_name, f.created_at, u.email;

-- Query the view:
-- SELECT * FROM v_family_summary ORDER BY created_at DESC LIMIT 100;

-- EXPLAIN ANALYZE SELECT * FROM v_family_summary ORDER BY created_at DESC LIMIT 100;
-- Expected: Hash Aggregate → Merge Join → Index Scans
-- Not: Nested Loop → Seq Scan (current behavior)

