-- Spielerprofilierung: Dyaden-Skalen, Status, optionaler Anzeigename (Spec: Spielerprofilierung-Vollversion)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS player_profile_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dyad_scale_1 SMALLINT,
  ADD COLUMN IF NOT EXISTS dyad_scale_2 SMALLINT,
  ADD COLUMN IF NOT EXISTS dyad_scale_3 SMALLINT,
  ADD COLUMN IF NOT EXISTS dyad_scale_4 SMALLINT,
  ADD COLUMN IF NOT EXISTS dominant_dyad SMALLINT,
  ADD COLUMN IF NOT EXISTS profile_display_name VARCHAR(128),
  ADD COLUMN IF NOT EXISTS player_profile_completed_at TIMESTAMPTZ;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_player_profile_status_check;
ALTER TABLE users ADD CONSTRAINT users_player_profile_status_check
  CHECK (player_profile_status IN ('pending', 'skipped', 'completed'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dyad_scale_1_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dyad_scale_2_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dyad_scale_3_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dyad_scale_4_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dominant_dyad_check;

ALTER TABLE users ADD CONSTRAINT users_dyad_scale_1_check
  CHECK (dyad_scale_1 IS NULL OR (dyad_scale_1 >= 0 AND dyad_scale_1 <= 4));
ALTER TABLE users ADD CONSTRAINT users_dyad_scale_2_check
  CHECK (dyad_scale_2 IS NULL OR (dyad_scale_2 >= 0 AND dyad_scale_2 <= 4));
ALTER TABLE users ADD CONSTRAINT users_dyad_scale_3_check
  CHECK (dyad_scale_3 IS NULL OR (dyad_scale_3 >= 0 AND dyad_scale_3 <= 4));
ALTER TABLE users ADD CONSTRAINT users_dyad_scale_4_check
  CHECK (dyad_scale_4 IS NULL OR (dyad_scale_4 >= 0 AND dyad_scale_4 <= 4));
ALTER TABLE users ADD CONSTRAINT users_dominant_dyad_check
  CHECK (dominant_dyad IS NULL OR (dominant_dyad >= 1 AND dominant_dyad <= 4));

-- Bestandsnutzer: kein erzwungenes Intro; neue Konten erhalten per DEFAULT weiterhin 'pending'
UPDATE users SET player_profile_status = 'skipped' WHERE player_profile_status = 'pending';
