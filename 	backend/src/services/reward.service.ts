import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
import { voucherSystem } from '../integrations/voucher.js';
import {
  USER_ROLES,
  USER_TYPES,
  HOTEL_IDS,
  REWARD_TYPES,
  UserRole,
  UserType,
  HotelId,
  RewardType,
} from '../constants/enums.js';

function validateRoleArray(values?: string[] | null): UserRole[] {
  if (!values) return [];
  const invalid = values.filter((value) => !(USER_ROLES as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid roles: ${invalid.join(', ')}`);
  }
  return values as UserRole[];
}

function validateUserTypeArray(values?: string[] | null): UserType[] {
  if (!values) return [];
  const invalid = values.filter((value) => !(USER_TYPES as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid user types: ${invalid.join(', ')}`);
  }
  return values as UserType[];
}

function validateHotelIdArray(values?: string[] | null): HotelId[] {
  if (!values) return [];
  const invalid = values.filter((value) => !(HOTEL_IDS as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid hotel IDs: ${invalid.join(', ')}`);
  }
  return values as HotelId[];
}

function validateRewardType(value?: string | null): RewardType {
  if (!value) {
    throw new Error('Reward type is required.');
  }
  if (!(REWARD_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Invalid reward type: ${value}`);
  }
  return value as RewardType;
}

function normalizePointsCost(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    throw new Error('pointsCost must be zero or greater.');
  }
  const parsed =
    typeof value === 'string' ? Number.parseFloat(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('pointsCost must be zero or greater.');
  }
  return parsed;
}

export async function getRewardsService(userId: string) {
  const db = getPool();
  const user = await getUserById(userId);
  const role: UserRole | null = user?.role ?? null;
  const userType: UserType | null = user?.user_type ?? null;
  const configuredHotelId = process.env.HOTEL_ID;
  const hotelId: HotelId | null =
    configuredHotelId && (HOTEL_IDS as readonly string[]).includes(configuredHotelId)
      ? (configuredHotelId as HotelId)
      : null;

  const params: any[] = [];
  let paramIndex = 1;

  let query = 'SELECT * FROM rewards WHERE active = TRUE';

  if (role) {
    query += ` AND (allowed_roles IS NULL OR COALESCE(array_length(allowed_roles, 1), 0) = 0 OR $${paramIndex++} = ANY(allowed_roles))`;
    params.push(role);
  } else {
    query += ' AND (allowed_roles IS NULL OR COALESCE(array_length(allowed_roles, 1), 0) = 0)';
  }

  if (userType) {
    query += ` AND (allowed_user_types IS NULL OR COALESCE(array_length(allowed_user_types, 1), 0) = 0 OR $${paramIndex++} = ANY(allowed_user_types))`;
    params.push(userType);
  } else {
    query += ' AND (allowed_user_types IS NULL OR COALESCE(array_length(allowed_user_types, 1), 0) = 0)';
  }

  if (hotelId) {
    query += ` AND (allowed_hotel_ids IS NULL OR COALESCE(array_length(allowed_hotel_ids, 1), 0) = 0 OR $${paramIndex++} = ANY(allowed_hotel_ids))`;
    params.push(hotelId);
  } else {
    query += ' AND (allowed_hotel_ids IS NULL OR COALESCE(array_length(allowed_hotel_ids, 1), 0) = 0)';
  }

  query += ' ORDER BY points_cost ASC';

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
  active?: boolean;
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
  active?: boolean;
}

export async function createCustomReward(data: CreateCustomRewardInput) {
  const db = getPool();
  const title = data.title?.trim();
  if (!title) {
    throw new Error('Title is required.');
  }
  const rewardType = validateRewardType(data.rewardType);
  const pointsCost = normalizePointsCost(data.pointsCost);

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
       active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      data.active ?? true,
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

  if (data.active !== undefined) {
    updates.push(`active = $${paramIndex++}`);
    values.push(data.active);
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
  await setRewardsActiveState(ids, false);
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
    clauses.push('active = TRUE');
  }

  let query = `SELECT id,
                      title,
                      description,
                      points_cost,
                      reward_type,
                      voucher_code,
                      external_api_id,
                      allowed_roles,
                      allowed_user_types,
                      allowed_hotel_ids,
                      created_at,
                      active
               FROM rewards`;

  if (clauses.length > 0) {
    query += ` WHERE ${clauses.join(' AND ')}`;
  }

  query += ' ORDER BY created_at DESC';

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

  // Deduct points
  await db.query(
    'UPDATE users SET points = points - $1 WHERE id = $2',
    [reward.points_cost, userId]
  );

  // Create redemption record
  const redemptionResult = await db.query(
    `INSERT INTO reward_redemptions (user_id, reward_id, voucher_code, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, rewardId, voucherCode || null, 'pending']
  );

  // If external voucher system is used, validate the code
  if (reward.external_api_id && voucherCode) {
    try {
      const isValid = await voucherSystem.validateVoucher(voucherCode);
      if (isValid) {
        await db.query(
          'UPDATE reward_redemptions SET status = $1 WHERE id = $2',
          ['active', redemptionResult.rows[0].id]
        );
      }
    } catch (error) {
      console.error('Failed to validate voucher:', error);
    }
  }

  return {
    success: true,
    redemption: {
      id: redemptionResult.rows[0].id,
      voucherCode: voucherCode || redemptionResult.rows[0].voucher_code,
      status: redemptionResult.rows[0].status,
    },
    remainingPoints: user.points - reward.points_cost,
    message: voucherCode
      ? `Reward redeemed! Your voucher code is: ${voucherCode}`
      : 'Reward redeemed successfully!',
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