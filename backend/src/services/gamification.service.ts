import { getPool } from '../database/connection.js';

export async function addUserPoints(userId: string, points: number) {
  const db = getPool();
  await db.query(
    'UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [points, userId]
  );
}

export async function plantTree(userId: string, taskId: string) {
  const db = getPool();
  
  // Generate random position within forest grid
  const positionX = (Math.random() - 0.5) * 20;
  const positionZ = (Math.random() - 0.5) * 20;
  
  await db.query(
    `INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, taskId, positionX, 0, positionZ]
  );
}
