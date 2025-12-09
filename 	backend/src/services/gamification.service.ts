import { getPool } from '../database/connection.js';

/**
 * Calculate the required grid size for blocks based on tree count
 * Each block can hold max 6 trees
 * Grid sizes: 2x2 (4 blocks, 24 trees max), 3x3 (9 blocks, 54 trees max), 4x4 (16 blocks, 96 trees max), etc.
 */
function calculateGridSize(treeCount: number, maxTreesPerBlock: number = 6): number {
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
 * Generate block origins for a square grid starting from a primary area origin
 * Returns array of block origins in row-major order
 */
function generateBlockOrigins(
  primaryOriginX: number,
  primaryOriginZ: number,
  gridSize: number,
  areaSpacing: number
): Array<{ x: number; z: number }> {
  const blocks: Array<{ x: number; z: number }> = [];
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      blocks.push({
        x: primaryOriginX + col * areaSpacing,
        z: primaryOriginZ + row * areaSpacing,
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
    await db.query(
      `INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, taskId, positionX, 0, positionZ]
    );
    return;
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
  const maxTreesPerBlock = 6;
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
  
  // Find available blocks (less than 6 trees) from the generated grid
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
  const edgePadding = 2.0;
  const minDistance = 1.0;
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
  
  await db.query(
    `INSERT INTO forest_trees (user_id, task_id, position_x, position_y, position_z)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, taskId, absoluteX, 0, absoluteZ]
  );
}
