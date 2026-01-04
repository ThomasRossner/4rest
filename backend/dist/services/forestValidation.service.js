/**
 * Forest Validation Service
 *
 * Provides async execution of forest validation and fixing without process.exit calls.
 * Used by the admin API endpoint.
 */
import { getPool } from '../database/connection.js';
import { plantTree } from './gamification.service.js';
import { FOREST_AREA_SPACING, FOREST_MAX_TREES_PER_BLOCK, calculateGridSize, generateBlockOrigins, } from './forestLayout.js';
/**
 * Ensure trees for a user obey the current geometric constraints.
 * This is the same logic as in validateAndFixForest.ts but without process.exit.
 */
async function fixTreeGeometryForUser(db, userId, dryRun, force) {
    const errors = [];
    const treesResult = await db.query(`SELECT id, position_x, position_y, position_z, planted_at
       FROM forest_trees
      WHERE user_id = $1
      ORDER BY planted_at ASC`, [userId]);
    const trees = treesResult.rows;
    const treeCount = trees.length;
    if (treeCount === 0) {
        return { repositioned: 0, errors };
    }
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
        treesToMove = [...trees];
    }
    else {
        const outOfGridTrees = [];
        for (const tree of trees) {
            const x = parseFloat(tree.position_x);
            const z = parseFloat(tree.position_z);
            const areaX = Math.floor(x / FOREST_AREA_SPACING) * FOREST_AREA_SPACING;
            const areaZ = Math.floor(z / FOREST_AREA_SPACING) * FOREST_AREA_SPACING;
            const key = `${areaX},${areaZ}`;
            const block = blockByKey.get(key);
            if (!block) {
                outOfGridTrees.push(tree);
                continue;
            }
            block.trees.push(tree);
        }
        const overflowTrees = [];
        for (const block of blockStates) {
            if (block.trees.length <= FOREST_MAX_TREES_PER_BLOCK) {
                block.keptTrees = [...block.trees];
                block.capacity = FOREST_MAX_TREES_PER_BLOCK - block.trees.length;
            }
            else {
                const sorted = [...block.trees].sort((a, b) => new Date(a.planted_at).getTime() - new Date(b.planted_at).getTime());
                block.keptTrees = sorted.slice(0, FOREST_MAX_TREES_PER_BLOCK);
                const extras = sorted.slice(FOREST_MAX_TREES_PER_BLOCK);
                overflowTrees.push(...extras);
                block.capacity = 0;
            }
        }
        treesToMove = [...outOfGridTrees, ...overflowTrees];
    }
    if (treesToMove.length === 0) {
        return { repositioned: 0, errors };
    }
    const availableBlocks = blockStates.filter((b) => b.capacity > 0);
    let totalCapacity = availableBlocks.reduce((sum, b) => sum + b.capacity, 0);
    if (totalCapacity < treesToMove.length) {
        errors.push(`Not enough capacity in valid blocks to relocate trees: need ${treesToMove.length} slots, have ${totalCapacity}.`);
        return { repositioned: 0, errors };
    }
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
            absoluteX = Math.max(blockMinX, Math.min(absoluteX, blockMaxX));
            absoluteZ = Math.max(blockMinZ, Math.min(absoluteZ, blockMaxZ));
            const calculatedBlockX = Math.floor(absoluteX / areaSpacing) * areaSpacing;
            const calculatedBlockZ = Math.floor(absoluteZ / areaSpacing) * areaSpacing;
            if (calculatedBlockX !== block.originX || calculatedBlockZ !== block.originZ) {
                attempts++;
                continue;
            }
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
 */
