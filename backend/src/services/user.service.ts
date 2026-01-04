import { getPool } from '../database/connection.js';
import { USER_ROLES, USER_TYPES, UserRole, UserType } from '../constants/enums.js';

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
  email_verified?: boolean;
  email_verification_token?: string | null;
  email_verification_expires?: Date | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  email_notifications_enabled?: boolean;
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
}

function ensureRole(value: unknown): UserRole {
  if (typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)) {
    return value as UserRole;
  }
  return 'stakeholder';
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
    ];
    
    console.log('Creating user with values:', {
      email: values[0],
      hasPassword: !!values[1],
      name: values[2],
      role: values[3],
      oauth_provider: values[6],
      oauth_id: values[7],
    });
    
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, user_type, points, avatar_url, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($12)::jsonb)
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

export async function getMeService(userId: string) {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email, oauth_email, name, role, user_type, points, avatar_url, sihot_guest_id, sihot_guest_data
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    return null;
  }
  const user = result.rows[0];
  // Return email || oauth_email for OAuth users
  return {
    id: user.id,
    email: user.email || user.oauth_email || null,
    name: user.name,
    role: user.role,
    userType: user.user_type,
    points: user.points || 0,
    avatar: user.avatar_url || null,
    sihotGuestId: user.sihot_guest_id || null,
    sihotGuest: user.sihot_guest_data?.guest ?? null,
    sihotReservations: user.sihot_guest_data?.reservations ?? [],
  };
}

export async function getUserProfileService(userId: string) {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email, oauth_email, name, role, user_type, points, avatar_url, sihot_guest_id, sihot_guest_data
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    return null;
  }
  const user = result.rows[0];
  // Return email || oauth_email for OAuth users
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

  if (updates.length === 0) {
    return getUserProfileService(userId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, role, points, avatar_url`,
    values
  );

  return result.rows[0];
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
