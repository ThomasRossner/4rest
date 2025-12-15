import { getPool } from '../database/connection.js';

/**
 * Calculate tree stage based on growth points
 * Sapling: 1-20, Young: 21-50, Mature: 51-100
 */
function calculateStage(growthPoints: number): 'sapling' | 'young' | 'mature' {
  if (growthPoints >= 51) return 'mature';
  if (growthPoints >= 21) return 'young';
  return 'sapling';
}

/**
 * Generate random size for a given stage
 * Sapling: 0.02-0.05, Young: 0.10-0.15, Mature: 0.20-0.30
 */
function generateSizeForStage(stage: 'sapling' | 'young' | 'mature'): number {
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

/**
 * Calculate the required grid size for blocks based on tree count
 * Each block can hold max 8 trees
 * Grid sizes: 2x2 (4 blocks, 32 trees max), 3x3 (9 blocks, 72 trees max), 4x4 (16 blocks, 128 trees max), etc.
 */
function calculateGridSize(treeCount: number, maxTreesPerBlock: number = 8): number {
  if (treeCount === 0) return 2; // Default 2x2 grid
  
  // Start with 2x2 (4 blocks)
  let gridSize = 2;
  let maxTreesForGrid = gridSize * gridSize * maxTreesPerBlock;
  
  // Expand grid when all blocks are full
  while (treeCount > maxTreesForGrid) {
    gridSize++;
    maxTreesForGrid = gridSize * gridSize * maxTreesPerBlock;
  }
  
  return gridSize;
}

/**
 * Generate block origins for a square grid centered around [0,0]
 * Returns array of block origins in row-major order
 * Block [0,0] will always be at the center (or near-center for even-sized grids)
 */
function generateBlockOrigins(
  primaryOriginX: number,
  primaryOriginZ: number,
  gridSize: number,
  areaSpacing: number
): Array<{ x: number; z: number }> {
  const blocks: Array<{ x: number; z: number }> = [];
  
  // Calculate offset to center the grid around [0,0]
  // For odd grids (3x3, 5x5): center block is at [0,0]
  // For even grids (2x2, 4x4): [0,0] is in one of the center blocks
  // Formula: centerOffset = Math.floor(-(gridSize - 1) / 2) * areaSpacing
  // This ensures blocks align to areaSpacing boundaries and [0,0] is centered
  const centerOffset = Math.floor(-(gridSize - 1) / 2) * areaSpacing;
  
  // Start from the calculated center offset, relative to primary origin
  const startX = primaryOriginX + centerOffset;
  const startZ = primaryOriginZ + centerOffset;
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      blocks.push({
        x: startX + col * areaSpacing,
        z: startZ + row * areaSpacing,
      });
    }
  }
  
  return blocks;
}

export async function addUserPoints(userId: string, points: number) {
  const db = getPool();
  await db.query(
    'UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [points, userId]
  );
}

