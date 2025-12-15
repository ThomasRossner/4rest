#!/usr/bin/env node
/**
 * Forest Validation and Auto-Fix Script
 * 
 * This script validates and fixes forest tree and block coordinates according to the current logic:
 * - Each user has their own forest with trees in a grid layout
 * - Blocks are 20x20 units, arranged in square grids (2x2, 3x3, 4x4, etc.)
 * - Each block can hold max 8 trees
 * - Grid expands when needed (2x2 → 3x3 → 4x4, etc.)
 * - Trees must be within valid blocks according to the grid layout
 * 
 * The script can run in the background without disrupting services.
 */

import 'dotenv/config';
import { getPool, closeDatabase } from '../database/connection.js';
import { plantTree } from '../services/gamification.service.js';

/**
 * Rebuild a single user's forest purely from completed user_tasks.
 * 
 * Strategy:
 * - Dry run: report how many existing trees would be deleted and how many would be (re)created.
 * - Live run: delete all existing trees for the user, then call plantTree once per completed task.
 */
async function validateAndFixUserForest(
  db: any,
  userId: string,
  dryRun: boolean = false
): Promise<{ fixed: number; deleted: number; moved: number; errors: string[] }> {
  const stats = { fixed: 0, deleted: 0, moved: 0, errors: [] as string[] };
  
  try {
    // Count existing trees for this user
    const existingTreesResult = await db.query(
      `SELECT COUNT(*) AS count FROM forest_trees WHERE user_id = $1`,
      [userId]
    );
    const existingCount = parseInt(existingTreesResult.rows[0].count, 10) || 0;

    // Get all completed tasks for this user
    const completedTasksResult = await db.query(
      `SELECT task_id
         FROM user_tasks
        WHERE user_id = $1
          AND completed_at IS NOT NULL
          AND task_id IS NOT NULL
        ORDER BY completed_at ASC`,
      [userId]
    );
    const completedTaskIds: string[] = completedTasksResult.rows
      .map((row: any) => row.task_id)
      .filter((id: string | null) => !!id);

    const targetCount = completedTaskIds.length;

    // If both sides are empty, there's nothing to fix for this user
    if (existingCount === 0 && targetCount === 0) {
      return stats;
    }

    // Check if the user's forest is already consistent with completed tasks:
    // - exactly one tree per completed task
    // - all trees linked to a completed task_id
    if (existingCount === targetCount && targetCount > 0) {
      const treeTasksResult = await db.query(
        `SELECT task_id
           FROM forest_trees
          WHERE user_id = $1`,
        [userId]
      );
      const treeTaskIds: string[] = treeTasksResult.rows
        .map((row: any) => row.task_id)
        .filter((id: string | null) => !!id);

      // Build sets for comparison (order-independent)
      const completedSet = new Set(completedTaskIds);
      const treeSet = new Set(treeTaskIds);

      const sameSize = completedSet.size === treeSet.size;
      const allMatch =
        sameSize &&
        [...completedSet].every((tid) => treeSet.has(tid));

      if (allMatch) {
        // Forest already matches user_tasks; skip this user
        if (dryRun) {
          stats.errors.push(
            'Dry-run: forest already consistent with completed tasks, skipping rebuild.'
          );
        }
        return stats;
      }
    }

    if (dryRun) {
      // In dry run, just report what would happen
      stats.deleted = existingCount;
      stats.moved = targetCount; // reuse "moved" to mean "created"
      stats.fixed = stats.deleted + stats.moved;
      if (existingCount > 0 || targetCount > 0) {
        stats.errors.push(
          `Dry-run: would delete ${existingCount} existing tree(s) and recreate ${targetCount} tree(s) from completed tasks.`
        );
      }
      return stats;
    }

    // Live run: rebuild forest from scratch for this user
    await db.query('BEGIN');

    // Delete all existing trees
    if (existingCount > 0) {
      await db.query(`DELETE FROM forest_trees WHERE user_id = $1`, [userId]);
      stats.deleted = existingCount;
    }

    // Recreate trees by calling plantTree once per completed task
    for (const taskId of completedTaskIds) {
      await plantTree(userId, taskId);
      stats.moved += 1;
    }

    await db.query('COMMIT');

    stats.fixed = stats.deleted + stats.moved;
    
  } catch (error: any) {
    try {
      await db.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    stats.errors.push(`Error processing user ${userId}: ${error.message}`);
    console.error(`Error rebuilding forest for user ${userId}:`, error);
  }
  
  return stats;
}

/**
 * Main validation and fix function
 */
async function validateAndFixForest(dryRun: boolean = false) {
  const db = getPool();
  
  try {
    console.log(`\n🌲 Forest Validation and Auto-Fix Script`);
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
    console.log(`Started at: ${new Date().toISOString()}\n`);
    
    // Get all users
    const usersResult = await db.query(
      `SELECT id FROM users ORDER BY created_at ASC`
    );
    const users = usersResult.rows;
    const totalUsers = users.length;
    
    console.log(`Found ${totalUsers} users to validate\n`);
    
    let totalStats = {
      usersProcessed: 0,
      totalFixed: 0,
      totalDeleted: 0,
      totalMoved: 0,
      totalErrors: 0,
    };
    
    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const stats = await validateAndFixUserForest(db, user.id, dryRun);
      
      totalStats.usersProcessed++;
      totalStats.totalFixed += stats.fixed;
      totalStats.totalDeleted += stats.deleted;
      totalStats.totalMoved += stats.moved;
      totalStats.totalErrors += stats.errors.length;
      
      if (stats.fixed > 0 || stats.errors.length > 0) {
        console.log(`User ${i + 1}/${totalUsers} (${user.id.substring(0, 8)}...):`);
        if (stats.moved > 0) console.log(`  ✓ Moved ${stats.moved} tree(s)`);
        if (stats.deleted > 0) console.log(`  ✗ Deleted ${stats.deleted} tree(s)`);
        if (stats.errors.length > 0) {
          stats.errors.forEach(err => console.log(`  ⚠ ${err}`));
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Users processed: ${totalStats.usersProcessed}`);
    console.log(`  Trees moved: ${totalStats.totalMoved}`);
    console.log(`  Trees deleted: ${totalStats.totalDeleted}`);
    console.log(`  Total fixed: ${totalStats.totalFixed}`);
    console.log(`  Errors: ${totalStats.totalErrors}`);
    console.log(`\nCompleted at: ${new Date().toISOString()}\n`);
    
    if (dryRun) {
      console.log(`⚠️  This was a DRY RUN. No changes were made.`);
      console.log(`   Run without --dry-run to apply fixes.\n`);
    }
    
  } catch (error: any) {
    console.error('Fatal error:', error);
    await closeDatabase();
    process.exit(1);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

// Run script
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
validateAndFixForest(dryRun).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

