-- Wald-Kategoriepunkte (kumulativ, nur für Waldwachstum; unabhängig von users.points)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS forest_points_kommunikation INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forest_points_mensch INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forest_points_natur INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forest_points_ressourcen INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_tasks
  ADD COLUMN IF NOT EXISTS task_category VARCHAR(32);

-- Backfill from tasks.category (normalized keys set in app; here best-effort from tasks)
UPDATE user_tasks ut
SET task_category = CASE TRIM(t.category::text)
  WHEN 'Kommunikation & Netzwerke' THEN 'kommunikation'
  WHEN 'Mensch & soziales Umfeld' THEN 'mensch'
  WHEN 'Natur & Umweltschutz' THEN 'natur'
  WHEN 'Ressourcenverbrauch & Materialeinsatz' THEN 'ressourcen'
  ELSE NULL
END
FROM tasks t
WHERE ut.task_id = t.id AND ut.task_category IS NULL;

-- Bonus-QR: gewählte Wald-Kategorie (Pflicht bei neuer Generierung in der App)
ALTER TABLE points_bonus_qr_tokens
  ADD COLUMN IF NOT EXISTS forest_category VARCHAR(32);
