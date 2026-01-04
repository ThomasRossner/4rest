import { getPool } from '../database/connection.js';

/**
 * Shared forest layout configuration and helpers.
 * Keep these values in sync across the forest service and maintenance scripts.
 */

// Distance between area origins, matches tile size in the 3D scene
export const FOREST_AREA_SPACING = 20;

// Maximum number of trees per 20x20 block
export const FOREST_MAX_TREES_PER_BLOCK = 8;

/**
 * Calculate the required grid size for blocks based on tree count
 * Each block can hold max FOREST_MAX_TREES_PER_BLOCK trees
 * Grid sizes: 2x2 (4 blocks, 32 trees max), 3x3 (9 blocks, 72 trees max), 4x4 (16 blocks, 128 trees max), etc.
 */
export function calculateGridSize(
  treeCount: number,
  maxTreesPerBlock: number = FOREST_MAX_TREES_PER_BLOCK
): number {
  if (treeCount === 0) return 2; // Default 2x2 grid

  // Start with 2x2 (4 blocks)
  let gridSize = 2;
  let maxTreesForGrid = gridSize * gridSize * maxTreesPerBlock;

  // Expand grid when all blocks are full
  // Note: We use > (not >=) so grid expands BEFORE reaching capacity
  // e.g., with 32 trees in 2x2, we stay at 2x2. At 33 trees, expand to 3x3
  while (treeCount > maxTreesForGrid) {
    gridSize++;
    maxTreesForGrid = gridSize * gridSize * maxTreesPerBlock;
  }

  return gridSize;
}

/**
 * Generate block origins for a square grid centered around the user's primary origin.
 * Returns array of block origins in row-major order.
 */
export function generateBlockOrigins(
  primaryOriginX: number,
  primaryOriginZ: number,
  gridSize: number,
  areaSpacing: number = FOREST_AREA_SPACING
): Array<{ x: number; z: number }> {
  const blocks: Array<{ x: number; z: number }> = [];

  // Calculate offset to center the grid around the primary origin
  const centerOffset = Math.floor(-(gridSize - 1) / 2) * areaSpacing;

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

/**
 * Helper to compute a user's primary origin in the global forest layout.
 * This mirrors the logic in getForestService and validateAndFixForest.
 */
export async function getUserPrimaryOrigin(userId: string): Promise<[number, number, number] | null> {
  const db = getPool();

  const usersResult = await db.query(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1000`);
  const userIds: string[] = usersResult.rows.map((r: any) => r.id);
  const userIndex = userIds.indexOf(userId);

  if (userIndex === -1) return null;

  const gridCols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, userIds.length))));
  const col = userIndex % gridCols;
  const rowIdx = Math.floor(userIndex / gridCols);

  return [col * FOREST_AREA_SPACING, 0, rowIdx * FOREST_AREA_SPACING];
}


