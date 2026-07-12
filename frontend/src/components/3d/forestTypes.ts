import type { ForestCategoryKey } from '../../constants/forestCategories';

/** Block size — must match backend FOREST_AREA_SPACING */
export const FOREST_BLOCK_SIZE = 12;

/** Measured axis-aligned size of grassGround.glb ground2 mesh (node-local, centered at origin). */
export const FOREST_GROUND_MESH_EXTENT_X = 17.355;
export const FOREST_GROUND_MESH_EXTENT_Z = 19.936;

/** Uniform scale so each grassGround island covers one FOREST_BLOCK_SIZE tile. */
export const FOREST_GROUND_SCALE =
  FOREST_BLOCK_SIZE / Math.max(FOREST_GROUND_MESH_EXTENT_X, FOREST_GROUND_MESH_EXTENT_Z);

/**
 * Vertical offset so DB trees (y=0) sit on the scaled grassGround island surface.
 * Derived from average treeAnchor Y in grassGround.glb (~0.92) × FOREST_GROUND_SCALE.
 */
export const FOREST_TREE_SURFACE_Y = 0.92 * FOREST_GROUND_SCALE;

export type ForestBlockGroundBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/** World-space center of the ground island for a forest block (origin = block corner). */
export function getForestBlockGroundCenter(
  origin: [number, number, number]
): [number, number, number] {
  const half = FOREST_BLOCK_SIZE / 2;
  return [origin[0] + half, origin[1], origin[2] + half];
}

/** Scaled X/Z extents of the grassGround island after FOREST_GROUND_SCALE is applied. */
export function getForestBlockGroundBounds(
  origin: [number, number, number]
): ForestBlockGroundBounds {
  const [cx, , cz] = getForestBlockGroundCenter(origin);
  const halfMeshX = (FOREST_GROUND_MESH_EXTENT_X / 2) * FOREST_GROUND_SCALE;
  const halfMeshZ = (FOREST_GROUND_MESH_EXTENT_Z / 2) * FOREST_GROUND_SCALE;
  return {
    minX: cx - halfMeshX,
    maxX: cx + halfMeshX,
    minZ: cz - halfMeshZ,
    maxZ: cz + halfMeshZ,
  };
}

/** Map a grassGround-local position to world coordinates for a forest block. */
export function mapForestGroundLocalToWorld(
  origin: [number, number, number],
  local: [number, number, number]
): [number, number, number] {
  const center = getForestBlockGroundCenter(origin);
  return [
    center[0] + local[0] * FOREST_GROUND_SCALE,
    origin[1] + local[1] * FOREST_GROUND_SCALE,
    center[2] + local[2] * FOREST_GROUND_SCALE,
  ];
}

export type ForestArea = {
  origin: [number, number, number];
  trees: HybridTree[];
};

export type HybridTree = {
  id: string;
  position: [number, number, number];
  growth: number;
  sizeFactor: number;
  rotationY: number;
  forestCategory?: ForestCategoryKey | 'sonstige';
  leafTint?: string;
};

export type ForestApiTree = {
  id: string;
  position?: [number, number, number];
  localPosition?: [number, number, number];
  plantedAt?: string | Date;
  growthPoints?: number;
  size?: number;
  forestCategory?: string | null;
};

export type ForestApiArea = {
  origin: [number, number, number];
  trees?: ForestApiTree[];
};

export type ForestApiResponse = {
  areas?: ForestApiArea[];
  trees?: ForestApiTree[];
  totalTrees?: number;
};
