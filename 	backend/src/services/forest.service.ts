import { getPool } from '../database/connection.js';
import {
  FOREST_AREA_SPACING,
  FOREST_MAX_TREES_PER_BLOCK,
  calculateGridSize,
  generateBlockOrigins,
} from './forestLayout.js';

/**
 * Get forest data for a specific user
 * Each user has their own unique forest with trees positioned in a grid layout
 */
export async function getForestService(userId: string) {
  const db = getPool();
  
  // Get all trees for this specific user
  const result = await db.query(
    `SELECT 
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
     ORDER BY ft.planted_at DESC`,
    [userId]
  );

  // Get user index to calculate primary origin
  const usersResult = await db.query(
    `SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`
  );
  const userIds: string[] = usersResult.rows.map((r: any) => r.id);
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
  const primaryOrigin: [number, number, number] = [col * areaSpacing, 0, rowIdx * areaSpacing];

  // Process trees
  const trees: any[] = [];
  for (const row of result.rows) {
    const absolutePosition: [number, number, number] = [
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

  // Calculate required grid size for this user's trees
  const treeCount = trees.length;
  const maxTreesPerBlock = FOREST_MAX_TREES_PER_BLOCK;
  const gridSize = calculateGridSize(treeCount, maxTreesPerBlock);
  
  // Generate all block origins for this grid (always square, starting from primary origin)
  const blockOrigins = generateBlockOrigins(
    primaryOrigin[0],
    primaryOrigin[2],
    gridSize,
    areaSpacing
  );
  
  // Initialize blocks map - ONLY include blocks from the strict square grid
  const blocksMap = new Map<string, { origin: [number, number, number]; trees: any[] }>();
  
  // Create all blocks in the square grid (from primary origin)
  for (const blockOrigin of blockOrigins) {
    const areaKey = `${blockOrigin.x},${blockOrigin.z}`;
    blocksMap.set(areaKey, { origin: [blockOrigin.x, 0, blockOrigin.z], trees: [] });
  }
  
  // Assign trees to blocks based on their positions
  // Only assign trees that are in blocks that are part of the square grid
  for (const tree of trees) {
    const areaX = Math.floor(tree.position[0] / areaSpacing) * areaSpacing;
    const areaZ = Math.floor(tree.position[2] / areaSpacing) * areaSpacing;
    const areaKey = `${areaX},${areaZ}`;
    
    // Only assign tree if its block is part of the square grid
    if (!blocksMap.has(areaKey)) {
      // Tree is outside the square grid - skip it
      continue;
    }
    
    // Calculate local position relative to block center
    const localPosition: [number, number, number] = [
      (tree.position[0] - areaX) - 10, // Offset by -10 so (0,0) relative to block becomes (-10,0) local
      tree.position[1],
      (tree.position[2] - areaZ) - 10, // Offset by -10 so (0,0) relative to block becomes (0,0,-10) local
    ];
    
    const block = blocksMap.get(areaKey)!;
    block.trees.push({
      ...tree,
      localPosition,
    });
  }

  // Create areas for all blocks in the calculated grid (including empty ones)
  const expandedAreas: Array<{ origin: [number, number, number]; trees: any[] }> = [];
  for (const areaBlock of blocksMap.values()) {
    expandedAreas.push({
      origin: areaBlock.origin,
      trees: areaBlock.trees,
    });
  }

  return {
    areas: expandedAreas,
    trees: trees, // backwards-compatible flat list
    totalTrees: trees.length,
    totalAreas: expandedAreas.length,
  };
}

export async function getUserForestService(userId: string) {
  const db = getPool();
  
  const result = await db.query(
    `SELECT 
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
     ORDER BY ft.planted_at DESC`,
    [userId]
  );

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

  const result = await db.query(
    `WITH tree_counts AS (
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
     ORDER BY u.created_at ASC`
  );

  // Add a simple consistency flag based on counts (not full task_id set comparison)
  const rowsWithConsistency = result.rows.map((row: any) => ({
    ...row,
    is_count_consistent: Number(row.tree_count) === Number(row.completed_tasks),
  }));

  return rowsWithConsistency;
}
