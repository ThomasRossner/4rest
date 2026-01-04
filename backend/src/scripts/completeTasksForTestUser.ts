#!/usr/bin/env ts-node

/**
 * Script to complete 20 unfinished tasks for test@example.com
 * This will plant 20 new trees and grow some existing ones
 */

import 'dotenv/config';
import { getPool } from '../database/connection.js';
import { completeTask } from '../services/task.service.js';
import { getUserByEmail } from '../services/user.service.js';

async function completeTasksForTestUser() {
  const db = getPool();
  
  try {
    console.log('Starting script to complete 20 tasks for test@example.com...\n');

    // Get user ID for test@example.com
    const user = await getUserByEmail('test@example.com');
    if (!user) {
      throw new Error('User test@example.com not found');
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})\n`);

    // Find unfinished tasks (tasks not in user_tasks for this user)
    const unfinishedTasksQuery = `
      SELECT t.id, t.title, t.type, t.points, t.quiz_questions
      FROM tasks t
      WHERE t.active = TRUE
        AND t.id NOT IN (
          SELECT task_id 
          FROM user_tasks 
          WHERE user_id = $1
        )
      ORDER BY t.created_at ASC
      LIMIT 20
    `;

    const unfinishedTasksResult = await db.query(unfinishedTasksQuery, [user.id]);
    const unfinishedTasks = unfinishedTasksResult.rows;

    if (unfinishedTasks.length === 0) {
      console.log('No unfinished tasks found for this user.');
      return;
    }

    console.log(`Found ${unfinishedTasks.length} unfinished tasks to complete:\n`);
    unfinishedTasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.title} (${task.type}, ${task.points} points)`);
    });
    console.log('');

    // Complete each task
    let completedCount = 0;
    let errors = 0;
    let totalPointsAwarded = 0;

    for (const task of unfinishedTasks) {
      try {
        console.log(`Completing task: ${task.title}...`);
        
        // Prepare data based on task type
        let taskData: any = {};
        
        if (task.type === 'video' && task.quiz_questions) {
          // For video tasks with quiz, we need to provide quiz answers
          // Parse quiz questions to create valid answers
          const questions = typeof task.quiz_questions === 'string'
            ? JSON.parse(task.quiz_questions)
            : task.quiz_questions;
          
          if (Array.isArray(questions) && questions.length > 0) {
            // Create answers with correct answers (to pass validation)
            taskData.quiz_answers = questions.map((q: any, index: number) => ({
              questionIndex: index,
              answer: q.correctAnswer || (q.options ? q.options[0] : 'A')
            }));
          }
        } else if (task.type === 'photo') {
          // For photo tasks, provide a dummy photo URL
          taskData.photo_url = 'https://example.com/test-photo.jpg';
        }
        // For other types (qr_code, visit_location), no additional data needed

        await completeTask(task.id, user.id, taskData);
        completedCount++;
        totalPointsAwarded += task.points;
        console.log(`  ✓ Completed! (+${task.points} points, tree planted)\n`);
      } catch (error: any) {
        errors++;
        console.error(`  ✗ Error completing task: ${error.message}\n`);
      }
    }

    // Get final stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM user_tasks WHERE user_id = $1) as completed_tasks,
        (SELECT COUNT(*) FROM forest_trees WHERE user_id = $1) as total_trees,
        (SELECT points FROM users WHERE id = $1) as user_points
    `;
    const statsResult = await db.query(statsQuery, [user.id]);
    const stats = statsResult.rows[0];

    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  Tasks completed: ${completedCount}/${unfinishedTasks.length}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total completed tasks: ${stats.completed_tasks}`);
    console.log(`  Total trees planted: ${stats.total_trees}`);
    console.log(`  User points: ${stats.user_points}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script (ES module way)
completeTasksForTestUser()
  .then(() => {
    console.log('\nScript completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });

export { completeTasksForTestUser };