export async function plantTree(userId: string, taskId: string) {
  const db = getPool();
  
  // Calculate user's primary area origin
  const usersResult = await db.query(
    `SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`
  );
  const userIds: string[] = usersResult.rows.map((r: any) => r.id);
  const userIndex = userIds.indexOf(userId);
  
  if (userIndex === -1) {
    // Fallback: use simple random position
    const positionX = (Math.random() - 0.5) * 20;
    const positionZ = (Math.random() - 0.5) * 20;
    const initialStage = 'sapling';
    const initialGrowthPoints = 1;
    const initialSize = generateSizeForStage(initialStage);
    
    const insertResult = await db.query(
      `INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z, growth_points, stage, size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, taskId, positionX, 0, positionZ, initialGrowthPoints, initialStage, initialSize]
    );
    
    return insertResult.rows[0].id as string;
  }
  
  const areaSpacing = 20;
  const gridCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, userIds.length))));
  const col = userIndex % gridCols;
  const rowIdx = Math.floor(userIndex / gridCols);
  const primaryAreaOriginX = col * areaSpacing;
  const primaryAreaOriginZ = rowIdx * areaSpacing;
  
  // Get current tree count for this user
  const treeCountResult = await db.query(
    `SELECT COUNT(*) as count FROM forest_trees WHERE user_id = $1`,
    [userId]
  );
  const currentTreeCount = parseInt(treeCountResult.rows[0].count);
  
  // Calculate required grid size (includes the tree we're about to add)
  const maxTreesPerBlock = 8;
  const gridSize = calculateGridSize(currentTreeCount + 1, maxTreesPerBlock);
  
  // Generate all block origins for this grid
  const blockOrigins = generateBlockOrigins(
    primaryAreaOriginX,
    primaryAreaOriginZ,
    gridSize,
    areaSpacing
  );
  
  // Get tree counts per block
  const blockCounts = await db.query(
    `SELECT 
       FLOOR(position_x / 20.0) * 20 as block_x,
       FLOOR(position_z / 20.0) * 20 as block_z,
       COUNT(*) as tree_count
     FROM forest_trees
     WHERE user_id = $1
     GROUP BY FLOOR(position_x / 20.0) * 20, FLOOR(position_z / 20.0) * 20`,
    [userId]
  );
  
  const blockCountMap = new Map<string, number>();
  blockCounts.rows.forEach((row: any) => {
    const key = `${row.block_x},${row.block_z}`;
    blockCountMap.set(key, parseInt(row.tree_count));
  });
  
  // Find available blocks (less than 8 trees) from the generated grid
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
  
  // Sort by tree count (ascending) to prefer less populated blocks
  candidateBlocks.sort((a, b) => a.count - b.count);
  
  // Select a block
  const minCount = candidateBlocks[0].count;
  const bestBlocks = candidateBlocks.filter(b => b.count === minCount);
  const selectedBlock = bestBlocks[Math.floor(Math.random() * bestBlocks.length)];
  
  // Generate position within selected block
  const edgePadding = 0.5;
  const minDistance = 1.5;
  const blockMinX = selectedBlock.x + edgePadding;
  const blockMaxX = selectedBlock.x + areaSpacing - edgePadding;
  const blockMinZ = selectedBlock.z + edgePadding;
  // Block max Z should be within the block boundaries, but avoid going into next block
  // Use gridSize to calculate the actual max Z for the entire grid
  const gridMaxZ = primaryAreaOriginZ + areaSpacing * gridSize - 0.001;
  const blockMaxZ = Math.min(
    selectedBlock.z + areaSpacing - edgePadding,
    gridMaxZ - edgePadding
  );
  
  let absoluteX: number;
  let absoluteZ: number;
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
    
    // Check for conflicts
    const conflictCheck = await db.query(
      `SELECT COUNT(*) as count 
       FROM forest_trees 
       WHERE user_id = $1 
         AND ABS(position_x - $2) < $3 
         AND ABS(position_z - $4) < $3`,
      [userId, absoluteX, minDistance, absoluteZ]
    );
    
    if (parseInt(conflictCheck.rows[0].count) === 0) {
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

  const insertResult = await db.query(
    `INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z, growth_points, stage, size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [userId, taskId, absoluteX, 0, absoluteZ, initialGrowthPoints, initialStage, initialSize]
  );
  
  return insertResult.rows[0].id as string;
}

/**
 * Add growth points to a random existing tree (not newly planted ones)
 * Used when user completes tasks - task points go to random tree growth
 */
export async function addGrowthPointsToRandomTree(userId: string, points: number, excludeTreeId?: string) {
  const db = getPool();
  
  // Get all existing trees for user (excluding the newly planted one if provided)
  let query = `SELECT id, growth_points, stage, size FROM forest_trees WHERE user_id = $1`;
  const params: any[] = [userId];
  
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
  const newGrowthPoints = selectedTree.growth_points + points;
  const newStage = calculateStage(newGrowthPoints);
  const currentStage = selectedTree.stage;
  
  // If stage changed, generate new random size for the new stage
  let newSize = parseFloat(selectedTree.size);
  if (newStage !== currentStage) {
    newSize = generateSizeForStage(newStage);
  }
  
  // Update the tree
  await db.query(
    `UPDATE forest_trees 
     SET growth_points = $1, stage = $2, size = $3 
     WHERE id = $4`,
    [newGrowthPoints, newStage, newSize, selectedTree.id]
  );
}

/**
 * Process daily forest visit - adds 1 growth point to all user's trees
 * Returns true if visit was successful (first visit today), false if already visited
 */
export async function processDailyForestVisit(userId: string): Promise<boolean> {
  const db = getPool();
  
  try {
    // Try to insert today's visit record
    await db.query(
      `INSERT INTO daily_forest_visits (user_id, visit_date) 
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT (user_id, visit_date) DO NOTHING`,
      [userId]
    );
    
    // Check if this was a new visit (rows affected)
    const checkResult = await db.query(
      `SELECT COUNT(*) as count FROM daily_forest_visits 
       WHERE user_id = $1 AND visit_date = CURRENT_DATE`,
      [userId]
    );
    
    // If visit was recorded, add growth points to all trees
    if (parseInt(checkResult.rows[0].count) > 0) {
      // Get all trees for this user
      const treesResult = await db.query(
        `SELECT id, growth_points, stage, size FROM forest_trees WHERE user_id = $1`,
        [userId]
      );
      
      // Update each tree
      for (const tree of treesResult.rows) {
        const newGrowthPoints = tree.growth_points + 1;
        const newStage = calculateStage(newGrowthPoints);
        const currentStage = tree.stage;
        
        // If stage changed, generate new random size
        let newSize = parseFloat(tree.size);
        if (newStage !== currentStage) {
          newSize = generateSizeForStage(newStage);
        }
        
        await db.query(
          `UPDATE forest_trees 
           SET growth_points = $1, stage = $2, size = $3 
           WHERE id = $4`,
          [newGrowthPoints, newStage, newSize, tree.id]
        );
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error processing daily forest visit:', error);
    return false;
  }
}

/**
 * Check if user has visited forest today
 */
export async function hasVisitedForestToday(userId: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query(
    `SELECT COUNT(*) as count FROM daily_forest_visits 
     WHERE user_id = $1 AND visit_date = CURRENT_DATE`,
    [userId]
  );
  return parseInt(result.rows[0].count) > 0;
}
