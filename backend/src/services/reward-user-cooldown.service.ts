import { getPool } from '../database/connection.js';

let hasGeneratedFromColumnCache: boolean | null = null;

async function rewardsHasGeneratedFromColumn(db: ReturnType<typeof getPool>): Promise<boolean> {
  if (hasGeneratedFromColumnCache !== null) return hasGeneratedFromColumnCache;
  const r = await db.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'generated_from_reward_id'
     LIMIT 1`
  );
  hasGeneratedFromColumnCache = r.rows.length > 0;
  return hasGeneratedFromColumnCache;
}

/**
 * Vorlagen-ID plus alle daraus erzeugten Belohnungszeilen (falls Spalte existiert).
 * So zählen Einlösungen an einer älteren Instanz für dieselbe „logische“ Belohnung.
 */
export async function getRewardFamilyRewardIds(rewardId: string): Promise<string[]> {
  const db = getPool();
  if (!(await rewardsHasGeneratedFromColumn(db))) {
    return [rewardId];
  }
  const row = await db.query<{ id: string; generated_from_reward_id: string | null }>(
    `SELECT id, generated_from_reward_id FROM rewards WHERE id = $1`,
    [rewardId]
  );
  if (row.rows.length === 0) {
    return [rewardId];
  }
  const templateId = row.rows[0].generated_from_reward_id ?? row.rows[0].id;
  const fam = await db.query<{ id: string }>(
    `SELECT id FROM rewards WHERE id = $1 OR generated_from_reward_id = $1`,
    [templateId]
  );
  return fam.rows.map((x) => x.id);
}

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
  const ids = await getRewardFamilyRewardIds(rewardId);
  const db = getPool();
  const r = await db.query(
    `SELECT 1 FROM reward_redemptions
     WHERE user_id = $1 AND reward_id = ANY($2::uuid[]) AND status = 'pending' LIMIT 1`,
    [userId, ids]
  );
  return r.rows.length > 0;
}

/** Irgendeine abgeschlossene Einlösung (used) – für recurrence "once" pro Belohnungszeile. */
export async function hasUsedRewardRedemption(userId: string, rewardId: string): Promise<boolean> {
  const ids = await getRewardFamilyRewardIds(rewardId);
  const db = getPool();
  const r = await db.query(
    `SELECT 1 FROM reward_redemptions
     WHERE user_id = $1 AND reward_id = ANY($2::uuid[]) AND status = 'used' LIMIT 1`,
    [userId, ids]
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

  const ids = await getRewardFamilyRewardIds(rewardId);
  const db = getPool();
  const r = await db.query<{ t: Date | null }>(
    `SELECT COALESCE(verified_at, redeemed_at) AS t
     FROM reward_redemptions
     WHERE user_id = $1 AND reward_id = ANY($2::uuid[]) AND status = 'used'
     ORDER BY COALESCE(verified_at, redeemed_at) DESC NULLS LAST
     LIMIT 1`,
    [userId, ids]
  );
  const last = r.rows[0]?.t;
  if (!last) return false;

  const lastMs = new Date(last).getTime();
  const elapsedDays = (Date.now() - lastMs) / (1000 * 60 * 60 * 24);
  return elapsedDays < days;
}
