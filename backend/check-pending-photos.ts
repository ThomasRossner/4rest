import { getPool } from './src/database/connection.js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

async function checkPendingPhotos() {
  const db = getPool();

  try {
    // Check for tasks with "Fair Fashion" or "Fehlerfinden" in title
    const tasksResult = await db.query(
      `SELECT id, title, type FROM tasks 
       WHERE title ILIKE '%Fair Fashion%' OR title ILIKE '%Fehlerfinden%'`
    );
    console.log('\n=== Tasks found ===');
    console.log(tasksResult.rows);

    // Check user_tasks for these tasks
    if (tasksResult.rows.length > 0) {
      const taskIds = tasksResult.rows.map((r: any) => r.id);
      const userTasksResult = await db.query(
        `SELECT 
           ut.id,
           ut.user_id,
           ut.task_id,
           ut.photo_url IS NOT NULL as has_photo,
           ut.verification_status,
           ut.completed_at,
           t.title as task_title,
           t.type as task_type,
           u.email as user_email
         FROM user_tasks ut
         INNER JOIN tasks t ON t.id = ut.task_id
         INNER JOIN users u ON u.id = ut.user_id
         WHERE ut.task_id = ANY($1::uuid[])`,
        [taskIds]
      );
      console.log('\n=== User tasks for these tasks ===');
      console.log(userTasksResult.rows);
    }

    // Check all pending photo tasks
    const pendingResult = await db.query(
      `SELECT 
         ut.id,
         ut.verification_status,
         ut.photo_url IS NOT NULL as has_photo,
         t.title as task_title,
         t.type as task_type,
         u.email as user_email
       FROM user_tasks ut
       INNER JOIN tasks t ON t.id = ut.task_id
       INNER JOIN users u ON u.id = ut.user_id
       WHERE ut.verification_status = 'pending'
         AND ut.photo_url IS NOT NULL`
    );
    console.log('\n=== All pending photo tasks ===');
    console.log(pendingResult.rows);

    // Check all user_tasks with photos
    const allWithPhotos = await db.query(
      `SELECT 
         ut.id,
         ut.verification_status,
         t.title as task_title,
         t.type as task_type,
         u.email as user_email
       FROM user_tasks ut
       INNER JOIN tasks t ON t.id = ut.task_id
       INNER JOIN users u ON u.id = ut.user_id
       WHERE ut.photo_url IS NOT NULL
       ORDER BY ut.completed_at DESC
       LIMIT 10`
    );
    console.log('\n=== All user_tasks with photos (last 10) ===');
    console.log(allWithPhotos.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

checkPendingPhotos();
