import { Pool } from 'pg';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'roots_of_impact',
  user: process.env.DB_USER || 'roots_user',
  password: process.env.DB_PASSWORD || 'roots_password',
};

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool(DB_CONFIG);
  }
  return pool;
}

export async function cleanupTestData(): Promise<void> {
  const db = getDbPool();
  
  try {
    // Delete test users (by email pattern)
    await db.query(`
      DELETE FROM user_tasks WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%@test.com'
      )
    `);
    
    await db.query(`
      DELETE FROM users WHERE email LIKE '%@test.com'
    `);
    
    // Delete test tasks (by title pattern)
    await db.query(`
      DELETE FROM tasks WHERE title LIKE 'Test Task%' OR title LIKE 'E2E Test%'
    `);
    
    // Delete test rewards (by title pattern)
    await db.query(`
      DELETE FROM rewards WHERE title LIKE 'Test Reward%' OR title LIKE 'E2E Test%'
    `);
  } catch (error) {
    console.warn('Could not cleanup test data:', error);
  }
}

export async function seedTestData(): Promise<void> {
  const db = getDbPool();
  
  try {
    // Create test tasks if they don't exist
    const testTasks = [
      {
        title: 'E2E Test QR Task',
        type: 'qr',
        points: 20,
        qr_code: 'E2E-TEST-QR-001',
        active: true,
      },
      {
        title: 'E2E Test Photo Task',
        type: 'photo',
        points: 30,
        photo_required: true,
        active: true,
      },
    ];
    
    for (const task of testTasks) {
    await db.query(`
      INSERT INTO tasks (title, type, points, qr_code, photo_required, active, allowed_roles, allowed_user_types)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
    `, [
        task.title,
        task.type,
        task.points,
        task.qr_code || null,
        task.photo_required || false,
        task.active,
        '{}',
        '{}',
      ]).catch(() => {
        // Task might already exist
      });
    }
  } catch (error) {
    console.warn('Could not seed test data:', error);
  }
}
