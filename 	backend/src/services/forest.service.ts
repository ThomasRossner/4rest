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

  const flatTrees: any[] = [];
  for (const row of result.rows) {
    // Skip trees for users not in the first N users (safety)
    if (!userToIndex.has(row.user_id)) continue;
    const idx = userToIndex.get(row.user_id)!;
    const origin = areas[idx].origin as [number, number, number];
    const localPosition: [number, number, number] = [row.position_x, row.position_y, row.position_z];
    const absolutePosition: [number, number, number] = [
      origin[0] + localPosition[0],
      origin[1] + localPosition[1],
      origin[2] + localPosition[2],
    ];
    const tree = {
      id: row.id,
      userId: row.user_id,
      treeType: row.tree_type,
      position: absolutePosition,
      localPosition,
      plantedAt: row.planted_at,
    };
    areas[idx].trees.push(tree);
    flatTrees.push(tree);
  }

  return {
    areas,
    trees: flatTrees, // backwards-compatible flat list
    totalTrees: flatTrees.length,
    totalAreas: areas.length,
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
