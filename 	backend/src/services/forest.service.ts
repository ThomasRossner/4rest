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
  let maxTreesForGrid = gridSize * gridSize * maxTreesPerBlock; // 4 * 6 = 24
  
  // Expand grid when all blocks are full
  // Note: We use > (not >=) so grid expands BEFORE reaching capacity
  // e.g., with 24 trees in 2x2, we stay at 2x2. At 25 trees, expand to 3x3
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

export async function getForestService() {
  const db = getPool();
  
  // Get all trees with anonymized user data
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
       u.id as user_id -- In production, this would be anonymized
     FROM forest_trees ft
     JOIN users u ON ft.user_id = u.id
     ORDER BY ft.planted_at DESC
     LIMIT 1000`
  );

  // Ensure every user has an area, even if they have no trees yet
  const usersResult = await db.query(
    `SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`
  );
  const userIds: string[] = usersResult.rows.map((r: any) => r.id);
  const userToIndex = new Map<string, number>();
  userIds.forEach((id, idx) => userToIndex.set(id, idx));

  const gridCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, userIds.length))));
  const areaSpacing = 20; // match tile size

  // Create primary area origins for each user
  const userPrimaryOrigins = new Map<string, [number, number, number]>();
  userIds.forEach((userId, i) => {
    const col = i % gridCols;
    const rowIdx = Math.floor(i / gridCols);
    const origin: [number, number, number] = [col * areaSpacing, 0, rowIdx * areaSpacing];
    userPrimaryOrigins.set(userId, origin);
  });

  // Group trees by user and calculate grid size for each user
  const userTrees = new Map<string, any[]>();
  const flatTrees: any[] = [];
  
  for (const row of result.rows) {
    if (!userToIndex.has(row.user_id)) continue;
    
    const absolutePosition: [number, number, number] = [
      parseFloat(row.position_x),
      parseFloat(row.position_y || 0),
      parseFloat(row.position_z),
    ];
    
    const tree = {
      id: row.id,
      userId: row.user_id,
      treeType: row.tree_type,
      position: absolutePosition,
      plantedAt: row.planted_at,
      growthPoints: row.growth_points || 1,
      stage: row.stage || 'sapling',
      size: parseFloat(row.size || 0.035),
    };
    
    if (!userTrees.has(row.user_id)) {
      userTrees.set(row.user_id, []);
    }
    userTrees.get(row.user_id)!.push(tree);
    flatTrees.push(tree);
  }

  // Generate blocks for each user based on their tree count (square grid layout)
  const userAreaBlocks = new Map<string, Map<string, { origin: [number, number, number]; trees: any[] }>>();
  
  for (const [userId, trees] of userTrees.entries()) {
    const primaryOrigin = userPrimaryOrigins.get(userId)!;
    const treeCount = trees.length;
    const maxTreesPerBlock = 6;
    
    // Calculate required grid size for this user's trees
    const gridSize = calculateGridSize(treeCount, maxTreesPerBlock);
    
    // Find all blocks that contain trees
    const treeBlockCoords: Array<{ x: number; z: number }> = [];
    for (const tree of trees) {
      const areaX = Math.floor(tree.position[0] / areaSpacing) * areaSpacing;
      const areaZ = Math.floor(tree.position[2] / areaSpacing) * areaSpacing;
      treeBlockCoords.push({ x: areaX, z: areaZ });
    }
    
    // Always start the grid from the primary origin (don't adjust based on tree positions)
    // This ensures consistent grid layout per user
    const gridStartX = primaryOrigin[0];
    const gridStartZ = primaryOrigin[2];
    
    // Generate all block origins for this grid (always square, starting from primary origin)
    const blockOrigins = generateBlockOrigins(
      gridStartX,
      gridStartZ,
      gridSize,
      areaSpacing
    );
    
    // Initialize blocks map for this user - ONLY include blocks from the strict square grid
    // This ensures we maintain the square layout (2x2, 3x3, 4x4, etc.)
    const blocksMap = new Map<string, { origin: [number, number, number]; trees: any[] }>();
    
    // Create all blocks in the square grid (from primary origin)
    // This is the ONLY blocks we'll show - strict square grid
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
        // This ensures we only show trees within the strict square grid layout
        continue;
      }
      
      // Calculate local position
      // Note: The frontend renders blocks centered at (0,0,0) with plane extending from -10 to +10
      // So we need to offset: if block origin is (areaX, 0, areaZ) and plane is centered there,
      // then a tree at absolute (x, y, z) should be at local (x - areaX, y, z - areaZ)
      // But since plane extends from -10 to +10, a tree at block corner (areaX, areaZ) 
      // should be at local position relative to the center: (0, 0, 0) is center, so corners are at (-10, 0, -10), (+10, 0, -10), etc.
      // Actually, the current calculation is correct for absolute positioning
      // The issue is that (0,0) local means center, not corner
      // For corners: top-left of block would be at (areaX, areaZ) absolute = (0, 0) local = center
      // We need: top-left corner absolute (areaX, areaZ) = local (-10, 0, -10)
      const localPosition: [number, number, number] = [
        (tree.position[0] - areaX) - 10, // Offset by -10 so (0,0) relative to block becomes (-10,0) local = top-left corner
        tree.position[1],
        (tree.position[2] - areaZ) - 10, // Offset by -10 so (0,0) relative to block becomes (0,0,-10) local = top corner
      ];
      
      const block = blocksMap.get(areaKey)!;
      block.trees.push({
        ...tree,
        localPosition,
      });
    }
    
    userAreaBlocks.set(userId, blocksMap);
  }

  // Create areas for all blocks in the calculated grid (including empty ones)
  // This ensures the square grid layout is always visible
  const expandedAreas: Array<{ userId: string; origin: [number, number, number]; trees: any[] }> = [];
  for (const [userId, areaBlocks] of userAreaBlocks.entries()) {
    for (const areaBlock of areaBlocks.values()) {
      expandedAreas.push({
        userId,
        origin: areaBlock.origin,
        trees: areaBlock.trees,
      });
    }
  }
  
  // For users without trees, don't create empty blocks
  // Users will get blocks when they plant their first tree
  // This reduces clutter in the visualization

  const finalAreas = expandedAreas;

  return {
    areas: finalAreas,
    trees: flatTrees, // backwards-compatible flat list
    totalTrees: flatTrees.length,
    totalAreas: finalAreas.length,
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
