import { getPool } from '../database/connection.js';
import { FOREST_AREA_SPACING, FOREST_MAX_TREES_PER_BLOCK, calculateGridSize, generateBlockOrigins, } from './forestLayout.js';
/**
 * Calculate tree stage based on growth points
 * Sapling: 1-20, Young: 21-50, Mature: 51-100
 */
function calculateStage(growthPoints) {
    if (growthPoints >= 51)
        return 'mature';
    if (growthPoints >= 21)
        return 'young';
    return 'sapling';
}
/**
 * Generate random size for a given stage
 * Sapling: 0.02-0.05, Young: 0.10-0.15, Mature: 0.20-0.30
 */
function generateSizeForStage(stage) {
    switch (stage) {
        case 'sapling':
            return 0.02 + Math.random() * (0.05 - 0.02); // 0.02 to 0.05
        case 'young':
            return 0.10 + Math.random() * (0.15 - 0.10); // 0.10 to 0.15
        case 'mature':
            return 0.20 + Math.random() * (0.30 - 0.20); // 0.20 to 0.30
        default:
            return 0.035;
    }
}
// calculateGridSize and generateBlockOrigins are now imported from forestLayout.ts
export async function addUserPoints(userId, points) {
    const db = getPool();
    await db.query('UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [points, userId]);
}
export async function plantTree(userId, taskId) {
    const db = getPool();
    // Calculate user's primary area origin
    const usersResult = await db.query(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`);
    const userIds = usersResult.rows.map((r) => r.id);
    const userIndex = userIds.indexOf(userId);
    if (userIndex === -1) {
        // Fallback: use simple random position
        const positionX = (Math.random() - 0.5) * 12; // Updated to match new areaSpacing
        const positionZ = (Math.random() - 0.5) * 12; // Updated to match new areaSpacing
        const initialStage = 'sapling';
        const initialGrowthPoints = 1;
        const initialSize = generateSizeForStage(initialStage);
        const insertResult = await db.query(`INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z, growth_points, stage, size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`, [userId, taskId, positionX, 0, positionZ, initialGrowthPoints, initialStage, initialSize]);
        return insertResult.rows[0].id;
    }
    const areaSpacing = FOREST_AREA_SPACING;
    const gridCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, userIds.length))));
    const col = userIndex % gridCols;
    const rowIdx = Math.floor(userIndex / gridCols);
    const primaryAreaOriginX = col * areaSpacing;
    const primaryAreaOriginZ = rowIdx * areaSpacing;
    // Get current tree count for this user
    const treeCountResult = await db.query(`SELECT COUNT(*) as count FROM forest_trees WHERE user_id = $1`, [userId]);
    const currentTreeCount = parseInt(treeCountResult.rows[0].count);
    // Calculate required grid size (includes the tree we're about to add)
    const maxTreesPerBlock = FOREST_MAX_TREES_PER_BLOCK;
    const gridSize = calculateGridSize(currentTreeCount + 1, maxTreesPerBlock);
    // Generate all block origins for this grid
    const blockOrigins = generateBlockOrigins(primaryAreaOriginX, primaryAreaOriginZ, gridSize, FOREST_AREA_SPACING);
    // Get tree counts per block
    const blockCounts = await db.query(`SELECT 
       FLOOR(position_x / $2) * $2 as block_x,
       FLOOR(position_z / $2) * $2 as block_z,
       COUNT(*) as tree_count
     FROM forest_trees
     WHERE user_id = $1
     GROUP BY FLOOR(position_x / $2) * $2, FLOOR(position_z / $2) * $2`, [userId, areaSpacing]);
    const blockCountMap = new Map();
    blockCounts.rows.forEach((row) => {
        const key = `${row.block_x},${row.block_z}`;
        blockCountMap.set(key, parseInt(row.tree_count));
    });
    // Find available blocks (less than maxTreesPerBlock trees) from the generated grid
    // Prefer blocks that already have trees (to keep forests compact)
    const availableBlocks = blockOrigins
        .map((block) => {
        const key = `${block.x},${block.z}`;
        return {
            x: block.x,
            z: block.z,
            count: blockCountMap.get(key) || 0,
        };
    })
        .filter((block) => block.count < maxTreesPerBlock);
    // If all blocks are full, this shouldn't happen (grid should expand), but handle it
    const candidateBlocks = availableBlocks.length > 0
        ? availableBlocks
        : blockOrigins.map((block) => ({
            x: block.x,
            z: block.z,
            count: blockCountMap.get(`${block.x},${block.z}`) || 0,
        }));
    // Sort by tree count (descending) to prefer blocks that already have trees
    // This keeps forests compact - fill existing blocks before creating new ones
    candidateBlocks.sort((a, b) => b.count - a.count);
    // Select a block - prefer blocks with most trees (but not full)
    const maxCount = candidateBlocks[0].count;
    const bestBlocks = candidateBlocks.filter(b => b.count === maxCount);
    const selectedBlock = bestBlocks[Math.floor(Math.random() * bestBlocks.length)];
    // Generate position within selected block
    // Increased edgePadding to keep trees in a smaller area within each block
    const edgePadding = 2.0; // Increased from 0.5 to 2.0
    const minDistance = 1.2; // Slightly reduced from 1.5 to allow closer placement
    const blockMinX = selectedBlock.x + edgePadding;
    const blockMaxX = selectedBlock.x + areaSpacing - edgePadding;
    const blockMinZ = selectedBlock.z + edgePadding;
    // Block max Z should be within the block boundaries, but avoid going into next block
    // Use gridSize to calculate the actual max Z for the entire grid
    const gridMaxZ = primaryAreaOriginZ + areaSpacing * gridSize - 0.001;
    const blockMaxZ = Math.min(selectedBlock.z + areaSpacing - edgePadding, gridMaxZ - edgePadding);
    // Load existing tree positions in this block once to avoid a DB roundtrip per attempt.
    const existingTreesInBlock = await db.query(`SELECT position_x, position_z
     FROM forest_trees
     WHERE user_id = $1
       AND position_x >= $2 AND position_x < $3
       AND position_z >= $4 AND position_z < $5`, [userId, selectedBlock.x, selectedBlock.x + areaSpacing, selectedBlock.z, selectedBlock.z + areaSpacing]);
    const existingPositions = existingTreesInBlock.rows.map((row) => ({
        x: Number(row.position_x),
        z: Number(row.position_z),
    }));
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
        if (calculatedBlockX !== selectedBlock.x || calculatedBlockZ !== selectedBlock.z) {
            attempts++;
            continue;
        }
        // Check conflicts in-memory (fast path).
        const hasConflict = existingPositions.some((pos) => Math.abs(pos.x - absoluteX) < minDistance &&
            Math.abs(pos.z - absoluteZ) < minDistance);
        if (!hasConflict) {
            break;
        }
        attempts++;
    } while (attempts < maxAttempts);
    // If no valid position found, use block center
    if (attempts >= maxAttempts) {
        absoluteX = selectedBlock.x + areaSpacing / 2;
        absoluteZ = selectedBlock.z + areaSpacing / 2;
        absoluteX = Math.max(blockMinX, Math.min(absoluteX, blockMaxX));
        absoluteZ = Math.max(blockMinZ, Math.min(absoluteZ, blockMaxZ));
    }
    // Initialize new tree with sapling stage, 1 growth point, and random size
    const initialStage = 'sapling';
    const initialGrowthPoints = 1;
    const initialSize = generateSizeForStage(initialStage);
    const insertResult = await db.query(`INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z, growth_points, stage, size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`, [userId, taskId, absoluteX, 0, absoluteZ, initialGrowthPoints, initialStage, initialSize]);
    return insertResult.rows[0].id;
}
/**
 * Add growth points to a random existing tree (not newly planted ones)
 * Used when user completes tasks - task points go to random tree growth
 */
export async function addGrowthPointsToRandomTree(userId, points, excludeTreeId) {
    const db = getPool();
    // Get all existing trees for user (excluding the newly planted one if provided)
    let query = `SELECT id, growth_points, stage, size FROM forest_trees WHERE user_id = $1`;
    const params = [userId];
    if (excludeTreeId) {
        query += ` AND id != $2`;
        params.push(excludeTreeId);
    }
    const result = await db.query(query, params);
    if (result.rows.length === 0) {
        // No existing trees to add growth points to
        return;
    }
    // Select a random tree
    const randomIndex = Math.floor(Math.random() * result.rows.length);
    const selectedTree = result.rows[randomIndex];
    // Calculate new growth points and check if stage changes
    const newGrowthPoints = parseInt(selectedTree.growth_points) + points;
    const newStage = calculateStage(newGrowthPoints);
    const currentStage = selectedTree.stage;
    // If stage changed, generate new random size for the new stage
    let newSize = parseFloat(selectedTree.size);
    if (newStage !== currentStage) {
        newSize = generateSizeForStage(newStage);
    }
    // Update the tree
    await db.query(`UPDATE forest_trees 
     SET growth_points = $1, stage = $2, size = $3 
     WHERE id = $4`, [newGrowthPoints, newStage, newSize, selectedTree.id]);
}
/**
 * Process daily forest visit - adds 1 growth point to all user's trees
 * Returns true if visit was successful (first visit today), false if already visited
 */
export async function processDailyForestVisit(userId) {
    const db = getPool();
    try {
        // Try to insert today's visit record
        await db.query(`INSERT INTO daily_forest_visits (user_id, visit_date) 
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT (user_id, visit_date) DO NOTHING`, [userId]);
        // Check if this was a new visit (rows affected)
        const checkResult = await db.query(`SELECT COUNT(*) as count FROM daily_forest_visits 
       WHERE user_id = $1 AND visit_date = CURRENT_DATE`, [userId]);
        // If visit was recorded, add growth points to all trees
        if (parseInt(checkResult.rows[0].count) > 0) {
            // Get all trees for this user
            const treesResult = await db.query(`SELECT id, growth_points, stage, size FROM forest_trees WHERE user_id = $1`, [userId]);
            // Update each tree
            for (const tree of treesResult.rows) {
                const newGrowthPoints = parseInt(tree.growth_points) + 1;
                const newStage = calculateStage(newGrowthPoints);
                const currentStage = tree.stage;
                // If stage changed, generate new random size
                let newSize = parseFloat(tree.size);
                if (newStage !== currentStage) {
                    newSize = generateSizeForStage(newStage);
                }
                await db.query(`UPDATE forest_trees 
           SET growth_points = $1, stage = $2, size = $3 
           WHERE id = $4`, [newGrowthPoints, newStage, newSize, tree.id]);
            }
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Error processing daily forest visit:', error);
        return false;
    }
}
/**
 * Check if user has visited forest today
 */
export async function hasVisitedForestToday(userId) {
    const db = getPool();
    const result = await db.query(`SELECT COUNT(*) as count FROM daily_forest_visits 
     WHERE user_id = $1 AND visit_date = CURRENT_DATE`, [userId]);
    return parseInt(result.rows[0].count) > 0;
}
//# sourceMappingURL=gamification.service.js.map