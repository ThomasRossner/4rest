import { getPool } from '../database/connection.js';

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
  const areaSpacing = 20; // match tile size to remove gaps between areas

  const areas = userIds.map((userId, i) => {
    const col = i % gridCols;
    const rowIdx = Math.floor(i / gridCols);
    const origin: [number, number, number] = [col * areaSpacing, 0, rowIdx * areaSpacing];
    return { userId, origin, trees: [] as any[] };
  });

  // Group trees by user and by the area block they belong to
  // Trees are stored with absolute positions, so we need to determine which area block they're in
  // This will automatically create new 20x20 blocks for trees outside the initially assigned blocks
  const userAreaBlocks = new Map<string, Map<string, { origin: [number, number, number]; trees: any[] }>>();
  
  const flatTrees: any[] = [];
  for (const row of result.rows) {
    // Skip trees for users not in the first N users (safety)
    if (!userToIndex.has(row.user_id)) continue;
    
    // Tree position is already absolute (stored in database as absolute)
    const absolutePosition: [number, number, number] = [
      parseFloat(row.position_x),
      parseFloat(row.position_y || 0),
      parseFloat(row.position_z),
    ];
    
    // Calculate which 20x20 area block this tree belongs to
    // Handle negative positions correctly: Math.floor rounds down, so -8/20 = -0.4 -> -1 -> -20
    const areaX = Math.floor(absolutePosition[0] / areaSpacing) * areaSpacing;
    const areaZ = Math.floor(absolutePosition[2] / areaSpacing) * areaSpacing;
    const areaKey = `${areaX},${areaZ}`;
    const areaOrigin: [number, number, number] = [areaX, 0, areaZ];
    
    // Calculate local position relative to the area block (within 0-20 range)
    const localPosition: [number, number, number] = [
      absolutePosition[0] - areaOrigin[0],
      absolutePosition[1] - areaOrigin[1],
      absolutePosition[2] - areaOrigin[2],
    ];
    
    const tree = {
      id: row.id,
      userId: row.user_id,
      treeType: row.tree_type,
      position: absolutePosition,
      localPosition,
      plantedAt: row.planted_at,
    };
    
    // Group by user and area block - this automatically creates new blocks for trees outside initial bounds
    if (!userAreaBlocks.has(row.user_id)) {
      userAreaBlocks.set(row.user_id, new Map());
    }
    const userAreas = userAreaBlocks.get(row.user_id)!;
    if (!userAreas.has(areaKey)) {
      // Create a new 20x20 block at this location
      userAreas.set(areaKey, { origin: areaOrigin, trees: [] });
    }
    userAreas.get(areaKey)!.trees.push(tree);
    flatTrees.push(tree);
  }
  
  // Create areas for all blocks that contain trees - this ensures all trees have their blocks rendered
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
  
  // Use expanded areas (which includes all blocks with trees) instead of just user primary areas
  // This ensures trees outside the initially assigned blocks get their own 20x20 blocks rendered
  const finalAreas = expandedAreas.length > 0 ? expandedAreas : areas;

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
      taskTitle: row.task_title,
    })),
    totalTrees: result.rows.length,
  };
}
