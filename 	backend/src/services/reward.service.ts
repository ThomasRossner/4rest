import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
import { voucherSystem } from '../integrations/voucher.js';
import { broadcastRedemptionUpdate } from '../ws/reward-broadcast.js';
import { UserRole, UserType } from '../constants/enums.js';
import { Location } from './location.service.js';
import {
  validateRoleArray,
  validateUserTypeArray,
  validateHotelIdArray,
  validateRewardType,
  validateRecurrence,
  normalizePointsCost,
} from '../utils/validation.js';
import { buildAudienceFilterClauses, getConfiguredHotelId } from '../utils/queryBuilder.js';

export async function getRewardsService(userId: string) {
  const db = getPool();
  const user = await getUserById(userId);
  const role: UserRole | null = user?.role ?? null;
  const userType: UserType | null = user?.user_type ?? null;
  const hotelId = getConfiguredHotelId();

  const params: any[] = [];
  const paramIndex = { current: 1 };

  let query =
    'SELECT r.*, row_to_json(l.*) AS location FROM rewards r JOIN locations l ON l.id = r.location_id WHERE r.active = TRUE';

  const audienceClauses = buildAudienceFilterClauses(
    { userRole: role, userType, hotelId, applyFilters: true },
    params,
    paramIndex
  );
  // Prefix table alias for reward-specific queries
  if (audienceClauses.length > 0) {
    query += ' AND ' + audienceClauses.map((clause) => clause.replace(/\b(allowed_\w+)\b/g, 'r.$1')).join(' AND ');
  }

  query += ' ORDER BY r.points_cost ASC';

  const result = await db.query(query, params);
  const unique = new Map<string, any>();
  for (const row of result.rows) {
    unique.set(row.id, row);
  }

  return Array.from(unique.values()).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    pointsCost: row.points_cost,
    rewardType: row.reward_type,
    icon: getRewardIcon(row.reward_type),
    location: row.location as Location,
  }));
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
  pointsCost?: number | string;
  rewardType?: string;
  voucherCode?: string | null;
  externalApiId?: string | null;
  allowed_roles?: string[];
  allowed_user_types?: string[];
  allowed_hotel_ids?: string[];
  location_id: string;
  active?: boolean;
  recurrence?: string | null;
}

interface UpdateRewardInput {
  title?: string | null;
  description?: string | null;
  pointsCost?: number | string | null;
  rewardType?: string | null;
  voucherCode?: string | null;
  externalApiId?: string | null;
  allowed_roles?: string[] | null;
  allowed_user_types?: string[] | null;
  allowed_hotel_ids?: string[] | null;
  location_id?: string | null;
  active?: boolean;
  recurrence?: string | null;
}

export async function createCustomReward(data: CreateCustomRewardInput) {
  const db = getPool();
  const title = data.title?.trim();
  if (!title) {
    throw new Error('Title is required.');
  }
  const rewardType = validateRewardType(data.rewardType);
  const pointsCost = normalizePointsCost(data.pointsCost);

  const recurrence = validateRecurrence(data.recurrence);

  const result = await db.query(
    `INSERT INTO rewards (
       title,
       description,
       points_cost,
       reward_type,
       voucher_code,
       external_api_id,
       allowed_roles,
       allowed_user_types,
       allowed_hotel_ids,
       location_id,
       active,
       recurrence
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      title,
      data.description ?? null,
      pointsCost,
      rewardType,
      data.voucherCode ?? null,
      data.externalApiId ?? null,
      validateRoleArray(data.allowed_roles ?? []),
      validateUserTypeArray(data.allowed_user_types ?? []),
      validateHotelIdArray(data.allowed_hotel_ids ?? []),
      data.location_id,
      data.active ?? true,
      recurrence,
    ]
  );

  return result.rows[0];
}

export async function updateReward(id: string, data: UpdateRewardInput) {
  const db = getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    const trimmed = data.title === null ? null : data.title?.toString().trim() ?? null;
    if (trimmed === '') {
      throw new Error('Title cannot be empty.');
    }
    updates.push(`title = $${paramIndex++}`);
    values.push(trimmed);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description ?? null);
  }

  if (data.pointsCost !== undefined) {
    updates.push(`points_cost = $${paramIndex++}`);
    values.push(normalizePointsCost(data.pointsCost));
  }

  if (data.rewardType !== undefined) {
    updates.push(`reward_type = $${paramIndex++}`);
    values.push(validateRewardType(data.rewardType ?? undefined));
  }

  if (data.voucherCode !== undefined) {
    updates.push(`voucher_code = $${paramIndex++}`);
    values.push(data.voucherCode ?? null);
  }

  if (data.externalApiId !== undefined) {
    updates.push(`external_api_id = $${paramIndex++}`);
    values.push(data.externalApiId ?? null);
  }

  if (data.allowed_roles !== undefined) {
    updates.push(`allowed_roles = $${paramIndex++}`);
    values.push(validateRoleArray(data.allowed_roles ?? []));
  }

  if (data.allowed_user_types !== undefined) {
    updates.push(`allowed_user_types = $${paramIndex++}`);
    values.push(validateUserTypeArray(data.allowed_user_types ?? []));
  }

  if (data.allowed_hotel_ids !== undefined) {
    updates.push(`allowed_hotel_ids = $${paramIndex++}`);
    values.push(validateHotelIdArray(data.allowed_hotel_ids ?? []));
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

  let query = `SELECT r.*, row_to_json(l.*) AS location
               FROM rewards r
               JOIN locations l ON l.id = r.location_id`;

  if (clauses.length > 0) {
    query += ` WHERE ${clauses.join(' AND ')}`;
  }

  query += ' ORDER BY r.created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
}

export async function redeemRewardService(rewardId: string, userId: string) {
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

  if (user.points < reward.points_cost) {
    throw new Error('Insufficient points');
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

  // Create redemption record with QR token (points NOT deducted yet - will be deducted on verification)
  const redemptionResult = await db.query(
    `INSERT INTO reward_redemptions (user_id, reward_id, voucher_code, status, qr_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, rewardId, voucherCode || null, 'pending', qrToken]
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
    message: 'QR code generated. Please show it to an administrator for verification.',
  };
}

export async function verifyQrCodeService(qrToken: string, adminUserId: string) {
  const db = getPool();

  // Verify admin user
  const admin = await getUserById(adminUserId);
  if (!admin || admin.role !== 'administrator') {
    throw new Error('Unauthorized: Only administrators can verify QR codes');
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

  // Deduct points now that QR code is verified
  await db.query(
    'UPDATE users SET points = points - $1 WHERE id = $2',
    [redemption.points_cost, redemption.user_id]
  );

  // Update redemption status to 'used'
  await db.query(
    `UPDATE reward_redemptions SET status = 'used' WHERE id = $1`,
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