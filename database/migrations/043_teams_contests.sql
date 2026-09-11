-- Teams und Contests Feature
-- Migration 043: Teams, Contests, QR-Codes

-- Teams Tabelle
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_pool INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Team-Mitglieder Tabelle
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_contributed INTEGER DEFAULT 0 NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Contests Tabelle
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    end_date TIMESTAMP NOT NULL,
    reward_first_place INTEGER,
    reward_second_place INTEGER,
    reward_third_place INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Contest-Teilnehmer Tabelle
CREATE TABLE IF NOT EXISTS contest_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0 NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, user_id)
);

-- Persönliche QR-Codes für Benutzer
CREATE TABLE IF NOT EXISTS user_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id)
);

-- QR-Codes für Teams
CREATE TABLE IF NOT EXISTS team_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR-Codes für Contests
CREATE TABLE IF NOT EXISTS contest_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_contest_id ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_user_id ON contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_user_id ON user_qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_qr_token ON user_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_team_qr_codes_team_id ON team_qr_codes(team_id);
CREATE INDEX IF NOT EXISTS idx_team_qr_codes_qr_token ON team_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_contest_qr_codes_contest_id ON contest_qr_codes(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_qr_codes_qr_token ON contest_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by);
CREATE INDEX IF NOT EXISTS idx_contests_end_date ON contests(end_date);
CREATE INDEX IF NOT EXISTS idx_contests_active ON contests(active);

