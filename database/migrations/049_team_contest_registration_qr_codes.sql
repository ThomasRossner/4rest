-- Migration: Team and Contest Registration QR Codes
-- Date: 2026-01-14
-- Adds tables for registration QR codes that allow new users to register and automatically join teams/contests

-- Registration QR Codes for Teams
CREATE TABLE IF NOT EXISTS team_registration_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id) -- Only one registration QR code per team
);

-- Registration QR Codes for Contests
CREATE TABLE IF NOT EXISTS contest_registration_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id) -- Only one registration QR code per contest
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_team_registration_qr_codes_team_id ON team_registration_qr_codes(team_id);
CREATE INDEX IF NOT EXISTS idx_team_registration_qr_codes_qr_token ON team_registration_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_team_registration_qr_codes_enabled ON team_registration_qr_codes(enabled);
CREATE INDEX IF NOT EXISTS idx_contest_registration_qr_codes_contest_id ON contest_registration_qr_codes(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_registration_qr_codes_qr_token ON contest_registration_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_contest_registration_qr_codes_enabled ON contest_registration_qr_codes(enabled);

COMMENT ON TABLE team_registration_qr_codes IS 'QR codes for new user registration that automatically assigns users to teams';
COMMENT ON TABLE contest_registration_qr_codes IS 'QR codes for new user registration that automatically assigns users to contests';
