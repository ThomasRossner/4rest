import { getPool } from '../database/connection.js';

type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'suppressed' | 'deferred' | 'bounced';

export type DeliveryLogInput = {
  recipientEmail: string;
  messageType: string;
  templateKey?: string;
  subject?: string;
  provider?: string;
  status: DeliveryStatus;
  attemptCount?: number;
  smtpResponse?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const db = getPool();
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const res = await db.query(
    `SELECT 1
       FROM email_suppressions
      WHERE recipient_email = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1`,
    [normalized]
  );
  return res.rows.length > 0;
}

export async function addEmailSuppression(params: {
  email: string;
  reason: string;
  source?: string;
  expiresAt?: Date | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const db = getPool();
  const normalized = normalizeEmail(params.email);
  if (!normalized) return;

  await db.query(
    `INSERT INTO email_suppressions (recipient_email, reason, source, expires_at, details, updated_at)
     VALUES ($1, $2, COALESCE($3, 'runtime'), $4, $5::jsonb, NOW())
     ON CONFLICT (recipient_email)
     DO UPDATE SET
       reason = EXCLUDED.reason,
       source = EXCLUDED.source,
       expires_at = EXCLUDED.expires_at,
       details = EXCLUDED.details,
       updated_at = NOW()`,
    [
      normalized,
      params.reason,
      params.source ?? 'runtime',
      params.expiresAt ?? null,
      JSON.stringify(params.details ?? {}),
    ]
  );
}

export async function createDeliveryLog(input: DeliveryLogInput): Promise<number> {
  const db = getPool();
  const res = await db.query<{ id: number }>(
    `INSERT INTO email_delivery_log (
       recipient_email, message_type, template_key, subject, provider, status,
       attempt_count, smtp_response, error_code, error_message, metadata, last_attempt_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, COALESCE($5, 'smtp'), $6,
       COALESCE($7, 1), $8, $9, $10, $11::jsonb, NOW(), NOW()
     )
     RETURNING id`,
    [
      normalizeEmail(input.recipientEmail),
      input.messageType,
      input.templateKey ?? null,
      input.subject ?? null,
      input.provider ?? 'smtp',
      input.status,
      input.attemptCount ?? 1,
      input.smtpResponse ?? null,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
  return res.rows[0].id;
}

export async function updateDeliveryLog(
  id: number,
  patch: Partial<DeliveryLogInput> & { attemptCount?: number }
): Promise<void> {
  const db = getPool();
  await db.query(
    `UPDATE email_delivery_log
        SET status = COALESCE($2, status),
            attempt_count = COALESCE($3, attempt_count),
            smtp_response = COALESCE($4, smtp_response),
            error_code = COALESCE($5, error_code),
            error_message = COALESCE($6, error_message),
            metadata = COALESCE($7::jsonb, metadata),
            last_attempt_at = NOW(),
            updated_at = NOW()
      WHERE id = $1`,
    [
      id,
      patch.status ?? null,
      patch.attemptCount ?? null,
      patch.smtpResponse ?? null,
      patch.errorCode ?? null,
      patch.errorMessage ?? null,
      patch.metadata ? JSON.stringify(patch.metadata) : null,
    ]
  );
}

export async function canResendVerificationNow(email: string, minIntervalSeconds = 60): Promise<boolean> {
  const db = getPool();
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const res = await db.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt
       FROM email_delivery_log
      WHERE recipient_email = $1
        AND message_type = 'email_verification'
        AND created_at > NOW() - ($2::text || ' seconds')::interval`,
    [normalized, String(minIntervalSeconds)]
  );
  return Number(res.rows[0]?.cnt ?? '0') === 0;
}
