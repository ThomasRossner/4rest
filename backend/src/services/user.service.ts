import { getPool } from '../database/connection.js';
import { USER_ROLES, USER_TYPES, UserRole, UserType } from '../constants/enums.js';
import bcrypt from 'bcryptjs';
import {
  aggregateDyadAnswers,
  computeDominantDyadFromScales,
  getOnboardingConfig,
} from './onboarding-config.service.js';

export interface User {
  id: string;
  email: string | null;
  password_hash: string | null;
  name: string;
  role: UserRole;
  points: number;
  user_type: UserType;
  avatar_url?: string | null;
  oauth_provider?: string | null;
  oauth_id?: string | null;
  oauth_email?: string | null;
  sihot_guest_id?: string | null;
  sihot_guest_data?: Record<string, any> | null;
  preferred_language?: string | null;
  email_verified?: boolean;
  email_verification_token?: string | null;
  email_verification_expires?: Date | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  email_notifications_enabled?: boolean;
  deleted_at?: Date | null;
  active?: boolean;
}

export interface CreateUserData {
  email?: string | null;
  password_hash?: string | null;
  name: string;
  role?: UserRole;
  user_type?: UserType;
  points?: number;
  avatar_url?: string | null;
  oauth_provider?: string | null;
  oauth_id?: string | null;
  oauth_email?: string | null;
  sihot_guest_id?: string | null;
  sihot_guest_data?: Record<string, any> | null;
  preferred_language?: string | null;
}

function ensureRole(value: unknown): UserRole {
  const rolesArray = Array.from(USER_ROLES) as string[];
  if (typeof value === 'string' && rolesArray.includes(value)) {
    return value as UserRole;
  }
  return 'guest';
}

function ensureUserType(value: unknown): UserType {
  if (typeof value === 'string' && (USER_TYPES as readonly string[]).includes(value)) {
    return value as UserType;
  }
  return 'explorer';
}

export async function createUser(data: CreateUserData): Promise<User> {
  const db = getPool();
  try {
    const resolvedRole = ensureRole(data.role);
    const resolvedUserType = ensureUserType(data.user_type);

    const preferredLang = data.preferred_language === 'en' ? 'en' : 'de';
    const values = [
      data.email || null,
      data.password_hash || null,
      data.name,
      resolvedRole,
      resolvedUserType,
      data.points ?? 0,
      data.avatar_url || null,
      data.oauth_provider || null,
      data.oauth_id || null,
      data.oauth_email || null,
      data.sihot_guest_id || null,
      data.sihot_guest_data ? JSON.stringify(data.sihot_guest_data) : null,
      preferredLang,
    ];

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, user_type, points, avatar_url, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($12)::jsonb, $13)
       RETURNING *`,
      values
    );
    
    if (!result.rows[0]) {
      throw new Error('User creation returned no rows');
    }
    
    console.log('User created successfully:', result.rows[0].id);
    return result.rows[0];
  } catch (error: any) {
    console.error('Error in createUser:', error);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error constraint:', error.constraint);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const db = getPool();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  } catch (error: any) {
    console.error('[getUserByEmail] Database error:', {
      message: error.message,
      code: error.code,
      email,
    });
    throw error;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getUserByOAuth(provider: string, oauthId: string): Promise<User | null> {
  const db = getPool();
  const result = await db.query(
    'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
    [provider, oauthId]
  );
  return result.rows[0] || null;
}

export async function createOrUpdateOAuthUser(data: {
  userId?: string;
  oauthProvider: string;
  oauthId: string;
  email?: string | null;
  oauthEmail?: string | null;
  name: string;
  role?: UserRole;
  userType?: UserType;
  avatarUrl?: string | null;
}): Promise<User> {
  const db = getPool();

  if (data.userId) {
    // Update existing user
    try {
      const result = await db.query(
        `UPDATE users 
         SET oauth_provider = $1, oauth_id = $2, oauth_email = $3, 
             name = COALESCE($4, name), avatar_url = COALESCE($5, avatar_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [data.oauthProvider, data.oauthId, data.oauthEmail || null, data.name, data.avatarUrl || null, data.userId]
      );
      if (!result.rows[0]) {
        throw new Error(`User with ID ${data.userId} not found for OAuth update`);
      }
      return result.rows[0];
    } catch (error: any) {
      console.error('Error updating OAuth user:', error);
      throw error;
    }
  }

  // Create new user
  try {
    const userData = {
      email: data.email || data.oauthEmail || null,
      oauth_provider: data.oauthProvider,
      oauth_id: data.oauthId,
      oauth_email: data.oauthEmail || null,
      name: data.name,
      role: ensureRole(data.role),
      user_type: ensureUserType(data.userType),
      points: 0,
      avatar_url: data.avatarUrl || null,
    };
    console.log('Creating OAuth user with data:', JSON.stringify(userData, null, 2));
    const user = await createUser(userData);
    console.log('OAuth user created successfully:', user.id);
    return user;
  } catch (error: any) {
    console.error('Error creating OAuth user:', error);
    console.error('Error details:', error.message, error.code, error.detail);
    throw error;
  }
}

