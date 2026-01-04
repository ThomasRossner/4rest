/**
 * Shared forest layout configuration and helpers.
 * Keep these values in sync across the forest service and maintenance scripts.
 */
export declare const FOREST_AREA_SPACING = 20;
export declare const FOREST_MAX_TREES_PER_BLOCK = 8;
/**
 * Calculate the required grid size for blocks based on tree count
 * Each block can hold max FOREST_MAX_TREES_PER_BLOCK trees
 * Grid sizes: 2x2 (4 blocks, 32 trees max), 3x3 (9 blocks, 72 trees max), 4x4 (16 blocks, 128 trees max), etc.
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