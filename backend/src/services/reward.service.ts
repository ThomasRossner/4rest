import { getPool } from '../database/connection.js';
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

export async function getRewardsService(userId: string) {
  const db = getPool();
  const user = await getUserById(userId);
  const role: string | null = user?.role ?? null;
  const userType: UserType | null = user?.user_type ?? null;

  const params: any[] = [];
  let paramIndex = { current: 1 };

  let query =
    'SELECT r.*, row_to_json(l.*) AS location FROM rewards r JOIN locations l ON l.id = r.location_id WHERE r.active = TRUE';

  let userTeamIds: string[] = [];
  let userContestIds: string[] = [];
  let applyFilters = true;

  if (role === 'administrator') {
    // Administrators see all rewards
    applyFilters = false;
  } else {
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
  }

  // Filter by team/contest assignments
  if (applyFilters) {
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
    const rewardClauses = filterClauses.map(clause => 
      clause.replace(/allowed_teams/g, 'r.allowed_teams')
            .replace(/allowed_contests/g, 'r.allowed_contests')
            .replace(/allowed_user_types/g, 'r.allowed_user_types')
            .replace(/allowed_hotel_ids/g, 'r.allowed_hotel_ids')
    );
    
    if (rewardClauses.length > 0) {
      query += ` AND ${rewardClauses.join(' AND ')}`;
    }
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
    thumbnail_url: row.thumbnail_url ?? null,
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
  zielgruppe?: ('Front Office' | 'Gäste')[] | null;
  location_id: string;
  active?: boolean;
  recurrence?: string | null;
  reward_art?: string;
  kategorie?: string;
  event_group?: string | null;
  moegliche_punkte?: number | null;
  thumbnail_url?: string | null;
}

interface UpdateRewardInput {
  title?: string | null;
  description?: string | null;
  pointsCost?: number | string | null;
  rewardType?: string | null;
  voucherCode?: string | null;
  externalApiId?: string | null;
  zielgruppe?: ('Front Office' | 'Gäste')[] | null;
  location_id?: string | null;
  active?: boolean;
  recurrence?: string | null;
  reward_art?: string | null;
  kategorie?: string | null;
  event_group?: string | null;
  moegliche_punkte?: number | null;
  thumbnail_url?: string | null;
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

  // Handle zielgruppe array: allow null, empty array, or array of valid enum values
  let zielgruppeValue: string[] | null = null;
  if (data.zielgruppe !== null && data.zielgruppe !== undefined) {
    // Ensure it's an array
    const zielgruppeArray = Array.isArray(data.zielgruppe) ? data.zielgruppe : [data.zielgruppe];
    // Filter out empty strings and null values
    zielgruppeValue = zielgruppeArray.filter((v: any) => v !== null && v !== undefined && v !== '');
    // If resulting array is empty, set to null
    if (zielgruppeValue.length === 0) {
      zielgruppeValue = null;
    }
  }
  
  const result = await db.query(
    `INSERT INTO rewards (
       title,
       description,
       points_cost,
       reward_type,
       voucher_code,
       external_api_id,
       zielgruppe,
       location_id,
       active,
       recurrence,
       reward_art,
       kategorie,
       event_group,
       moegliche_punkte,
       thumbnail_url
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      title,
      data.description ?? null,
      pointsCost,
      rewardType,
      data.voucherCode ?? null,
      data.externalApiId ?? null,
      zielgruppeValue, // PostgreSQL will automatically convert JavaScript arrays to PostgreSQL arrays
      data.location_id,
      data.active ?? true,
      recurrence,
      data.reward_art ?? null,
      data.kategorie ?? null,
      data.event_group ?? null,
      data.moegliche_punkte ?? null,
      data.thumbnail_url ?? null,
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

  if (data.zielgruppe !== undefined) {
    // Handle zielgruppe array: allow null, empty array, or array of valid enum values
    let zielgruppeValue: string[] | null = null;
    if (data.zielgruppe !== null && data.zielgruppe !== undefined) {
      let zielgruppeArray: any[];
      // Check if value is a string (might be JSON stringified array or PostgreSQL array string)
      if (typeof data.zielgruppe === 'string') {
        // Try to parse as JSON first
        try {
          zielgruppeArray = JSON.parse(data.zielgruppe);
        } catch {
          // If not JSON, might be PostgreSQL array format like "{Gäste,Front Office}" or "{""Front Office""}"
          // Remove curly braces and split by comma
          let cleaned = (data.zielgruppe as string).replace(/^{|}$/g, '').trim();
          // Remove double quotes that might wrap values (e.g., ""Front Office"" -> Front Office)
          cleaned = cleaned.replace(/^"|"$/g, '');
          zielgruppeArray = cleaned ? cleaned.split(',').map((v: string) => {
            // Remove quotes from each value and trim
            return v.trim().replace(/^"|"$/g, '');
          }) : [];
        }
      } else if (Array.isArray(data.zielgruppe)) {
        zielgruppeArray = data.zielgruppe.map((v: any) => {
          // If array contains strings with quotes, remove them
          if (typeof v === 'string') {
            return v.replace(/^"|"$/g, '').trim();
          }
          return v;
        });
      } else {
        zielgruppeArray = [data.zielgruppe];
      }
      // Filter out empty strings and null values, and remove any remaining quotes
      zielgruppeValue = zielgruppeArray
        .map((v: any) => {
          if (typeof v === 'string') {
            return v.replace(/^"|"$/g, '').trim();
          }
          return v;
        })
        .filter((v: any) => v !== null && v !== undefined && v !== '');
      // If resulting array is empty, set to null
      if (zielgruppeValue.length === 0) {
        zielgruppeValue = null;
      }
    }
    updates.push(`zielgruppe = $${paramIndex++}`);
    values.push(zielgruppeValue);
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
    values.push(data.kategorie ?? null);
  }

  if (data.event_group !== undefined) {
    updates.push(`event_group = $${paramIndex++}`);
    values.push(data.event_group ?? null);
  }

  if (data.moegliche_punkte !== undefined) {
    updates.push(`moegliche_punkte = $${paramIndex++}`);
    values.push(data.moegliche_punkte ?? null);
  }

  if (data.thumbnail_url !== undefined) {
    updates.push(`thumbnail_url = $${paramIndex++}`);
    values.push(data.thumbnail_url ?? null);
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
    `SELECT rr.*, r.points_cost, r.moegliche_punkte, r.title as reward_title, r.description as reward_description, 
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
    `SELECT rr.*, r.points_cost, r.moegliche_punkte, r.title as reward_title, u.points as user_points, u.id as user_id, u.name as user_name
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

  // Deduct points cost and add possible points (moegliche_punkte) now that QR code is verified
  const pointsToAdd = redemption.moegliche_punkte || 0;
  await db.query(
    'UPDATE users SET points = points - $1 + $2 WHERE id = $3',
    [redemption.points_cost, pointsToAdd, redemption.user_id]
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
    `SELECT rr.*, r.points_cost, r.moegliche_punkte, r.title as reward_title, r.description as reward_description, 
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

  // Deduct points cost and add possible points (moegliche_punkte) now that QR code is redeemed
  const pointsToAdd = redemption.moegliche_punkte || 0;
  
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
    `UPDATE reward_redemptions SET status = 'used' WHERE id = $1`,
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