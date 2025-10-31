import { getPool } from '../database/connection.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  points: number;
  avatar_url?: string;
}

export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO users (email, password_hash, name, role, points)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.email, data.password_hash, data.name, data.role || 'guest', data.points || 0]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
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

export async function getUserProfileService(userId: string) {
  const db = getPool();
  const result = await db.query(
    'SELECT id, email, name, role, points, avatar_url FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
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
