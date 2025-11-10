import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
import { voucherSystem } from '../integrations/voucher.js';
import { USER_ROLES, USER_TYPES, HOTEL_IDS, UserRole, UserType, HotelId } from '../constants/enums.js';

interface RewardTemplate {
  id: string;
  name: string;
  title: string;
  description?: string | null;
  points_cost: number;
  reward_type: string;
  voucher_code?: string | null;
  external_api_id?: string | null;
  allowed_roles?: UserRole[] | null;
  allowed_user_types?: UserType[] | null;
  allowed_hotel_ids?: HotelId[] | null;
}

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

export async function listRewardTemplates(): Promise<RewardTemplate[]> {
  const db = getPool();
  const result = await db.query('SELECT * FROM reward_templates ORDER BY name ASC');
  return result.rows;
}

async function getRewardTemplate(templateId: string): Promise<RewardTemplate | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM reward_templates WHERE id = $1', [templateId]);
  return result.rows[0] || null;
}

export async function createRewardFromTemplate(
  templateId: string,
  overrides: Partial<{
    title: string;
    description: string;
    pointsCost: number;
    rewardType: string;
    voucherCode?: string;
    externalApiId?: string;
    allowed_roles?: string[];
    allowed_user_types?: string[];
    allowed_hotel_ids?: string[];
  }> = {}
) {
  const template = await getRewardTemplate(templateId);
  if (!template) {
    throw new Error('Reward template not found');
  }

  const db = getPool();
  const payload = {
    title: overrides.title ?? template.title,
    description: overrides.description ?? template.description,
    points_cost: overrides.pointsCost ?? template.points_cost,
    reward_type: overrides.rewardType ?? template.reward_type,
    voucher_code: overrides.voucherCode ?? template.voucher_code ?? null,
    external_api_id: overrides.externalApiId ?? template.external_api_id ?? null,
    allowed_roles: validateRoleArray(overrides.allowed_roles ?? template.allowed_roles ?? []),
    allowed_user_types: validateUserTypeArray(
      overrides.allowed_user_types ?? template.allowed_user_types ?? []
    ),
    allowed_hotel_ids: validateHotelIdArray(
      overrides.allowed_hotel_ids ?? template.allowed_hotel_ids ?? []
    ),
  };

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
       allowed_hotel_ids
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      payload.title,
      payload.description,
      payload.points_cost,
      payload.reward_type,
      payload.voucher_code,
      payload.external_api_id,
      payload.allowed_roles,
      payload.allowed_user_types,
      payload.allowed_hotel_ids,
    ]
  );

  return result.rows[0];
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