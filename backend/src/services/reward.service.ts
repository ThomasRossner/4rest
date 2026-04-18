import { getPool } from '../database/connection.js';
import { resolveI18n, normalizeContentLang } from '../utils/i18n.js';
import { getUserById } from './user.service.js';
import { voucherSystem } from '../integrations/voucher.js';
import { broadcastRedemptionUpdate } from '../ws/reward-broadcast.js';
import { UserType } from '../constants/enums.js';
import { Location } from './location.service.js';
import {
  validateRewardType,
  validateRecurrence,
  normalizePointsCost,
} from '../utils/validation.js';
import { buildTeamContestFilterClauses, getConfiguredHotelId } from '../utils/queryBuilder.js';
import { redeemRewardFromTeam, getUserActiveTeam, getTeamTotalPoints, deductTeamPoints } from './team.service.js';
import {
  recurrenceToCooldownDays,
  hasPendingRewardRedemption,
  hasUsedRewardRedemption,
  isUserInRecurrenceCooldown,
} from './reward-user-cooldown.service.js';

export async function getRewardsService(userId: string) {
  const db = getPool();
  const user = await getUserById(userId);
  const role: string | null = user?.role ?? null;
  const userType: UserType | null = user?.user_type ?? null;

  const params: any[] = [];
  let paramIndex = { current: 1 };

  // Use explicit column list to avoid selecting non-existent columns (allowed_user_types, allowed_hotel_ids, allowed_roles, allowed_role were removed in migrations 037/040)
  // Use LEFT JOIN to include rewards even if location doesn't exist or is inactive
  let query = `SELECT 
    r.id, r.title, r.description, r.title_i18n, r.description_i18n,
    r.points_cost, r.reward_type, r.voucher_code, r.external_api_id, 
    r.active, r.reward_art, r.kategorie, 
    r.recurrence, r.last_generated_at, r.zielgruppe, r.location_id, r.thumbnail_url, 
    r.created_at, r.updated_at, 
    row_to_json(l.*) AS location 
    FROM rewards r LEFT JOIN locations l ON l.id = r.location_id WHERE r.active = TRUE`;

  // Check if allowed_teams and allowed_contests columns exist
  // IMPORTANT: We need BOTH columns to exist, not just one, because buildTeamContestFilterClauses
  // references both columns in the SQL it generates
  let columnsExist = false;
  try {
    const checkResult = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'rewards' 
      AND column_name IN ('allowed_teams', 'allowed_contests')
    `);
    // Both columns must exist (count = 2)
    columnsExist = checkResult.rows[0]?.count === 2;
  } catch (error) {
    // If check fails, assume columns don't exist
    columnsExist = false;
  }

  let hasGeneratedFromColumn = false;
  try {
    const gf = await db.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'generated_from_reward_id'`
    );
    hasGeneratedFromColumn = gf.rows.length > 0;
  } catch {
    hasGeneratedFromColumn = false;
  }

  let userTeamIds: string[] = [];
  let userContestIds: string[] = [];
  let applyFilters = true;

  // Administrators and redaktion see all rewards (consistent with task.service.ts)
  if (role === 'administrator' || role === 'redaktion') {
    // Administrators and redaktion see all rewards
    applyFilters = false;
  } else {
    // Only get team/contest info if columns exist
    if (columnsExist) {
      // Get user's team memberships
      const teamResult = await db.query(
        'SELECT team_id FROM team_members WHERE user_id = $1',
        [userId]
      );
      userTeamIds = teamResult.rows.map((row: any) => row.team_id);
      
      // Get user's contest participations
      const contestResult = await db.query(
        'SELECT contest_id FROM contest_participants WHERE user_id = $1',
        [userId]
      );
      userContestIds = contestResult.rows.map((row: any) => row.contest_id);
    } else {
      // If columns don't exist, disable filtering
      applyFilters = false;
    }
  }

  // Filter by team/contest assignments
  // Only enable if both allowed_teams AND allowed_contests columns exist
  // The buildTeamContestFilterClauses function requires BOTH columns to work correctly
  if (applyFilters && columnsExist) {
    const hotelId = getConfiguredHotelId();
    const filterClauses = buildTeamContestFilterClauses(
      {
        userTeamIds: userTeamIds.length > 0 ? userTeamIds : null,
        userContestIds: userContestIds.length > 0 ? userContestIds : null,
        userType,
        hotelId,
        applyFilters: true,
      },
      params,
      paramIndex
    );
    
    // Convert clauses to SQL WHERE conditions
    // The clauses use table aliases, so we need to adapt them for rewards table
    // Note: allowed_user_types and allowed_hotel_ids were removed in migration 038
    const rewardClauses = filterClauses.map(clause => 
      clause.replace(/allowed_teams/g, 'r.allowed_teams')
            .replace(/allowed_contests/g, 'r.allowed_contests')
    );
    
    if (rewardClauses.length > 0) {
      query += ` AND ${rewardClauses.join(' AND ')}`;
    }
  } else {
    // Log why filtering is disabled for debugging
    if (applyFilters && !columnsExist) {
      console.log('[REWARD SERVICE] Team/contest filtering disabled: columns do not exist');
    }
  }

  if (hasGeneratedFromColumn) {
    query += ` AND r.generated_from_reward_id IS NULL`;
  }

  query += ' ORDER BY r.points_cost ASC LIMIT 500';

  const result = await db.query(query, params);
  const unique = new Map<string, any>();
  for (const row of result.rows) {
    unique.set(row.id, row);
  }

  let rows = Array.from(unique.values());
  const hideRecurrenceForPlayer = role !== 'administrator' && role !== 'redaktion';
  if (hideRecurrenceForPlayer) {
    const kept: typeof rows = [];
    for (const row of rows) {
      if (await hasPendingRewardRedemption(userId, row.id)) continue;
      if (row.recurrence === 'once') {
        if (await hasUsedRewardRedemption(userId, row.id)) continue;
      } else if (recurrenceToCooldownDays(row.recurrence)) {
        if (await isUserInRecurrenceCooldown(userId, row.id, row.recurrence)) continue;
      }
      kept.push(row);
    }
    rows = kept;
  }

  const lang = user?.preferred_language === 'en' ? 'en' : 'de';
  return rows.map((row) => {
    const title = resolveI18n(row.title_i18n, lang, row.title);
    const description = resolveI18n(row.description_i18n, lang, row.description);
    return {
      id: row.id,
      title,
      description,
      pointsCost: row.points_cost,
      rewardType: row.reward_type,
      icon: getRewardIcon(row.reward_type),
      thumbnail_url: row.thumbnail_url ?? null,
      location: row.location as Location,
    };
  });
}

