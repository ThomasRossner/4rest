-- Add QR token field to reward redemptions for QR code verification
ALTER TABLE reward_redemptions
  ADD COLUMN IF NOT EXISTS qr_token VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_qr_token ON reward_redemptions(qr_token);