export async function getUserProgressService(userId: string) {
  const db = getPool();
  
  const progressResult = await db.query(
    `SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       COUNT(DISTINCT ft.id) as trees_planted,
       COALESCE(SUM(ut.points_earned), 0) as total_points
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );

  const co2Result = await db.query(
    `SELECT COALESCE(SUM(t.co2_savings_kg), 0) as co2_saved
     FROM user_tasks ut
     JOIN tasks t ON ut.task_id = t.id
     WHERE ut.user_id = $1`,
    [userId]
  );

  return {
    tasksCompleted: parseInt(progressResult.rows[0]?.tasks_completed || '0'),
    treesPlanted: parseInt(progressResult.rows[0]?.trees_planted || '0'),
    totalPoints: parseInt(progressResult.rows[0]?.total_points || '0'),
    co2Saved: parseFloat(co2Result.rows[0]?.co2_saved || '0'),
  };
}

export async function getPreferredLanguage(userId: string): Promise<'de' | 'en' | null> {
  const db = getPool();
  const result = await db.query(
    'SELECT preferred_language FROM users WHERE id = $1',
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return row.preferred_language === 'en' ? 'en' : 'de';
}

export type PlayerProfileStatus = 'pending' | 'skipped' | 'completed';

/** @deprecated Nutze computeDominantDyadFromScales aus onboarding-config.service */
export function computeDominantDyad(
  s1: number,
  s2: number,
  s3: number,
  s4: number
): 1 | 2 | 3 | 4 {
  return computeDominantDyadFromScales([s1, s2, s3, s4]) as 1 | 2 | 3 | 4;
}

function parseJsonNumberArray(raw: unknown): number[] | null {
  if (raw == null) return null;
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(arr)) return null;
  const nums = arr.map((x) => Number(x));
  if (nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 4)) {
    return nums;
  }
  return null;
}

function mapPlayerProfileFromRow(user: Record<string, unknown>) {
  const st = user.player_profile_status as string | undefined;
  const status: PlayerProfileStatus =
    st === 'skipped' || st === 'completed' || st === 'pending' ? st : 'pending';
  const dsv = parseJsonNumberArray(user.dyad_scale_values);
  const d1 = user.dyad_scale_1;
  const d2 = user.dyad_scale_2;
  const d3 = user.dyad_scale_3;
  const d4 = user.dyad_scale_4;
  const allLegacy =
    d1 !== null &&
    d1 !== undefined &&
    d2 !== null &&
    d2 !== undefined &&
    d3 !== null &&
    d3 !== undefined &&
    d4 !== null &&
    d4 !== undefined;
  const legacyTuple: number[] = allLegacy
    ? [Number(d1), Number(d2), Number(d3), Number(d4)]
    : [];
  const dyadScales: number[] | null =
    dsv && dsv.length > 0
      ? dsv
      : allLegacy
        ? legacyTuple
        : null;
  const dyadAnswers = parseJsonNumberArray(user.player_profile_answers);
  const dom = user.dominant_dyad;
  const domN = dom === null || dom === undefined ? NaN : Number(dom);
  const dominantDyad =
    !Number.isNaN(domN) && domN >= 1 && domN <= 64 ? domN : null;
  const completedAt = user.player_profile_completed_at;
  const completedIso =
    completedAt instanceof Date
      ? completedAt.toISOString()
      : typeof completedAt === 'string'
        ? completedAt
        : null;
  return {
    playerProfile: {
      status,
      dyadScales,
      dyadAnswers,
      dominantDyad,
      profileDisplayName:
        typeof user.profile_display_name === 'string' ? user.profile_display_name : null,
      completedAt: completedIso,
    },
  };
}

export async function getMeService(userId: string) {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email, oauth_email, name, role, user_type, points, avatar_url, sihot_guest_id, sihot_guest_data, preferred_language,
            forest_points_kommunikation, forest_points_mensch, forest_points_natur, forest_points_ressourcen,
            player_profile_status, dyad_scale_1, dyad_scale_2, dyad_scale_3, dyad_scale_4,
            dyad_scale_values, player_profile_answers,
            dominant_dyad, profile_display_name, player_profile_completed_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    return null;
  }
  const user = result.rows[0];
  const lang = user.preferred_language === 'en' ? 'en' : 'de';
  return {
    id: user.id,
    email: user.email || user.oauth_email || null,
    name: user.name,
    role: user.role,
    userType: user.user_type,
    points: user.points || 0,
    forestPoints: {
      kommunikation: parseInt(String(user.forest_points_kommunikation ?? 0), 10) || 0,
      mensch: parseInt(String(user.forest_points_mensch ?? 0), 10) || 0,
      natur: parseInt(String(user.forest_points_natur ?? 0), 10) || 0,
      ressourcen: parseInt(String(user.forest_points_ressourcen ?? 0), 10) || 0,
    },
    avatar: user.avatar_url || null,
    sihotGuestId: user.sihot_guest_id || null,
    sihotGuest: user.sihot_guest_data?.guest ?? null,
    sihotReservations: user.sihot_guest_data?.reservations ?? [],
    preferredLanguage: lang,
    ...mapPlayerProfileFromRow(user as Record<string, unknown>),
  };
}

export interface UpdateMyPlayerProfileBody {
  status?: 'skipped' | 'completed';
  /** Rohantworten 0–4, Länge = Dyaden × Fragen pro Dyade (empfohlen) */
  dyadAnswers?: number[];
  /** Aggregierte Werte pro Dyade (Legacy / einfache Clients) */
  dyadScales?: number[];
  /** Optionaler Anzeigename (Wald/Profil); leer wird als null gespeichert */
  profileDisplayName?: string | null;
}

export async function updatePlayerProfileForMeService(userId: string, body: UpdateMyPlayerProfileBody) {
  const db = getPool();
  const hasStatus = body.status !== undefined;
  const hasAnswers = body.dyadAnswers !== undefined;
  const hasScales = body.dyadScales !== undefined;
  const hasName = body.profileDisplayName !== undefined;

  if (!hasStatus && !hasScales && !hasAnswers && !hasName) {
    throw new Error('No player profile fields to update');
  }

  if (hasStatus && body.status === 'skipped') {
    await db.query(
      `UPDATE users SET
        player_profile_status = 'skipped',
        dyad_scale_1 = NULL,
        dyad_scale_2 = NULL,
        dyad_scale_3 = NULL,
        dyad_scale_4 = NULL,
        dyad_scale_values = NULL,
        player_profile_answers = NULL,
        dominant_dyad = NULL,
        player_profile_completed_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [userId]
    );
    if (hasName) {
      const raw = body.profileDisplayName;
      const trimmed =
        typeof raw === 'string' ? raw.trim().slice(0, 128) : '';
      await db.query(
        `UPDATE users SET profile_display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [trimmed === '' ? null : trimmed, userId]
      );
    }
    return getMeService(userId);
  }

  if (hasStatus && body.status === 'completed') {
    const config = await getOnboardingConfig();
    const expectedRaw = config.dyadCount * config.questionsPerDyad;
    let aggregated: number[];
    let rawStored: number[];

    if (hasAnswers && Array.isArray(body.dyadAnswers)) {
      rawStored = body.dyadAnswers.map((n) => Number(n));
      if (rawStored.length !== expectedRaw) {
        throw new Error(
          `dyadAnswers must have length ${expectedRaw} (dyadCount × questionsPerDyad)`
        );
      }
      for (let i = 0; i < rawStored.length; i++) {
        const n = rawStored[i];
        if (!Number.isInteger(n) || n < 0 || n > 4) {
          throw new Error(`dyadAnswers[${i}] must be an integer from 0 to 4`);
        }
      }
      aggregated = aggregateDyadAnswers(rawStored, config.dyadCount, config.questionsPerDyad);
    } else if (hasScales && Array.isArray(body.dyadScales)) {
      const scales = body.dyadScales.map((n) => Number(n));
      if (scales.length !== config.dyadCount) {
        throw new Error(`dyadScales must have length ${config.dyadCount}`);
      }
      if (config.questionsPerDyad > 1) {
        throw new Error('dyadAnswers required when questionsPerDyad > 1');
      }
      for (let i = 0; i < scales.length; i++) {
        const n = scales[i];
        if (!Number.isInteger(n) || n < 0 || n > 4) {
          throw new Error(`dyadScales[${i}] must be an integer from 0 to 4`);
        }
      }
      aggregated = scales;
      rawStored = [...scales];
    } else {
      throw new Error('completed status requires dyadAnswers or dyadScales');
    }

    const dominant = computeDominantDyadFromScales(aggregated);
    let displayName: string | null = null;
    if (hasName) {
      const raw = body.profileDisplayName;
      if (typeof raw === 'string') {
        const t = raw.trim().slice(0, 128);
        displayName = t === '' ? null : t;
      } else if (raw === null) {
        displayName = null;
      }
    } else {
      const cur = await db.query(
        'SELECT profile_display_name FROM users WHERE id = $1',
        [userId]
      );
      displayName = (cur.rows[0]?.profile_display_name as string | null) ?? null;
    }

    const s1 = aggregated[0] ?? null;
    const s2 = aggregated[1] ?? null;
    const s3 = aggregated[2] ?? null;
    const s4 = aggregated[3] ?? null;

    await db.query(
      `UPDATE users SET
        player_profile_status = 'completed',
        dyad_scale_1 = $1,
        dyad_scale_2 = $2,
        dyad_scale_3 = $3,
        dyad_scale_4 = $4,
        dyad_scale_values = $5::jsonb,
        player_profile_answers = $6::jsonb,
        dominant_dyad = $7,
        profile_display_name = $8,
        player_profile_completed_at = COALESCE(player_profile_completed_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9`,
      [
        s1,
        s2,
        s3,
        s4,
        JSON.stringify(aggregated),
        JSON.stringify(rawStored),
        dominant,
        displayName,
        userId,
      ]
    );
    return getMeService(userId);
  }

  if (!hasStatus && hasName && !hasScales && !hasAnswers) {
    const raw = body.profileDisplayName;
    const trimmed =
      typeof raw === 'string' ? raw.trim().slice(0, 128) : '';
    const value = raw === null ? null : trimmed === '' ? null : trimmed;
    await db.query(
      `UPDATE users SET profile_display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [value, userId]
    );
    return getMeService(userId);
  }

  throw new Error('Invalid player profile update: use status skipped/completed, or profileDisplayName alone');
}

export async function getUserProfileService(userId: string) {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email, oauth_email, name, role, user_type, points, avatar_url, sihot_guest_id, sihot_guest_data, preferred_language
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    return null;
  }
  const user = result.rows[0];
  const lang = user.preferred_language === 'en' ? 'en' : 'de';
  return {
    id: user.id,
    email: user.email || user.oauth_email || null,
    name: user.name,
    role: user.role,
    userType: user.user_type,
    points: user.points || 0,
    avatar_url: user.avatar_url || null,
    sihotGuestId: user.sihot_guest_id || null,
    sihotGuest: user.sihot_guest_data?.guest ?? null,
    sihotReservations: user.sihot_guest_data?.reservations ?? [],
    preferredLanguage: lang,
  };
}

