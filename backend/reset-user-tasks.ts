import 'dotenv/config';
import { getPool } from './src/database/connection.js';

async function resetUserTasks(email: string) {
  const db = getPool();
  
  try {
    // Find user
    const userResult = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.name} (${user.email}) - ID: ${user.id}`);
    
    // Get all user_tasks for this user
    const tasksResult = await db.query(
      `SELECT ut.id, ut.task_id, ut.points_earned, t.title 
       FROM user_tasks ut
       INNER JOIN tasks t ON t.id = ut.task_id
       WHERE ut.user_id = $1`,
      [user.id]
    );
    
    console.log(`Found ${tasksResult.rows.length} completed tasks`);
    
    if (tasksResult.rows.length === 0) {
      console.log('No tasks to reset');
      process.exit(0);
    }
    
    // Calculate total points to deduct
    const totalPoints = tasksResult.rows.reduce((sum, row) => sum + (row.points_earned || 0), 0);
    console.log(`Total points earned from tasks: ${totalPoints}`);
    
    // Delete all user_tasks
    const deleteResult = await db.query('DELETE FROM user_tasks WHERE user_id = $1', [user.id]);
    console.log(`Deleted ${deleteResult.rowCount} user_task entries`);
    
    // Deduct points from user
    if (totalPoints > 0) {
      await db.query('UPDATE users SET points = GREATEST(0, points - $1) WHERE id = $2', [totalPoints, user.id]);
      console.log(`Deducted ${totalPoints} points from user`);
    }
    
    // Delete trees planted for these tasks
    const treesResult = await db.query(
      `DELETE FROM forest_trees 
       WHERE user_id = $1 
       AND task_id IN (SELECT task_id FROM user_tasks WHERE user_id = $1)`,
      [user.id]
    );
    // Actually, we need to get the task_ids first before deleting user_tasks
    const taskIds = tasksResult.rows.map(row => row.task_id);
    if (taskIds.length > 0) {
      const treesDeleteResult = await db.query(
        `DELETE FROM forest_trees WHERE user_id = $1 AND task_id = ANY($2::uuid[])`,
        [user.id, taskIds]
      );
      console.log(`Deleted ${treesDeleteResult.rowCount} trees`);
    }
    
    // Delete gallery images for approved photos
    const galleryResult = await db.query(
      `DELETE FROM gallery_images WHERE user_id = $1`,
      [user.id]
    );
    console.log(`Deleted ${galleryResult.rowCount} gallery images`);
    
    // Delete messages related to photo tasks
    const messagesResult = await db.query(
      `DELETE FROM messages WHERE user_id = $1 AND type LIKE 'photo_%'`,
      [user.id]
    );
    console.log(`Deleted ${messagesResult.rowCount} photo-related messages`);
    
    console.log('✅ All tasks reset successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error resetting user tasks:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

const email = process.argv[2] || 'thomas@rossner.tk';
resetUserTasks(email);
