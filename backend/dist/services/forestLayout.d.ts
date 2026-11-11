/**
 * Shared forest layout configuration and helpers.
 * Keep these values in sync across the forest service and maintenance scripts.
 */
export declare const FOREST_AREA_SPACING = 12;
export declare const FOREST_MAX_TREES_PER_BLOCK = 10;
/**
 * Calculate the required grid size for blocks based on tree count
 * Each block can hold max FOREST_MAX_TREES_PER_BLOCK trees
 * Strategy: Start with 1x1 (single block), expand to 2x2 when needed
 * Grid sizes: 1x1 (1 block, 10 trees max), 2x2 (4 blocks, 40 trees max), 3x3 (9 blocks, 90 trees max), etc.
 */
export declare function calculateGridSize(treeCount: number, maxTreesPerBlock?: number): number;
/**
 * Generate block origins for a square grid centered around the user's primary origin.
 * Returns array of block origins in row-major order.
 */
export declare function generateBlockOrigins(primaryOriginX: number, primaryOriginZ: number, gridSize: number, areaSpacing?: number): Array<{
    x: number;
    z: number;
}>;
/**
 * Helper to compute a user's primary origin in the global forest layout.
 * This mirrors the logic in getForestService and validateAndFixForest.
 */
export declare function getUserPrimaryOrigin(userId: string): Promise<[number, number, number] | null>;
//# sourceMappingURL=forestLayout.d.ts.map