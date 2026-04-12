import { getPool } from '../database/connection.js';

/** Intervall in Tagen für daily / weekly / monthly (analog zu alter Scheduler-Logik). */
export function recurrenceToCooldownDays(recurrence: string | null | undefined): number | null {
  if (!recurrence || recurrence === 'once') return null;
  switch (recurrence) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    default:
      return null;
  }
}

export async function hasPendingRewardRedemption(userId: string, rewardId: string): Promise<boolean> {
  const db = getPool();
  const r = await db.query(
    `SELECT 1 FROM reward_redemptions
     WHERE user_id = $1 AND reward_id = $2 AND status = 'pending' LIMIT 1`,
    [userId, rewardId]
  );
  return r.rows.length > 0;
}

/** Irgendeine abgeschlossene Einlösung (used) – für recurrence "once" pro Belohnungszeile. */
export async function hasUsedRewardRedemption(userId: string, rewardId: string): Promise<boolean> {
  const db = getPool();
  const r = await db.query(
    `SELECT 1 FROM reward_redemptions
     WHERE user_id = $1 AND reward_id = $2 AND status = 'used' LIMIT 1`,
    [userId, rewardId]
  );
  return r.rows.length > 0;
}

/**
 * true = Nutzer ist noch in der Sperrfrist (Belohnung nicht erneut anbieten / einlösen).
 * Basis: letzte verified_at bei status used; fehlende verified_at fallen auf redeemed_at zurück.
 */
export async function isUserInRecurrenceCooldown(
  userId: string,
  rewardId: string,
  recurrence: string | null | undefined
): Promise<boolean> {
  const days = recurrenceToCooldownDays(recurrence);
  if (days == null) return false;

  const db = getPool();
  const r = await db.query<{ t: Date | null }>(
    `SELECT COALESCE(verified_at, redeemed_at) AS t
     FROM reward_redemptions
     WHERE user_id = $1 AND reward_id = $2 AND status = 'used'
     ORDER BY COALESCE(verified_at, redeemed_at) DESC NULLS LAST
     LIMIT 1`,
    [userId, rewardId]
  );
  const last = r.rows[0]?.t;
  if (!last) return false;

  const lastMs = new Date(last).getTime();
  const elapsedDays = (Date.now() - lastMs) / (1000 * 60 * 60 * 24);
  return elapsedDays < days;
}
