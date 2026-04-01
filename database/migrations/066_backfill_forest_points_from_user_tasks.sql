-- Historische Korrektur: Wald-Kategoriepunkte aus user_tasks, wenn users noch überall 0 hatten.
-- Grund: addForestCategoryPoints hat u. a. bei DECIMAL/string-Punkten still nichts getan (Number.isFinite).
-- Einschränkung: Nur eigene Abschlüsse in user_tasks; Team-Anteile ohne eigene Zeile sind nicht enthalten.

UPDATE users u
SET
  forest_points_kommunikation = s.k,
  forest_points_mensch = s.m,
  forest_points_natur = s.n,
  forest_points_ressourcen = s.r,
  updated_at = CURRENT_TIMESTAMP
FROM (
  SELECT
    user_id,
    COALESCE(SUM(CASE WHEN task_category = 'kommunikation' THEN points_earned ELSE 0 END), 0)::integer AS k,
    COALESCE(SUM(CASE WHEN task_category = 'mensch' THEN points_earned ELSE 0 END), 0)::integer AS m,
    COALESCE(SUM(CASE WHEN task_category = 'natur' THEN points_earned ELSE 0 END), 0)::integer AS n,
    COALESCE(SUM(CASE WHEN task_category = 'ressourcen' THEN points_earned ELSE 0 END), 0)::integer AS r
  FROM user_tasks
  WHERE points_earned > 0 AND task_category IS NOT NULL
  GROUP BY user_id
) s
WHERE u.id = s.user_id
  AND u.deleted_at IS NULL
  AND (
    COALESCE(u.forest_points_kommunikation, 0)
    + COALESCE(u.forest_points_mensch, 0)
    + COALESCE(u.forest_points_natur, 0)
    + COALESCE(u.forest_points_ressourcen, 0)
  ) = 0;
