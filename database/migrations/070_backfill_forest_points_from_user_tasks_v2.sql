-- WALD-KATEGORIEN: fehlende oder zu niedrige users.forest_points_* aus user_tasks auffüllen (idempotent).
--
-- Hintergrund:
-- - 066 setzte nur, wenn (forest_k + forest_m + forest_n + forest_r) = 0.
-- - Ohne task_category in user_tasks liefert die Summe 0 → keine Korrektur.
-- - Nutzer mit Bonus-QR (Wald > 0) wurden von 066 nicht angepasst, obwohl Aufgabenpunkte fehlten.
--
-- Vorgehen:
-- 1) task_category aus tasks.category nachziehen (wie 063), wo noch NULL.
-- 2) Pro Spalte GREATEST(aktueller Wert, SUM(points_earned) aus user_tasks für diese Kategorie).
--    So bleiben Bonus-/manuelle Wald-Punkte erhalten, fehlende Aufgaben-Anteile werden ergänzt.
-- Punkte ohne eine der vier Kategorien (NULL/sonstige im Verlauf) haben keine Wald-Spalte — unverändert.

UPDATE user_tasks ut
SET task_category = CASE TRIM(t.category::text)
  WHEN 'Kommunikation & Netzwerke' THEN 'kommunikation'
  WHEN 'Mensch & soziales Umfeld' THEN 'mensch'
  WHEN 'Natur & Umweltschutz' THEN 'natur'
  WHEN 'Ressourcenverbrauch & Materialeinsatz' THEN 'ressourcen'
  ELSE NULL
END
FROM tasks t
WHERE ut.task_id = t.id
  AND ut.task_category IS NULL;

UPDATE users u
SET
  forest_points_kommunikation = GREATEST(COALESCE(u.forest_points_kommunikation, 0), s.k),
  forest_points_mensch = GREATEST(COALESCE(u.forest_points_mensch, 0), s.m),
  forest_points_natur = GREATEST(COALESCE(u.forest_points_natur, 0), s.n),
  forest_points_ressourcen = GREATEST(COALESCE(u.forest_points_ressourcen, 0), s.r),
  updated_at = CURRENT_TIMESTAMP
FROM (
  SELECT
    user_id,
    COALESCE(SUM(CASE WHEN task_category = 'kommunikation' THEN GREATEST(COALESCE(points_earned, 0), 0) ELSE 0 END), 0)::integer AS k,
    COALESCE(SUM(CASE WHEN task_category = 'mensch' THEN GREATEST(COALESCE(points_earned, 0), 0) ELSE 0 END), 0)::integer AS m,
    COALESCE(SUM(CASE WHEN task_category = 'natur' THEN GREATEST(COALESCE(points_earned, 0), 0) ELSE 0 END), 0)::integer AS n,
    COALESCE(SUM(CASE WHEN task_category = 'ressourcen' THEN GREATEST(COALESCE(points_earned, 0), 0) ELSE 0 END), 0)::integer AS r
  FROM user_tasks
  WHERE COALESCE(points_earned, 0) > 0
  GROUP BY user_id
) s
WHERE u.id = s.user_id
  AND u.deleted_at IS NULL
  AND (s.k + s.m + s.n + s.r) > 0;
