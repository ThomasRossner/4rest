-- GDPR Consent table
CREATE TABLE IF NOT EXISTS user_consent (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    consent_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick consent lookups
CREATE INDEX IF NOT EXISTS idx_user_consent_user_id ON user_consent(user_id);