function getRewardIcon(type: string): string {
  const icons: Record<string, string> = {
    discount: '💰',
    voucher: '🎫',
    benefit: '🎁',
    team_event: '🎉',
    vacation_day: '🏖️',
  };
  return icons[type] || '🎁';
}


interface CreateCustomRewardInput {
  title?: string;
  description?: string | null;
  title_i18n?: Record<string, string>;
  description_i18n?: Record<string, string>;
  pointsCost?: number | string;
  rewardType?: string;
  voucherCode?: string | null;
  externalApiId?: string | null;
  location_id: string;
  active?: boolean;
  recurrence?: string | null;
  reward_art?: string;
  kategorie?: string;
  thumbnail_url?: string | null;
  allowed_teams?: string[] | null;
  allowed_contests?: string[] | null;
}

interface UpdateRewardInput {
  title?: string | null;
  description?: string | null;
  title_i18n?: Record<string, string> | null;
  description_i18n?: Record<string, string> | null;
  pointsCost?: number | string | null;
  rewardType?: string | null;
  voucherCode?: string | null;
  externalApiId?: string | null;
  location_id?: string | null;
  active?: boolean;
  recurrence?: string | null;
  reward_art?: string | null;
  kategorie?: string | null;
  thumbnail_url?: string | null;
  allowed_teams?: string[] | null;
  allowed_contests?: string[] | null;
}

function normalizeRewardKategorie(
  value: string | null | undefined
): 'Hotel' | 'nicht Hotel' | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (normalized === 'hotel') return 'Hotel';
  if (
    normalized === 'nicht hotel' ||
    normalized === 'nicht_hotel' ||
    normalized === 'online' ||
    normalized === 'external' ||
    normalized === 'extern' ||
    normalized === 'test'
  ) {
    return 'nicht Hotel';
  }
  return null;
}

