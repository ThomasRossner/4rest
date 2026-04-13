-- Email delivery reliability: logging, suppression, resend throttling

CREATE TABLE IF NOT EXISTS email_delivery_log (
  id BIGSERIAL PRIMARY KEY,
  recipient_email VARCHAR(320) NOT NULL,
  message_type VARCHAR(80) NOT NULL,
  template_key VARCHAR(120),
  subject TEXT,
  provider VARCHAR(50) DEFAULT 'smtp',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 1,
  smtp_response TEXT,
  error_code VARCHAR(120),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_log_email_created
  ON email_delivery_log (recipient_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_delivery_log_type_status
  ON email_delivery_log (message_type, status, created_at DESC);

CREATE TABLE IF NOT EXISTS email_suppressions (
  recipient_email VARCHAR(320) PRIMARY KEY,
  reason VARCHAR(80) NOT NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'manual',
  expires_at TIMESTAMP,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_suppressions_expires_at
  ON email_suppressions (expires_at);
