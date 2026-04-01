-- Konfigurierbares Onboarding: Rohantworten + aggregierte Dyaden-Werte
ALTER TABLE users ADD COLUMN IF NOT EXISTS dyad_scale_values JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS player_profile_answers JSONB;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dominant_dyad_check;
ALTER TABLE users ADD CONSTRAINT users_dominant_dyad_check
  CHECK (dominant_dyad IS NULL OR (dominant_dyad >= 1 AND dominant_dyad <= 64));

COMMENT ON COLUMN users.dyad_scale_values IS 'Aggregierte Skalenwerte 0–4 pro Dyade (JSON array)';
COMMENT ON COLUMN users.player_profile_answers IS 'Rohantworten 0–4 pro Frage in Reihenfolge (JSON array)';