async function validateAndFixUserForest(db, userId, dryRun = false, forceGeometry = false) {
    const stats = { fixed: 0, deleted: 0, moved: 0, errors: [] };
    try {
        const existingTreesResult = await db.query(`SELECT COUNT(*) AS count FROM forest_trees WHERE user_id = $1`, [userId]);
        const existingCount = parseInt(existingTreesResult.rows[0].count, 10) || 0;
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
        if (existingCount === 0 && targetCount === 0) {
            return stats;
        }
        let isConsistent = false;
        if (existingCount === targetCount && targetCount > 0) {
            const treeTasksResult = await db.query(`SELECT task_id
           FROM forest_trees
          WHERE user_id = $1`, [userId]);
            const treeTaskIds = treeTasksResult.rows
                .map((row) => row.task_id)
                .filter((id) => !!id);
            const completedSet = new Set(completedTaskIds);
            const treeSet = new Set(treeTaskIds);
            const sameSize = completedSet.size === treeSet.size;
            const allMatch = sameSize &&
                [...completedSet].every((tid) => treeSet.has(tid));
            isConsistent = allMatch;
        }
        if (dryRun) {
            if (!isConsistent) {
                stats.deleted = existingCount;
                stats.moved = targetCount;
                stats.fixed = stats.deleted + stats.moved;
                if (existingCount > 0 || targetCount > 0) {
                    stats.errors.push(`Dry-run: would delete ${existingCount} existing tree(s) and recreate ${targetCount} tree(s) from completed tasks.`);
                }
            }
            const geometryDryRun = await fixTreeGeometryForUser(db, userId, true, forceGeometry);
            if (geometryDryRun.repositioned > 0) {
                stats.moved += geometryDryRun.repositioned;
                stats.fixed += geometryDryRun.repositioned;
                stats.errors.push(`Dry-run: would reposition ${geometryDryRun.repositioned} tree(s) to match current grid layout.`);
            }
            return stats;
        }
        if (!isConsistent) {
            await db.query('BEGIN');
            if (existingCount > 0) {
                await db.query(`DELETE FROM forest_trees WHERE user_id = $1`, [userId]);
                stats.deleted = existingCount;
            }
            for (const taskId of completedTaskIds) {
                await plantTree(userId, taskId);
                stats.moved += 1;
            }
            await db.query('COMMIT');
            stats.fixed = stats.deleted + stats.moved;
        }
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
    }
    return stats;
}
const jobStore = new Map();
/**
 * Run forest validation and fixing asynchronously.
 * Returns immediately with a job ID.
 */
export async function runForestValidation(dryRun, forceGeometry, userFilter) {
    const jobId = `validation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const jobStatus = {
        jobId,
        status: 'pending',
        progress: {
            currentUser: 0,
            totalUsers: 0,
        },
        startedAt: new Date(),
    };
    jobStore.set(jobId, jobStatus);
    // Run validation in background
    (async () => {
        const db = getPool();
        try {
            jobStatus.status = 'running';
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
            jobStatus.progress.totalUsers = totalUsers;
            if (totalUsers === 0) {
                jobStatus.status = 'completed';
                jobStatus.result = {
                    usersProcessed: 0,
                    totalFixed: 0,
                    totalDeleted: 0,
                    totalMoved: 0,
                    totalErrors: 0,
                    errors: userFilter
                        ? [`No users found matching filter "${userFilter}".`]
                        : ['No users found to validate.'],
                };
                jobStatus.completedAt = new Date();
                return;
            }
            let totalStats = {
                usersProcessed: 0,
                totalFixed: 0,
                totalDeleted: 0,
                totalMoved: 0,
                totalErrors: 0,
                errors: [],
            };
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                jobStatus.progress.currentUser = i + 1;
                jobStatus.progress.currentUserEmail = user.email || undefined;
                const stats = await validateAndFixUserForest(db, user.id, dryRun, forceGeometry);
                totalStats.usersProcessed++;
                totalStats.totalFixed += stats.fixed;
                totalStats.totalDeleted += stats.deleted;
                totalStats.totalMoved += stats.moved;
                totalStats.totalErrors += stats.errors.length;
                totalStats.errors.push(...stats.errors);
            }
            jobStatus.status = 'completed';
            jobStatus.result = totalStats;
            jobStatus.completedAt = new Date();
        }
        catch (error) {
            jobStatus.status = 'failed';
            jobStatus.error = error.message || 'Unknown error';
            jobStatus.completedAt = new Date();
        }
    })();
    return jobId;
}
/**
 * Get the status of a validation job.
 */
export function getValidationJobStatus(jobId) {
    return jobStore.get(jobId) || null;
}
/**
 * Clean up old completed jobs (older than 1 hour).
 */
export function cleanupOldJobs() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [jobId, job] of jobStore.entries()) {
        if (job.status === 'completed' || job.status === 'failed') {
            if (job.completedAt && job.completedAt < oneHourAgo) {
                jobStore.delete(jobId);
            }
        }
    }
}
//# sourceMappingURL=forestValidation.service.js.map