export async function updateUserProfileService(userId: string, data: Partial<User>) {
  const db = getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatar_url);
  }
  if (data.role) {
    updates.push(`role = $${paramIndex++}`);
    values.push(ensureRole(data.role));
  }
  if (data.user_type) {
    updates.push(`user_type = $${paramIndex++}`);
    values.push(ensureUserType(data.user_type));
  }
  const preferredLang = data.preferred_language ?? (data as any).preferredLanguage;
  if (preferredLang !== undefined) {
    const lang = preferredLang === 'en' ? 'en' : 'de';
    updates.push(`preferred_language = $${paramIndex++}`);
    values.push(lang);
  }

  if (updates.length === 0) {
    return getUserProfileService(userId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, role, points, avatar_url, preferred_language`,
    values
  );

  return result.rows[0];
}

export async function setUserPasswordService(userId: string, password: string): Promise<void> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updateUserPassword(userId, passwordHash);
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const db = getPool();
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, userId]
  );
}

/**
 * Delete user_tasks entries for a user (oldest first)
 */
export async function deleteUserTasks(userId: string, count: number): Promise<number> {
  const db = getPool();
  const result = await db.query(
    `DELETE FROM user_tasks 
     WHERE user_id = $1 
     AND id IN (
       SELECT id FROM user_tasks 
       WHERE user_id = $1 
       ORDER BY completed_at ASC 
       LIMIT $2
     )
     RETURNING id`,
    [userId, count]
  );
  return result.rows.length;
}

/**
 * Adjust user points directly
 */
export async function adjustUserPoints(userId: string, pointsDelta: number): Promise<number> {
  const db = getPool();
  const result = await db.query(
    `UPDATE users 
     SET points = GREATEST(0, points + $1), 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING points`,
    [pointsDelta, userId]
  );
  if (!result.rows[0]) {
    throw new Error(`User with ID ${userId} not found`);
  }
  return result.rows[0].points;
}

export interface ListUsersFilters {
  role?: UserRole;
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UserListItem {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
  user_type: UserType;
  points: number;
  active: boolean;
  created_at: Date;
  deleted_at: Date | null;
}

export async function listUsersService(filters?: ListUsersFilters): Promise<{ users: UserListItem[]; total: number }> {
  const db = getPool();
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(filters.role);
  }

  if (filters?.active !== undefined) {
    conditions.push(`active = $${paramIndex++}`);
    params.push(filters.active);
  }

  if (filters?.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR oauth_email ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query(
    `SELECT id, email, oauth_email, name, role, user_type, points, active, created_at, deleted_at
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  const users = result.rows.map((row: any) => ({
    id: row.id,
    email: row.email || row.oauth_email || null,
    name: row.name,
    role: row.role,
    user_type: row.user_type,
    points: row.points || 0,
    active: row.active !== false,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
  }));

  return { users, total };
}

export interface UserDetails extends User {
  statistics?: {
    tasksCompleted: number;
    treesPlanted: number;
    totalPoints: number;
    co2Saved: number;
    rewardsRedeemed: number;
    firstTaskDate: Date | null;
    lastTaskDate: Date | null;
  };
}

export async function getUserDetailsService(userId: string): Promise<UserDetails | null> {
  const db = getPool();
  const userResult = await db.query(
    `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  if (!userResult.rows[0]) {
    return null;
  }

  const user = userResult.rows[0];

  // Get statistics
  const statsResult = await db.query(
    `SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       COUNT(DISTINCT ft.id) as trees_planted,
       COALESCE(SUM(ut.points_earned), 0) as total_points_earned,
       COALESCE(SUM(t.co2_savings_kg), 0) as co2_saved,
       COUNT(DISTINCT rr.id) as rewards_redeemed,
       MIN(ut.completed_at) as first_task_date,
       MAX(ut.completed_at) as last_task_date
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN tasks t ON ut.task_id = t.id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     LEFT JOIN reward_redemptions rr ON u.id = rr.user_id AND rr.status = 'used'
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );

  const stats = statsResult.rows[0] || {
    tasks_completed: 0,
    trees_planted: 0,
    total_points_earned: 0,
    co2_saved: 0,
    rewards_redeemed: 0,
    first_task_date: null,
    last_task_date: null,
  };

  return {
    ...user,
    statistics: {
      tasksCompleted: parseInt(stats.tasks_completed || '0', 10),
      treesPlanted: parseInt(stats.trees_planted || '0', 10),
      totalPoints: parseInt(stats.total_points_earned || '0', 10),
      co2Saved: parseFloat(stats.co2_saved || '0'),
      rewardsRedeemed: parseInt(stats.rewards_redeemed || '0', 10),
      firstTaskDate: stats.first_task_date,
      lastTaskDate: stats.last_task_date,
    },
  };
}

export async function updateUserRoleService(userId: string, role: UserRole, adminUserId: string): Promise<User> {
  const db = getPool();
  
  // Prevent admin from changing their own role
  if (userId === adminUserId) {
    throw new Error('Cannot change your own role');
  }

  const validatedRole = ensureRole(role);
  const result = await db.query(
    `UPDATE users 
     SET role = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [validatedRole, userId]
  );

  if (!result.rows[0]) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return result.rows[0];
}

export async function updateUserPointsService(userId: string, points: number): Promise<User> {
  const db = getPool();
  const result = await db.query(
    `UPDATE users 
     SET points = GREATEST(0, $1), updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [points, userId]
  );

  if (!result.rows[0]) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return result.rows[0];
}

export async function toggleUserActiveService(userId: string, adminUserId: string): Promise<User> {
  const db = getPool();
  
  // Prevent admin from deactivating themselves
  if (userId === adminUserId) {
    throw new Error('Cannot deactivate yourself');
  }

  const result = await db.query(
    `UPDATE users 
     SET active = NOT active, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [userId]
  );

  if (!result.rows[0]) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return result.rows[0];
}

export async function resetUserPasswordService(userId: string): Promise<{ message: string }> {
  const db = getPool();
  const { sendPasswordResetEmail } = await import('./auth-email.service.js');
  
  // Get user details
  const userResult = await db.query(
    `SELECT id, email, name FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  if (!user.email) {
    throw new Error('User has no email address');
  }

  // Send password reset email
  await sendPasswordResetEmail(user.id, user.email, user.name);

  return { message: 'Password reset email sent successfully' };
}

export async function deleteUserService(userId: string, adminUserId: string, hardDelete: boolean = false): Promise<void> {
  const db = getPool();
  
  // Prevent admin from deleting themselves
  if (userId === adminUserId) {
    throw new Error('Cannot delete yourself');
  }

  if (hardDelete) {
    // Hard delete: Remove user and all related data
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
  } else {
    // Soft delete: Mark as deleted
    await db.query(
      `UPDATE users 
       SET deleted_at = CURRENT_TIMESTAMP, 
           active = FALSE, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [userId]
    );
  }
}

/**
 * Ruft den zeitlichen Verlauf von Punkten, Bäumen und CO2 für einen Benutzer ab
 */
export async function createUserByAdminService(email: string, role: UserRole, name?: string): Promise<User> {
  // Check if user already exists (including soft-deleted users)
  const db = getPool();
  const existingUserResult = await db.query(
    `SELECT id, deleted_at FROM users WHERE email = $1`,
    [email]
  );
  
  if (existingUserResult.rows.length > 0) {
    const existingUser = existingUserResult.rows[0];
    if (existingUser.deleted_at === null) {
      throw new Error('User with this email already exists');
    }
    // If user is soft-deleted, reactivate and update it
    const userName = name || email.split('@')[0];
    const resolvedRole = ensureRole(role);
    const resolvedUserType = ensureUserType('explorer');

    const updateResult = await db.query(
      `UPDATE users 
       SET password_hash = NULL,
           name = $1,
           role = $2,
           user_type = $3,
           points = 0,
           email_verified = true,
           active = false,
           deleted_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [userName, resolvedRole, resolvedUserType, existingUser.id]
    );

    if (!updateResult.rows[0]) {
      throw new Error('Failed to reactivate soft-deleted user');
    }

    return updateResult.rows[0];
  }

  // Extract name from email if not provided
  const userName = name || email.split('@')[0];
  const resolvedRole = ensureRole(role);
  const resolvedUserType = ensureUserType('explorer');

  const values = [
    email,
    null, // No password - user will set it via email link
    userName,
    resolvedRole,
    resolvedUserType,
    0, // points
    null, // avatar_url
    null, // oauth_provider
    null, // oauth_id
    null, // oauth_email
    null, // sihot_guest_id
    null, // sihot_guest_data
  ];

  try {
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, user_type, points, avatar_url, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data, email_verified, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($12)::jsonb, true, false)
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('User creation returned no rows');
    }

    return result.rows[0];
  } catch (error: any) {
    // Handle duplicate key error (in case of race condition)
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      // Check if it's a soft-deleted user
      const checkResult = await db.query(
        `SELECT id, deleted_at FROM users WHERE email = $1`,
        [email]
      );
      if (checkResult.rows.length > 0 && checkResult.rows[0].deleted_at !== null) {
        // Retry with update
        const userName = name || email.split('@')[0];
        const resolvedRole = ensureRole(role);
        const resolvedUserType = ensureUserType('explorer');

        const updateResult = await db.query(
          `UPDATE users 
           SET password_hash = NULL,
               name = $1,
               role = $2,
               user_type = $3,
               points = 0,
               email_verified = true,
               active = false,
               deleted_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [userName, resolvedRole, resolvedUserType, checkResult.rows[0].id]
        );

        if (!updateResult.rows[0]) {
          throw new Error('Failed to reactivate soft-deleted user');
        }

        return updateResult.rows[0];
      }
      throw new Error('User with this email already exists');
    }
    throw error;
  }
}

type ForestCategoryBucket = {
  kommunikation: number;
  mensch: number;
  natur: number;
  ressourcen: number;
  sonstige: number;
};

function emptyForestBucket(): ForestCategoryBucket {
  return { kommunikation: 0, mensch: 0, natur: 0, ressourcen: 0, sonstige: 0 };
}

function addForestBucket(a: ForestCategoryBucket, b: ForestCategoryBucket): ForestCategoryBucket {
  return {
    kommunikation: a.kommunikation + b.kommunikation,
    mensch: a.mensch + b.mensch,
    natur: a.natur + b.natur,
    ressourcen: a.ressourcen + b.ressourcen,
    sonstige: a.sonstige + b.sonstige,
  };
}

/** Kalendertage von start bis end (inkl.), als YYYY-MM-DD (UTC-Mittag vermeidet DST-Sprünge). */
function enumerateDateKeysInclusive(startStr: string, endStr: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${startStr}T12:00:00.000Z`);
  const end = new Date(`${endStr}T12:00:00.000Z`);
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) {
    return out;
  }
  for (;;) {
    out.push(cur.toISOString().slice(0, 10));
    if (cur.getTime() >= end.getTime()) break;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * Täglicher Verlauf: ein Eintrag pro Kalendertag von Registrierung bis heute.
 * Punkte sind kumulativ (Summe aller bis einschließlich dieses Tages erhaltenen Punkte),
 * aufgeteilt nach Aufgaben-Kategorie (Wald-Kategorien + Sonstige).
 */
export async function getUserTimelineService(
  userId: string,
  _days?: number
): Promise<
  Array<{
    date: string;
    cumulativeByCategory: {
      kommunikation: number;
      mensch: number;
      natur: number;
      ressourcen: number;
      sonstige: number;
    };
    totalCumulative: number;
  }>
> {
  const db = getPool();

  const toDateKey = (d: unknown): string => {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    const s = String(d);
    return s.length >= 10 ? s.slice(0, 10) : s;
  };

  const userRow = await db.query(`SELECT DATE(created_at) AS d FROM users WHERE id = $1`, [userId]);
  const regDateStr = toDateKey(userRow.rows[0]?.d);
  if (!regDateStr) {
    return [];
  }

  const todayRow = await db.query(`SELECT CURRENT_DATE::text AS d`);
  const todayStr = String(todayRow.rows[0]?.d ?? '').slice(0, 10);
  const endStr = todayStr || new Date().toISOString().slice(0, 10);
  const dateKeys = enumerateDateKeysInclusive(regDateStr, endStr);
  if (dateKeys.length === 0) {
    return [];
  }

  const incrementsResult = await db.query(
    `SELECT
       DATE(ut.completed_at) AS d,
       CASE
         WHEN ut.task_category IN ('kommunikation', 'mensch', 'natur', 'ressourcen')
           THEN ut.task_category::text
         ELSE 'sonstige'
       END AS cat,
       COALESCE(SUM(ut.points_earned), 0)::int AS pts
     FROM user_tasks ut
     WHERE ut.user_id = $1
       AND ut.completed_at IS NOT NULL
       AND DATE(ut.completed_at) >= $2::date
       AND DATE(ut.completed_at) <= $3::date
     GROUP BY DATE(ut.completed_at), cat
     ORDER BY DATE(ut.completed_at) ASC`,
    [userId, regDateStr, endStr]
  );

  const dayIncrementMap = new Map<string, ForestCategoryBucket>();
  for (const row of incrementsResult.rows as any[]) {
    const d = toDateKey(row.d);
    if (!d) continue;
    const cat = String(row.cat ?? 'sonstige');
    const pts = parseInt(String(row.pts ?? 0), 10) || 0;
    if (!dayIncrementMap.has(d)) {
      dayIncrementMap.set(d, emptyForestBucket());
    }
    const bucket = dayIncrementMap.get(d)!;
    if (cat === 'kommunikation') bucket.kommunikation += pts;
    else if (cat === 'mensch') bucket.mensch += pts;
    else if (cat === 'natur') bucket.natur += pts;
    else if (cat === 'ressourcen') bucket.ressourcen += pts;
    else bucket.sonstige += pts;
  }

  let cumulative = emptyForestBucket();
  const timeline = dateKeys.map((date) => {
    const inc = dayIncrementMap.get(date) ?? emptyForestBucket();
    cumulative = addForestBucket(cumulative, inc);
    const totalCumulative =
      cumulative.kommunikation +
      cumulative.mensch +
      cumulative.natur +
      cumulative.ressourcen +
      cumulative.sonstige;
    return {
      date,
      cumulativeByCategory: { ...cumulative },
      totalCumulative,
    };
  });

  return timeline;
}

export async function getUserStatisticsService(userId: string): Promise<any> {
  const db = getPool();
  
  const statsResult = await db.query(
    `SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       COUNT(DISTINCT ft.id) as trees_planted,
       COALESCE(SUM(ut.points_earned), 0) as total_points_earned,
       COALESCE(SUM(t.co2_savings_kg), 0) as co2_saved,
       COUNT(DISTINCT rr.id) as rewards_redeemed,
       MIN(ut.completed_at) as first_task_date,
       MAX(ut.completed_at) as last_task_date,
       COUNT(DISTINCT CASE WHEN ut.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN ut.task_id END) as tasks_last_7_days,
       COUNT(DISTINCT CASE WHEN ut.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN ut.task_id END) as tasks_last_30_days
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN tasks t ON ut.task_id = t.id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     LEFT JOIN reward_redemptions rr ON u.id = rr.user_id AND rr.status = 'used'
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );

  const stats = statsResult.rows[0] || {
    tasks_completed: 0,
    trees_planted: 0,
    total_points_earned: 0,
    co2_saved: 0,
    rewards_redeemed: 0,
    first_task_date: null,
    last_task_date: null,
    tasks_last_7_days: 0,
    tasks_last_30_days: 0,
  };

  return {
    tasksCompleted: parseInt(stats.tasks_completed || '0', 10),
    treesPlanted: parseInt(stats.trees_planted || '0', 10),
    totalPointsEarned: parseInt(stats.total_points_earned || '0', 10),
    co2Saved: parseFloat(stats.co2_saved || '0'),
    rewardsRedeemed: parseInt(stats.rewards_redeemed || '0', 10),
    firstTaskDate: stats.first_task_date,
    lastTaskDate: stats.last_task_date,
    tasksLast7Days: parseInt(stats.tasks_last_7_days || '0', 10),
    tasksLast30Days: parseInt(stats.tasks_last_30_days || '0', 10),
  };
}
