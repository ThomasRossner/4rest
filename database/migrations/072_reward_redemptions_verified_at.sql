-- Zeitpunkt der tatsächlichen Einlösung (Rezeption scannt QR) – Grundlage für pro-User-Wiederholung
ALTER TABLE reward_redemptions
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

UPDATE reward_redemptions
SET verified_at = redeemed_at
WHERE status = 'used'
  AND verified_at IS NULL
  AND redeemed_at IS NOT NULL;

COMMENT ON COLUMN reward_redemptions.verified_at IS
  'Wann die Belohnung an der Rezeption als eingelöst verbucht wurde; steuert die Sperrfrist (Recurrence) pro Nutzer.';
