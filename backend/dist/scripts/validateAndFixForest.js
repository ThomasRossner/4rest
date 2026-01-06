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
import { FOREST_AREA_SPACING, FOREST_MAX_TREES_PER_BLOCK, calculateGridSize, generateBlockOrigins, } from '../services/forestLayout.js';
/**
 * Ensure trees for a user obey the current geometric constraints:
 * - trees are placed within the user's square grid layout (2x2, 3x3, 4x4, ...)
 * - max 8 trees per 20x20 block
 * - trees keep a margin from block borders
 *
 * This does NOT change the number of trees or which tasks they belong to – only coordinates.
 */
async function fixTreeGeometryForUser(db, userId, dryRun, force) {
    const errors = [];
    // Load all trees for this user
    const treesResult = await db.query(`SELECT id, position_x, position_y, position_z, planted_at
       FROM forest_trees
      WHERE user_id = $1
      ORDER BY planted_at ASC`, [userId]);
    const trees = treesResult.rows;
    const treeCount = trees.length;
    if (treeCount === 0) {
        return { repositioned: 0, errors };
    }
    // Get user index to calculate primary origin (same logic as forest.service.ts)
    const usersResult = await db.query(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`);
    const userIds = usersResult.rows.map((r) => r.id);
    const userIndex = userIds.indexOf(userId);
    if (userIndex === -1) {
        errors.push('User not found in users list when computing forest geometry.');
        return { repositioned: 0, errors };
    }
    const gridCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, userIds.length))));
    const col = userIndex % gridCols;
    const rowIdx = Math.floor(userIndex / gridCols);
    const primaryOriginX = col * FOREST_AREA_SPACING;
    const primaryOriginZ = rowIdx * FOREST_AREA_SPACING;
    // Determine required grid size and block origins
    const gridSize = calculateGridSize(treeCount, FOREST_MAX_TREES_PER_BLOCK);
    const blockOrigins = generateBlockOrigins(primaryOriginX, primaryOriginZ, gridSize, FOREST_AREA_SPACING);
    if (blockOrigins.length * FOREST_MAX_TREES_PER_BLOCK < treeCount) {
        errors.push(`Not enough block capacity for trees: have ${treeCount} trees but only ${blockOrigins.length * FOREST_MAX_TREES_PER_BLOCK} available slots.`);
        return { repositioned: 0, errors };
    }
    const blockStates = blockOrigins.map((origin) => ({
        originX: origin.x,
        originZ: origin.z,
        trees: [],
        keptTrees: [],
        capacity: FOREST_MAX_TREES_PER_BLOCK,
    }));
    const blockByKey = new Map();
    for (const block of blockStates) {
        const key = `${block.originX},${block.originZ}`;
        blockByKey.set(key, block);
    }
    let treesToMove = [];
    if (force) {
        // In force mode, we ignore existing geometry and treat ALL trees as candidates to move.
        treesToMove = [...trees];
        // All blocks start empty with full capacity; usedPositions stays empty so all positions are regenerated.
    }
    else {
        const outOfGridTrees = [];
        // Assign each tree to its current block based on coordinates
        for (const tree of trees) {
            const x = parseFloat(tree.position_x);
            const z = parseFloat(tree.position_z);
            const areaX = Math.floor(x / FOREST_AREA_SPACING) * FOREST_AREA_SPACING;
            const areaZ = Math.floor(z / FOREST_AREA_SPACING) * FOREST_AREA_SPACING;
            const key = `${areaX},${areaZ}`;
            const block = blockByKey.get(key);
            if (!block) {
                // Tree is outside the current strict grid
                outOfGridTrees.push(tree);
                continue;
            }
            block.trees.push(tree);
        }
        // Determine kept vs overflow trees per block and record used positions of kept trees
        const overflowTrees = [];
        for (const block of blockStates) {
            if (block.trees.length <= FOREST_MAX_TREES_PER_BLOCK) {
                block.keptTrees = [...block.trees];
                block.capacity = FOREST_MAX_TREES_PER_BLOCK - block.trees.length;
            }
            else {
                // Keep earliest-planted trees, overflow the rest
                const sorted = [...block.trees].sort((a, b) => new Date(a.planted_at).getTime() - new Date(b.planted_at).getTime());
                block.keptTrees = sorted.slice(0, FOREST_MAX_TREES_PER_BLOCK);
                const extras = sorted.slice(FOREST_MAX_TREES_PER_BLOCK);
                overflowTrees.push(...extras);
                block.capacity = 0;
            }
            // Existing kept trees are considered valid and retain their positions (no change needed).
        }
        // Trees that must be moved: outside grid or overflowing blocks
        treesToMove = [...outOfGridTrees, ...overflowTrees];
    }
    if (treesToMove.length === 0) {
        return { repositioned: 0, errors };
    }
    // Collect blocks with available capacity
    const availableBlocks = blockStates.filter((b) => b.capacity > 0);
    let totalCapacity = availableBlocks.reduce((sum, b) => sum + b.capacity, 0);
    if (totalCapacity < treesToMove.length) {
        errors.push(`Not enough capacity in valid blocks to relocate trees: need ${treesToMove.length} slots, have ${totalCapacity}.`);
        return { repositioned: 0, errors };
    }
    /**
     * Generate a new absolute position for a tree inside the given block,
     * using the same spacing / conflict rules as plantTree.
     */
    async function generateRandomPositionInBlock(block) {
        const areaSpacing = FOREST_AREA_SPACING;
        const edgePadding = 0.5;
        const minDistance = 1.5;
        const blockMinX = block.originX + edgePadding;
        const blockMaxX = block.originX + areaSpacing - edgePadding;
        const blockMinZ = block.originZ + edgePadding;
        const gridMaxZ = primaryOriginZ + areaSpacing * gridSize - 0.001;
        const blockMaxZ = Math.min(block.originZ + areaSpacing - edgePadding, gridMaxZ - edgePadding);
        let absoluteX;
        let absoluteZ;
        let attempts = 0;
        const maxAttempts = 200;
        do {
            absoluteX = blockMinX + Math.random() * (blockMaxX - blockMinX);
            absoluteZ = blockMinZ + Math.random() * (blockMaxZ - blockMinZ);
            // Validate bounds
            absoluteX = Math.max(blockMinX, Math.min(absoluteX, blockMaxX));
            absoluteZ = Math.max(blockMinZ, Math.min(absoluteZ, blockMaxZ));
            // Verify block assignment
            const calculatedBlockX = Math.floor(absoluteX / areaSpacing) * areaSpacing;
            const calculatedBlockZ = Math.floor(absoluteZ / areaSpacing) * areaSpacing;
            if (calculatedBlockX !== block.originX || calculatedBlockZ !== block.originZ) {
                attempts++;
                continue;
            }
            // Check for conflicts using the same DB-based distance check as plantTree
            const conflictCheck = await db.query(`SELECT COUNT(*) as count 
         FROM forest_trees 
         WHERE user_id = $1 
           AND ABS(position_x - $2) < $3 
           AND ABS(position_z - $4) < $3`, [userId, absoluteX, minDistance, absoluteZ]);
            if (parseInt(conflictCheck.rows[0].count, 10) === 0) {
                break;
            }
            attempts++;
        } while (attempts < maxAttempts);
        // If no valid position found, use block center with clamping
        if (attempts >= maxAttempts) {
            absoluteX = block.originX + areaSpacing / 2;
            absoluteZ = block.originZ + areaSpacing / 2;
            absoluteX = Math.max(blockMinX, Math.min(absoluteX, blockMaxX));
            absoluteZ = Math.max(blockMinZ, Math.min(absoluteZ, blockMaxZ));
        }
        return { x: absoluteX, z: absoluteZ };
    }
    function acquireBlockForMove() {
        for (const block of availableBlocks) {
            if (block.capacity > 0) {
                block.capacity -= 1;
                totalCapacity -= 1;
                return block;
            }
        }
        return null;
    }
    let repositioned = 0;
    for (const tree of treesToMove) {
        const block = acquireBlockForMove();
        if (!block) {
            errors.push('Ran out of block capacity while relocating trees.');
            break;
        }
        if (dryRun) {
            repositioned++;
            continue;
        }
        const { x: targetX, z: targetZ } = await generateRandomPositionInBlock(block);
        const currentX = parseFloat(tree.position_x);
        const currentZ = parseFloat(tree.position_z);
        // If already at a valid target position, skip
        if (currentX === targetX && currentZ === targetZ) {
            continue;
        }
        const newY = tree.position_y !== null && tree.position_y !== undefined
            ? parseFloat(tree.position_y)
            : 0;
        await db.query(`UPDATE forest_trees
          SET position_x = $1,
              position_y = $2,
              position_z = $3
        WHERE id = $4`, [targetX, newY, targetZ, tree.id]);
        repositioned++;
    }
    return { repositioned, errors };
}
/**
 * Rebuild and/or repair a single user's forest based on completed user_tasks and geometry rules.
 *
 * Strategy:
 * - First, compare forest_trees vs. completed user_tasks:
 *   - If inconsistent: rebuild (delete + re-plant via plantTree for each completed task).
 *   - If consistent: keep existing trees (to preserve growth), no delete/recreate.
 * - Then, in both cases, enforce geometry:
 *   - Ensure trees are placed in a square grid (2x2, 3x3, 4x4, ...).
 *   - Max 8 trees per 20x20 block.
 *   - Trees placed with a margin from block borders.
 * - Dry run: report what would happen without changing the DB.
 */
async function validateAndFixUserForest(db, userId, dryRun = false, forceGeometry = false) {
    const stats = { fixed: 0, deleted: 0, moved: 0, errors: [] };
    try {
        // Count existing trees for this user
        const existingTreesResult = await db.query(`SELECT COUNT(*) AS count FROM forest_trees WHERE user_id = $1`, [userId]);
        const existingCount = parseInt(existingTreesResult.rows[0].count, 10) || 0;
        // Get all completed tasks for this user
        const completedTasksResult = await db.query(`SELECT task_id
         FROM user_tasks
        WHERE user_id = $1
          AND completed_at IS NOT NULL
          AND task_id IS NOT NULL
        ORDER BY completed_at ASC`, [userId]);
        const completedTaskIds = completedTasksResult.rows
            .map((row) => row.task_id)
            .filter((id) => !!id);
        const targetCount = completedTaskIds.length;
        // If both sides are empty, there's nothing to fix for this user
        if (existingCount === 0 && targetCount === 0) {
            return stats;
        }
        // Check if the user's forest is already consistent with completed tasks:
        // - exactly one tree per completed task
        // - all trees linked to a completed task_id
        let isConsistent = false;
        if (existingCount === targetCount && targetCount > 0) {
            const treeTasksResult = await db.query(`SELECT task_id
           FROM forest_trees
          WHERE user_id = $1`, [userId]);
            const treeTaskIds = treeTasksResult.rows
                .map((row) => row.task_id)
                .filter((id) => !!id);
            // Build sets for comparison (order-independent)
            const completedSet = new Set(completedTaskIds);
            const treeSet = new Set(treeTaskIds);
            const sameSize = completedSet.size === treeSet.size;
            const allMatch = sameSize &&
                [...completedSet].every((tid) => treeSet.has(tid));
            isConsistent = allMatch;
        }
        // If we're in dry-run mode, just report rebuild effect (if any) and geometry adjustments
        if (dryRun) {
            if (!isConsistent) {
                // Would rebuild: delete + recreate trees from completed tasks
                stats.deleted = existingCount;
                stats.moved = targetCount; // reuse "moved" to mean "created"
                stats.fixed = stats.deleted + stats.moved;
                if (existingCount > 0 || targetCount > 0) {
                    stats.errors.push(`Dry-run: would delete ${existingCount} existing tree(s) and recreate ${targetCount} tree(s) from completed tasks.`);
                }
            }
            // Also estimate how many trees would be repositioned by geometry fix
            const geometryDryRun = await fixTreeGeometryForUser(db, userId, true, forceGeometry);
            if (geometryDryRun.repositioned > 0) {
                stats.moved += geometryDryRun.repositioned;
                stats.fixed += geometryDryRun.repositioned;
                stats.errors.push(`Dry-run: would reposition ${geometryDryRun.repositioned} tree(s) to match current grid layout.`);
            }
            return stats;
        }
        // LIVE MODE
        // 1) Rebuild from completed tasks if inconsistent
        if (!isConsistent) {
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
        }
        // 2) Enforce geometry for this user (regardless of whether we rebuilt)
        const geometryFix = await fixTreeGeometryForUser(db, userId, false, forceGeometry);
        if (geometryFix.repositioned > 0) {
            stats.moved += geometryFix.repositioned;
            stats.fixed += geometryFix.repositioned;
        }
        if (geometryFix.errors.length > 0) {
            stats.errors.push(...geometryFix.errors);
        }
    }
    catch (error) {
        try {
            await db.query('ROLLBACK');
        }
        catch {
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
async function validateAndFixForest(dryRun = false, forceGeometry = false, userFilter) {
    const db = getPool();
    try {
        console.log(`\n🌲 Forest Validation and Auto-Fix Script`);
        console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
        if (forceGeometry) {
            console.log(`Geometry: FORCE mode (all trees may be repositioned even if already valid)`);
        }
        else {
            console.log(`Geometry: VALIDATION mode (only out-of-grid / overflowing trees are repositioned)`);
        }
        if (userFilter) {
            console.log(`User filter: ${userFilter}`);
        }
        console.log(`Started at: ${new Date().toISOString()}\n`);
        // Get users to process (optionally filtered by email or id)
        let usersResult;
        if (userFilter) {
            if (userFilter.includes('@')) {
                usersResult = await db.query(`SELECT id, email FROM users WHERE email = $1 ORDER BY created_at ASC`, [userFilter]);
            }
            else {
                usersResult = await db.query(`SELECT id, email FROM users WHERE id = $1`, [userFilter]);
            }
        }
        else {
            usersResult = await db.query(`SELECT id, email FROM users ORDER BY created_at ASC`);
        }
        const users = usersResult.rows;
        const totalUsers = users.length;
        if (totalUsers === 0) {
            console.log(userFilter
                ? `No users found matching filter "${userFilter}". Nothing to do.\n`
                : 'No users found to validate.\n');
            await closeDatabase();
            process.exit(0);
        }
        console.log(`Found ${totalUsers} user(s) to validate\n`);
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
            const stats = await validateAndFixUserForest(db, user.id, dryRun, forceGeometry);
            totalStats.usersProcessed++;
            totalStats.totalFixed += stats.fixed;
            totalStats.totalDeleted += stats.deleted;
            totalStats.totalMoved += stats.moved;
            totalStats.totalErrors += stats.errors.length;
            if (stats.fixed > 0 || stats.errors.length > 0) {
                console.log(`User ${i + 1}/${totalUsers} (${user.id.substring(0, 8)}...):`);
                if (stats.moved > 0)
                    console.log(`  ✓ Moved ${stats.moved} tree(s)`);
                if (stats.deleted > 0)
                    console.log(`  ✗ Deleted ${stats.deleted} tree(s)`);
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
    }
    catch (error) {
        console.error('Fatal error:', error);
        await closeDatabase();
        process.exit(1);
    }
    finally {
        await closeDatabase();
        process.exit(0);
    }
}
// Run script
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
const forceGeometry = process.argv.includes('--force');
const userFilterArg = args[0]; // e.g. email or user id when provided via `npm run ... -- user@example.com`
validateAndFixForest(dryRun, forceGeometry, userFilterArg).catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
//# sourceMappingURL=validateAndFixForest.js.map