-- One-time cleanup: remove duplicate rewards created by the recurrence scheduler bug.
-- Keeps: (1) all rewards with recurrence = 'once', (2) one template per (title, points_cost, recurrence) for daily/weekly/monthly.
-- Run on production: docker exec -i roots-postgres-homeserver psql -U roots_user -d roots_of_impact < scripts/cleanup-reward-recurrence-duplicates.sql

BEGIN;

-- IDs to keep: one template per (title, points_cost, recurrence) for recurring rewards (oldest by created_at)
CREATE TEMP TABLE reward_templates_to_keep AS
SELECT DISTINCT ON (title, points_cost, recurrence) id
FROM rewards
WHERE recurrence IN ('daily', 'weekly', 'monthly')
ORDER BY title, points_cost, recurrence, created_at ASC;

-- Delete recurring rewards that are NOT the kept template
DELETE FROM rewards
WHERE recurrence IN ('daily', 'weekly', 'monthly')
  AND id NOT IN (SELECT id FROM reward_templates_to_keep);

-- Optional: report how many remain
-- SELECT recurrence, COUNT(*) FROM rewards GROUP BY recurrence;

COMMIT;
