-- Create points_bonus_qr_tokens table for employee-generated QR codes
CREATE TABLE IF NOT EXISTS points_bonus_qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    points_amount INTEGER NOT NULL CHECK (points_amount > 0),
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    redeemed_by UUID REFERENCES users(id),
    redeemed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_points_bonus_qr_tokens_qr_token ON points_bonus_qr_tokens(qr_token);
CREATE INDEX IF NOT EXISTS idx_points_bonus_qr_tokens_status ON points_bonus_qr_tokens(status);
CREATE INDEX IF NOT EXISTS idx_points_bonus_qr_tokens_expires_at ON points_bonus_qr_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_points_bonus_qr_tokens_generated_by ON points_bonus_qr_tokens(generated_by);