export async function createCustomReward(data: CreateCustomRewardInput) {
  const db = getPool();
  const titleI18n = data.title_i18n && typeof data.title_i18n === 'object'
    ? data.title_i18n
    : { de: data.title ?? '', en: data.title ?? '' };
  const descriptionI18n = data.description_i18n && typeof data.description_i18n === 'object'
    ? data.description_i18n
    : { de: data.description ?? '', en: data.description ?? '' };
  const legacyTitle = data.title?.trim() ?? titleI18n.de ?? titleI18n.en ?? '';
  if (!legacyTitle) {
    throw new Error('Title is required.');
  }
  const rewardType = validateRewardType(data.rewardType);
  const pointsCost = normalizePointsCost(data.pointsCost);
  const recurrence = validateRecurrence(data.recurrence);
  const normalizedKategorie = normalizeRewardKategorie(data.kategorie);

  const result = await db.query(
    `INSERT INTO rewards (
       title,
       description,
       title_i18n,
       description_i18n,
       points_cost,
       reward_type,
       voucher_code,
       external_api_id,
       location_id,
       active,
       recurrence,
       reward_art,
       kategorie,
       thumbnail_url,
       allowed_teams,
       allowed_contests
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      legacyTitle,
      data.description ?? null,
      JSON.stringify(titleI18n),
      JSON.stringify(descriptionI18n),
      pointsCost,
      rewardType,
      data.voucherCode ?? null,
      data.externalApiId ?? null,
      data.location_id,
      data.active ?? true,
      recurrence,
      data.reward_art ?? null,
      normalizedKategorie,
      data.thumbnail_url ?? null,
      data.allowed_teams ?? null,
      data.allowed_contests ?? null,
    ]
  );

  return result.rows[0];
}

export async function updateReward(id: string, data: UpdateRewardInput) {
  const db = getPool();
  
  // Get existing reward
  const existingReward = await getRewardById(id);
  if (!existingReward) {
    throw new Error('Reward not found');
  }
  
  const rewardType = data.rewardType !== undefined ? validateRewardType(data.rewardType ?? undefined) : existingReward.reward_type;
  const typeChanged = data.rewardType !== undefined && data.rewardType !== existingReward.reward_type;
  
  // Validate type-specific fields for the new type (if type is being changed)
  // Note: For rewards, most fields are optional, but we can validate if needed
  // For example, voucher_code might be required for voucher type, but it's optional for now
  
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title_i18n !== undefined && data.title_i18n !== null && typeof data.title_i18n === 'object') {
    updates.push(`title_i18n = $${paramIndex++}`);
    values.push(JSON.stringify(data.title_i18n));
    const resolved = data.title_i18n.de ?? data.title_i18n.en;
    if (resolved != null) {
      updates.push(`title = $${paramIndex++}`);
      values.push(resolved);
    }
  } else if (data.title !== undefined) {
    const trimmed = data.title === null ? null : data.title?.toString().trim() ?? null;
    if (trimmed === '') {
      throw new Error('Title cannot be empty.');
    }
    updates.push(`title = $${paramIndex++}`);
    values.push(trimmed);
  }

  if (data.description_i18n !== undefined && data.description_i18n !== null && typeof data.description_i18n === 'object') {
    updates.push(`description_i18n = $${paramIndex++}`);
    values.push(JSON.stringify(data.description_i18n));
    const resolved = data.description_i18n.de ?? data.description_i18n.en;
    if (resolved != null) {
      updates.push(`description = $${paramIndex++}`);
      values.push(resolved);
    }
  } else if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description ?? null);
  }

  if (data.pointsCost !== undefined) {
    updates.push(`points_cost = $${paramIndex++}`);
    values.push(normalizePointsCost(data.pointsCost));
  }

  // If type is being changed, reset type-specific fields of the old type
  if (typeChanged) {
    const oldType = existingReward.reward_type;
    const newType = rewardType;

    // Reset fields that are specific to the old type but not to the new type
    // For voucher type, voucher_code might be relevant, but it's optional
    // For external_api_id, it's typically used with voucher type but can be used with others
    // We'll reset these fields if they're not explicitly provided in the update
    if (oldType === 'voucher' && newType !== 'voucher') {
      // Reset voucher-specific fields if not provided in update
      if (data.voucherCode === undefined) {
        updates.push(`voucher_code = $${paramIndex++}`);
        values.push(null);
      }
      // external_api_id might still be relevant for other types, so we don't reset it automatically
    }
  }

  if (data.rewardType !== undefined) {
    updates.push(`reward_type = $${paramIndex++}`);
    values.push(rewardType);
  }

  if (data.voucherCode !== undefined) {
    updates.push(`voucher_code = $${paramIndex++}`);
    values.push(data.voucherCode ?? null);
  }

  if (data.externalApiId !== undefined) {
    updates.push(`external_api_id = $${paramIndex++}`);
    values.push(data.externalApiId ?? null);
  }

  if (data.location_id !== undefined) {
    updates.push(`location_id = $${paramIndex++}`);
    values.push(data.location_id);
  }

  if (data.active !== undefined) {
    updates.push(`active = $${paramIndex++}`);
    values.push(data.active);
  }

  if (data.recurrence !== undefined) {
    updates.push(`recurrence = $${paramIndex++}`);
    values.push(validateRecurrence(data.recurrence));
  }

  if (data.reward_art !== undefined) {
    updates.push(`reward_art = $${paramIndex++}`);
    values.push(data.reward_art ?? null);
  }

  if (data.kategorie !== undefined) {
    updates.push(`kategorie = $${paramIndex++}`);
    values.push(normalizeRewardKategorie(data.kategorie ?? null));
  }



  if (data.thumbnail_url !== undefined) {
    updates.push(`thumbnail_url = $${paramIndex++}`);
    values.push(data.thumbnail_url ?? null);
  }

  if (data.allowed_teams !== undefined) {
    updates.push(`allowed_teams = $${paramIndex++}`);
    values.push(data.allowed_teams ?? null);
  }

  if (data.allowed_contests !== undefined) {
    updates.push(`allowed_contests = $${paramIndex++}`);
    values.push(data.allowed_contests ?? null);
  }

  if (updates.length === 0) {
    const reward = await getRewardById(id);
    if (!reward) {
      throw new Error('Reward not found');
    }
    return reward;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await db.query(
    `UPDATE rewards SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Reward not found');
  }

  return result.rows[0];
}

