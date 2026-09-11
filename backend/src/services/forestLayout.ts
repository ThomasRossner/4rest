import { getPool } from '../database/connection.js';

/**
 * Shared forest layout configuration and helpers.
 * Keep these values in sync across the forest service and maintenance scripts.
 */

// Distance between area origins, matches tile size in the 3D scene
// Reduced from 20 to 12 to make forests more compact
export const FOREST_AREA_SPACING = 12;

// Maximum number of trees per block
// Increased to 10 so that up to 10 trees fit in a single block before expanding
export const FOREST_MAX_TREES_PER_BLOCK = 10;

/**
 * Calculate the required grid size for blocks based on tree count
 * Each block can hold max FOREST_MAX_TREES_PER_BLOCK trees
 * Strategy: Start with 1x1 (single block), expand to 2x2 when needed
 * Grid sizes: 1x1 (1 block, 10 trees max), 2x2 (4 blocks, 40 trees max), 3x3 (9 blocks, 90 trees max), etc.
 */
export function calculateGridSize(
  treeCount: number,
  maxTreesPerBlock: number = FOREST_MAX_TREES_PER_BLOCK
): number {
  if (treeCount === 0) return 1; // Start with single block

  // Start with 1x1 (single block) - all trees in one block
  let gridSize = 1;
  let maxTreesForGrid = gridSize * gridSize * maxTreesPerBlock;

  // Expand grid when all blocks are full
  // Note: We use > (not >=) so grid expands BEFORE reaching capacity
  // e.g., with 10 trees in 1x1, we stay at 1x1. At 11 trees, expand to 2x2
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


