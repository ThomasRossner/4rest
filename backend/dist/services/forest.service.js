import { getPool } from '../database/connection.js';
import { FOREST_AREA_SPACING, } from './forestLayout.js';
/**
 * Get forest data for a specific user
 * Each user has their own unique forest with trees positioned in a grid layout
 */
export async function getForestService(userId) {
    const db = getPool();
    // Get all trees for this specific user
    const result = await db.query(`SELECT 
       ft.id,
       ft.tree_type,
       ft.position_x,
       ft.position_y,
       ft.position_z,
       ft.planted_at,
       ft.growth_points,
       ft.stage,
       ft.size
     FROM forest_trees ft
     WHERE ft.user_id = $1
     ORDER BY ft.planted_at DESC`, [userId]);
    // Get user index to calculate primary origin
    const usersResult = await db.query(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`);
    const userIds = usersResult.rows.map((r) => r.id);
    const userIndex = userIds.indexOf(userId);
    if (userIndex === -1) {
        // User not found, return empty forest
        return {
            areas: [],
            trees: [],
            totalTrees: 0,
            totalAreas: 0,
        };
    }
    const areaSpacing = FOREST_AREA_SPACING; // match tile size
    const gridCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, userIds.length))));
    // Calculate primary origin for this user
    const col = userIndex % gridCols;
    const rowIdx = Math.floor(userIndex / gridCols);
    const primaryOrigin = [col * areaSpacing, 0, rowIdx * areaSpacing];
    // Process trees
    const trees = [];
    for (const row of result.rows) {
        const absolutePosition = [
            parseFloat(row.position_x),
            parseFloat(row.position_y || 0),
            parseFloat(row.position_z),
        ];
        trees.push({
            id: row.id,
            treeType: row.tree_type,
            position: absolutePosition,
            plantedAt: row.planted_at,
            growthPoints: row.growth_points || 1,
            stage: row.stage || 'sapling',
            size: parseFloat(row.size || 0.035),
        });
    }
    // First, collect all blocks that actually contain trees and store tree block info
    const actualBlocksSet = new Set();
    const treeBlockInfo = new Map();
    for (const tree of trees) {
        const areaX = Math.floor(tree.position[0] / areaSpacing) * areaSpacing;
        const areaZ = Math.floor(tree.position[2] / areaSpacing) * areaSpacing;
        const areaKey = `${areaX},${areaZ}`;
        actualBlocksSet.add(areaKey);
        // Store block info with tree to avoid recalculating later
        if (!treeBlockInfo.has(tree.id)) {
            treeBlockInfo.set(tree.id, { areaX, areaZ, areaKey });
        }
    }
    // Calculate the grid size needed to include all blocks with trees
    // Find the min/max block coordinates relative to primary origin
    let minBlockX = Infinity;
    let maxBlockX = -Infinity;
    let minBlockZ = Infinity;
    let maxBlockZ = -Infinity;
    for (const blockKey of actualBlocksSet) {
        const [x, z] = blockKey.split(',').map(Number);
        minBlockX = Math.min(minBlockX, x);
        maxBlockX = Math.max(maxBlockX, x);
        minBlockZ = Math.min(minBlockZ, z);
        maxBlockZ = Math.max(maxBlockZ, z);
    }
    // Initialize blocks map - start with all blocks that actually contain trees
    const blocksMap = new Map();
    // Add all blocks that contain trees - this ensures ALL trees are included
    for (const blockKey of actualBlocksSet) {
        const [x, z] = blockKey.split(',').map(Number);
        blocksMap.set(blockKey, { origin: [x, 0, z], trees: [] });
    }
    // Optionally: Add empty blocks in a grid around the trees for better visualization
    // This is optional - the important part is that all blocks with trees are included above
    if (actualBlocksSet.size > 0 && minBlockX !== Infinity) {
        // Calculate a square grid that covers all tree blocks
        const minGridCol = Math.floor((minBlockX - primaryOrigin[0]) / areaSpacing);
        const maxGridCol = Math.floor((maxBlockX - primaryOrigin[0]) / areaSpacing);
        const minGridRow = Math.floor((minBlockZ - primaryOrigin[2]) / areaSpacing);
        const maxGridRow = Math.floor((maxBlockZ - primaryOrigin[2]) / areaSpacing);
        // Calculate grid size needed
        const treeGridCols = maxGridCol - minGridCol + 1;
        const treeGridRows = maxGridRow - minGridRow + 1;
        const gridSize = Math.max(treeGridCols, treeGridRows);
        // Generate block origins for a grid that covers the tree blocks
        // Use the actual min/max bounds, not a centered grid
        const startX = primaryOrigin[0] + minGridCol * areaSpacing;
        const startZ = primaryOrigin[2] + minGridRow * areaSpacing;
        // Add all blocks in the bounding grid (including empty ones)
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const blockX = startX + col * areaSpacing;
                const blockZ = startZ + row * areaSpacing;
                const areaKey = `${blockX},${blockZ}`;
                // Only add if it doesn't already exist (trees are already added above)
                if (!blocksMap.has(areaKey)) {
                    blocksMap.set(areaKey, { origin: [blockX, 0, blockZ], trees: [] });
                }
            }
        }
    }
    // Assign trees to blocks based on their positions
    // Include ALL trees, even if they're in blocks outside the "expected" grid
    // Reuse pre-calculated block info to avoid duplicate calculations
    for (const tree of trees) {
        let blockInfo = treeBlockInfo.get(tree.id);
        if (!blockInfo) {
            // Fallback: calculate if not found (shouldn't happen, but safe)
            const areaX = Math.floor(tree.position[0] / areaSpacing) * areaSpacing;
            const areaZ = Math.floor(tree.position[2] / areaSpacing) * areaSpacing;
            const areaKey = `${areaX},${areaZ}`;
            blockInfo = { areaX, areaZ, areaKey };
        }
        const { areaX, areaZ, areaKey } = blockInfo;
        // Get or create the block
        if (!blocksMap.has(areaKey)) {
            blocksMap.set(areaKey, { origin: [areaX, 0, areaZ], trees: [] });
        }
        // Calculate local position relative to block origin
        // Frontend calculates world position as: origin + localPosition
        // So localPosition should be: tree.position - blockOrigin
        // This ensures trees appear at their correct absolute positions
        const localPosition = [
            tree.position[0] - areaX, // Position relative to block origin (0-20 range)
            tree.position[1],
            tree.position[2] - areaZ, // Position relative to block origin (0-20 range)
        ];
        const block = blocksMap.get(areaKey);
        block.trees.push({
            ...tree,
            localPosition,
        });
    }
    // Create areas for all blocks (including empty ones)
    const expandedAreas = [];
    let totalTreesInAreas = 0;
    const blocksWithTrees = [];
    for (const areaBlock of blocksMap.values()) {
        expandedAreas.push({
            origin: areaBlock.origin,
            trees: areaBlock.trees,
        });
        totalTreesInAreas += areaBlock.trees.length;
        if (areaBlock.trees.length > 0) {
            blocksWithTrees.push({
                origin: `${areaBlock.origin[0]},${areaBlock.origin[2]}`,
                count: areaBlock.trees.length,
            });
        }
    }
    // Verify all trees are included in areas (only log on mismatch)
    if (totalTreesInAreas !== trees.length) {
        console.warn(`Forest service (userId: ${userId}): Tree count mismatch! Total trees: ${trees.length}, Trees in areas: ${totalTreesInAreas}. ` +
            `Blocks with trees: ${blocksWithTrees.length}. This may indicate trees in blocks outside the calculated grid.`);
    }
    return {
        areas: expandedAreas,
        trees: trees, // backwards-compatible flat list
        totalTrees: trees.length,
        totalAreas: expandedAreas.length,
    };
}
export async function getUserForestService(userId) {
    const db = getPool();
    const result = await db.query(`SELECT 
       ft.id,
       ft.tree_type,
       ft.position_x,
       ft.position_y,
       ft.position_z,
       ft.planted_at,
       ft.growth_points,
       ft.stage,
       ft.size,
       t.title as task_title
     FROM forest_trees ft
     LEFT JOIN tasks t ON ft.task_id = t.id
     WHERE ft.user_id = $1
     ORDER BY ft.planted_at DESC`, [userId]);
    return {
        trees: result.rows.map((row) => ({
            id: row.id,
            treeType: row.tree_type,
            position: [row.position_x, row.position_y, row.position_z],
            plantedAt: row.planted_at,
            growthPoints: row.growth_points || 1,
            stage: row.stage || 'sapling',
            size: parseFloat(row.size || 0.035),
            taskTitle: row.task_title,
        })),
        totalTrees: result.rows.length,
    };
}
/**
 * Get aggregated forest statistics for all users.
 * Used for admin/debug views so we can avoid manual psql inspection.
 */
export async function getForestStatsService() {
    const db = getPool();
    const result = await db.query(`WITH tree_counts AS (
       SELECT user_id, COUNT(*) AS tree_count
       FROM forest_trees
       GROUP BY user_id
     ),
     completed_counts AS (
       SELECT user_id, COUNT(*) AS completed_tasks
       FROM user_tasks
       WHERE completed_at IS NOT NULL
         AND task_id IS NOT NULL
       GROUP BY user_id
     )
     SELECT
       u.id,
       u.email,
       u.points,
       COALESCE(tc.tree_count, 0) AS tree_count,
       COALESCE(cc.completed_tasks, 0) AS completed_tasks
     FROM users u
     LEFT JOIN tree_counts tc ON tc.user_id = u.id
     LEFT JOIN completed_counts cc ON cc.user_id = u.id
     ORDER BY u.created_at ASC`);
    // Add a simple consistency flag based on counts (not full task_id set comparison)
    const rowsWithConsistency = result.rows.map((row) => ({
        ...row,
        is_count_consistent: Number(row.tree_count) === Number(row.completed_tasks),
    }));
    return rowsWithConsistency;
}
//# sourceMappingURL=forest.service.js.map