export async function setRewardsActiveState(ids: string[], active: boolean) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }
  const db = getPool();
  await db.query(
    'UPDATE rewards SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::uuid[])',
    [active, ids]
  );
}

export async function bulkDeleteRewards(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }
  const db = getPool();
  await db.query('DELETE FROM rewards WHERE id = ANY($1::uuid[])', [ids]);
}

export async function getRewardById(id: string) {
  const db = getPool();
  const result = await db.query('SELECT * FROM rewards WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function listRewardsForAdmin(includeInactive = false) {
  const db = getPool();
  const clauses: string[] = [];
  const params: any[] = [];

  if (!includeInactive) {
    clauses.push('r.active = TRUE');
  }

  // Use explicit column list to avoid selecting non-existent columns
  let query = `SELECT 
    r.id, r.title, r.description, r.title_i18n, r.description_i18n,
    r.points_cost, r.reward_type, r.voucher_code, r.external_api_id, 
    r.active, r.reward_art, r.kategorie, 
    r.recurrence, r.last_generated_at, r.zielgruppe, r.location_id, r.thumbnail_url, 
    r.created_at, r.updated_at, 
    row_to_json(l.*) AS location
    FROM rewards r
    JOIN locations l ON l.id = r.location_id`;

  if (clauses.length > 0) {
    query += ` WHERE ${clauses.join(' AND ')}`;
  }

  query += ' ORDER BY r.created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
}

export async function redeemRewardService(rewardId: string, userId: string, useTeamPoints: boolean = false) {
  const db = getPool();

  // Get user and reward
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const rewardResult = await db.query('SELECT * FROM rewards WHERE id = $1', [rewardId]);
  const reward = rewardResult.rows[0];

  if (!reward) {
    throw new Error('Reward not found');
  }
  if (!reward.active) {
    throw new Error('Reward not found');
  }
  const generatedFrom = (reward as { generated_from_reward_id?: string | null }).generated_from_reward_id;
  if (generatedFrom != null && String(generatedFrom).length > 0) {
    throw new Error('Belohnung ist nicht mehr gültig. Bitte die aktuelle Belohnung in der Liste wählen.');
  }

  if (await hasPendingRewardRedemption(userId, rewardId)) {
    throw new Error(
      'Es läuft bereits eine Einlösung für diese Belohnung. Bitte zuerst an der Rezeption abschließen.'
    );
  }
  if (reward.recurrence === 'once') {
    if (await hasUsedRewardRedemption(userId, rewardId)) {
      throw new Error('Diese Belohnung kann nur einmal eingelöst werden.');
    }
  } else if (recurrenceToCooldownDays(reward.recurrence)) {
    if (await isUserInRecurrenceCooldown(userId, rewardId, reward.recurrence)) {
      throw new Error(
        'Diese Belohnung steht für dich erst nach Ablauf der Wiederholungszeit wieder zur Verfügung.'
      );
    }
  }

  // Check if user is in a team
  const userTeam = await getUserActiveTeam(userId);
  const teamTotalPoints = userTeam ? await getTeamTotalPoints(userTeam.id) : 0;
  
  // Determine if we should use team points
  const shouldUseTeamPoints = useTeamPoints && userTeam !== null;
  
  // Check if user has enough points (either personal or team total)
  if (shouldUseTeamPoints) {
    if (teamTotalPoints < reward.points_cost) {
      throw new Error('Insufficient team points');
    }
    // Check if user exceeds their personal points (warning case)
    if (user.points < reward.points_cost) {
      // This is allowed but should trigger a warning in the frontend
      // We'll return a flag indicating this
    }
  } else {
    if (user.points < reward.points_cost) {
      throw new Error('Insufficient points');
    }
  }

  // Generate unique QR token
  const crypto = await import('node:crypto');
  const qrToken = crypto.randomBytes(32).toString('hex');

  // Generate voucher code from external system if needed
  let voucherCode = reward.voucher_code;
  if (reward.external_api_id && !voucherCode) {
    try {
      voucherCode = await voucherSystem.generateVoucher(
        reward.reward_type,
        reward.points_cost
      );
    } catch (error) {
      console.error('Failed to generate external voucher:', error);
      // Continue with redemption even if external voucher generation fails
    }
  }

  // Check if user exceeds personal points (warning case)
  const exceedsPersonalPoints = shouldUseTeamPoints && user.points < reward.points_cost;
  
  // Create redemption record with QR token (points NOT deducted yet - will be deducted on verification)
  // Store whether team points should be used in a JSON metadata field
  const metadata = shouldUseTeamPoints && userTeam ? { useTeamPoints: true, teamId: userTeam.id } : null;
  const redemptionResult = await db.query(
    `INSERT INTO reward_redemptions (user_id, reward_id, voucher_code, status, qr_token, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [userId, rewardId, voucherCode || null, 'pending', qrToken, metadata]
  );

  return {
    success: true,
    redemption: {
      id: redemptionResult.rows[0].id,
      qrToken: qrToken,
      voucherCode: voucherCode || redemptionResult.rows[0].voucher_code,
      status: redemptionResult.rows[0].status,
    },
    remainingPoints: user.points, // Points not deducted yet
    teamTotalPoints: shouldUseTeamPoints ? teamTotalPoints : undefined,
    exceedsPersonalPoints: exceedsPersonalPoints,
    message: 'QR code generated. Please show it to an administrator for verification.',
  };
}

/**
 * Get redemption status by QR token (for polling)
 */
export async function getRedemptionStatus(qrToken: string, userId: string) {
  const db = getPool();
  
  const result = await db.query(
    `SELECT rr.id, rr.status, rr.user_id, u.points as user_points
     FROM reward_redemptions rr
     JOIN users u ON u.id = rr.user_id
     WHERE rr.qr_token = $1 AND rr.user_id = $2`,
    [qrToken, userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    id: result.rows[0].id,
    status: result.rows[0].status,
    points: parseInt(result.rows[0].user_points || '0', 10),
  };
}

/**
 * Get reward information from QR code without redeeming it
 * Used by front office to preview the reward before redeeming
 */
export async function getRewardInfoFromQrCode(qrToken: string, employeeUserId: string) {
  const db = getPool();

  // Verify rezeption user
  const employee = await getUserById(employeeUserId);
  if (!employee || (employee.role !== 'administrator' && employee.role !== 'rezeption')) {
    throw new Error('Unauthorized: Only administrators and rezeption can view QR code information');
  }

  // Find redemption by QR token
  const redemptionResult = await db.query(
    `SELECT rr.*, r.points_cost, r.title as reward_title, r.description as reward_description, 
            u.points as user_points, u.id as user_id, u.name as user_name, u.email as user_email
     FROM reward_redemptions rr
     JOIN rewards r ON rr.reward_id = r.id
     JOIN users u ON rr.user_id = u.id
     WHERE rr.qr_token = $1 AND rr.status = 'pending'`,
    [qrToken]
  );

  if (redemptionResult.rows.length === 0) {
    throw new Error('QR code not found or already used');
  }

  const redemption = redemptionResult.rows[0];

  // Check if user still has enough points (in case they spent them elsewhere)
  if (redemption.user_points < redemption.points_cost) {
    throw new Error('User no longer has sufficient points for this redemption');
  }

  return {
    success: true,
    redemption: {
      id: redemption.id,
      rewardId: redemption.reward_id,
      rewardTitle: redemption.reward_title,
      rewardDescription: redemption.reward_description,
      userId: redemption.user_id,
      userName: redemption.user_name,
      userEmail: redemption.user_email,
      pointsCost: redemption.points_cost,
      status: redemption.status,
    },
    message: 'QR code information retrieved successfully',
  };
}

export async function verifyQrCodeService(qrToken: string, adminUserId: string) {
  const db = getPool();

  // Verify admin or rezeption user
  const admin = await getUserById(adminUserId);
  if (!admin || (admin.role !== 'administrator' && admin.role !== 'rezeption')) {
    throw new Error('Unauthorized: Only administrators and rezeption can verify QR codes');
  }

  // Find redemption by QR token
  const redemptionResult = await db.query(
    `SELECT rr.*, r.points_cost, r.title as reward_title, u.points as user_points, u.id as user_id, u.name as user_name
     FROM reward_redemptions rr
     JOIN rewards r ON rr.reward_id = r.id
     JOIN users u ON rr.user_id = u.id
     WHERE rr.qr_token = $1 AND rr.status = 'pending'`,
    [qrToken]
  );

  if (redemptionResult.rows.length === 0) {
    throw new Error('QR code not found or already used');
  }

  const redemption = redemptionResult.rows[0];

  // Check if user still has enough points (in case they spent them elsewhere)
  if (redemption.user_points < redemption.points_cost) {
    // Mark as expired if user doesn't have enough points
    await db.query(
      `UPDATE reward_redemptions SET status = 'expired' WHERE id = $1`,
      [redemption.id]
    );
    throw new Error('User no longer has sufficient points for this redemption');
  }

  // Deduct points cost (moegliche_punkte column was removed in migration 039)
  const pointsToAdd = 0;
  await db.query(
    'UPDATE users SET points = points - $1 + $2 WHERE id = $3',
    [redemption.points_cost, pointsToAdd, redemption.user_id]
  );

  // Update redemption status to 'used' (verified_at = tatsächliche Einlösung an der Rezeption)
  await db.query(
    `UPDATE reward_redemptions SET status = 'used', verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [redemption.id]
  );

  // Get updated user points
  const updatedUserResult = await db.query(
    'SELECT points FROM users WHERE id = $1',
    [redemption.user_id]
  );

  const updatedPoints = updatedUserResult.rows[0]?.points || 0;

  // Broadcast update to user via WebSocket
  broadcastRedemptionUpdate({
    userId: redemption.user_id,
    redemptionId: redemption.id,
    status: 'used',
    points: updatedPoints,
  });

  return {
    success: true,
    redemption: {
      id: redemption.id,
      status: 'used',
    },
    user: {
      id: redemption.user_id,
      name: redemption.user_name,
      points: updatedPoints,
    },
    reward: {
      title: redemption.reward_title,
    },
    message: 'QR code verified and reward redeemed successfully',
  };
}

/**
 * Redeem a reward QR code for a guest (front office action)
 * This marks the redemption as 'used' and deducts points from the guest
 */
export async function redeemRewardQrCodeService(qrToken: string, employeeUserId: string) {
  const db = getPool();

  // Verify rezeption user
  const employee = await getUserById(employeeUserId);
  if (!employee || employee.role !== 'rezeption') {
    throw new Error('Unauthorized: Only rezeption can redeem reward QR codes');
  }

  // Find redemption by QR token
  const redemptionResult = await db.query(
    `SELECT rr.*, r.points_cost, r.title as reward_title, r.description as reward_description, 
            u.points as user_points, u.id as user_id, u.name as user_name, u.email as user_email
     FROM reward_redemptions rr
     JOIN rewards r ON rr.reward_id = r.id
     JOIN users u ON rr.user_id = u.id
     WHERE rr.qr_token = $1 AND rr.status = 'pending'`,
    [qrToken]
  );

  if (redemptionResult.rows.length === 0) {
    throw new Error('QR code not found or already used');
  }

  const redemption = redemptionResult.rows[0];
  
  // Parse metadata to check if team points should be used
  let useTeamPoints = false;
  let teamId: string | null = null;
  if (redemption.metadata) {
    try {
      const metadata = typeof redemption.metadata === 'string' ? JSON.parse(redemption.metadata) : redemption.metadata;
      useTeamPoints = metadata?.useTeamPoints === true;
      teamId = metadata?.teamId || null;
    } catch (e) {
      // If metadata parsing fails, assume no team points
      console.warn('Failed to parse redemption metadata:', e);
    }
  }

  // Check if user still has enough points (either personal or team total)
  if (useTeamPoints && teamId) {
    const teamTotalPoints = await getTeamTotalPoints(teamId);
    if (teamTotalPoints < redemption.points_cost) {
      // Mark as expired if team doesn't have enough points
      await db.query(
        `UPDATE reward_redemptions SET status = 'expired' WHERE id = $1`,
        [redemption.id]
      );
      throw new Error('Team no longer has sufficient points for this redemption');
    }
  } else {
    if (redemption.user_points < redemption.points_cost) {
      // Mark as expired if user doesn't have enough points
      await db.query(
        `UPDATE reward_redemptions SET status = 'expired' WHERE id = $1`,
        [redemption.id]
      );
      throw new Error('User no longer has sufficient points for this redemption');
    }
  }

  // Deduct points cost (moegliche_punkte column was removed in migration 039)
  const pointsToAdd = 0;
  
  if (useTeamPoints && teamId) {
    // Deduct points from team members (user's points first, then distribute remainder)
    await deductTeamPoints(teamId, redemption.user_id, redemption.points_cost);
    
    // Add possible points to the user
    if (pointsToAdd > 0) {
      await db.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [pointsToAdd, redemption.user_id]
      );
    }
  } else {
    // Deduct points from user only
    await db.query(
      'UPDATE users SET points = points - $1 + $2 WHERE id = $3',
      [redemption.points_cost, pointsToAdd, redemption.user_id]
    );
  }

  // Update redemption status to 'used'
  await db.query(
    `UPDATE reward_redemptions SET status = 'used', verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [redemption.id]
  );

  // Get updated user points
  const updatedUserResult = await db.query('SELECT points FROM users WHERE id = $1', [redemption.user_id]);
  const updatedPoints = updatedUserResult.rows[0]?.points || 0;

  // Broadcast update to user via WebSocket
  broadcastRedemptionUpdate({
    userId: redemption.user_id,
    redemptionId: redemption.id,
    status: 'used',
    points: updatedPoints,
  });

  return {
    success: true,
    redemption: {
      id: redemption.id,
      rewardId: redemption.reward_id,
      rewardTitle: redemption.reward_title,
      rewardDescription: redemption.reward_description,
      userId: redemption.user_id,
      userName: redemption.user_name,
      userEmail: redemption.user_email,
      pointsCost: redemption.points_cost,
      status: 'used',
    },
    guestPoints: updatedPoints,
    message: 'Reward redeemed successfully',
  };
}

export async function uploadThumbnail(file: Express.Multer.File): Promise<string> {
  // BASE_URL should be set in production (e.g., https://luise.bio)
  // localhost is only used as fallback for local development with virtual hosts
  const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5001';
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/uploads/${file.filename}`;
}

export async function getUserRedemptions(userId: string) {
  const db = getPool();
  const result = await db.query(
    `SELECT 
       rr.*,
       r.title as reward_title,
       r.reward_type,
       r.description
     FROM reward_redemptions rr
     JOIN rewards r ON rr.reward_id = r.id
     WHERE rr.user_id = $1
     ORDER BY rr.redeemed_at DESC`,
    [userId]
  );
  return result.rows;
}