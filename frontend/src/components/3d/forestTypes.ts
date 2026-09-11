import type { ForestCategoryKey } from '../../constants/forestCategories';

/** Block size — must match backend FOREST_AREA_SPACING */
export const FOREST_BLOCK_SIZE = 12;

/** Measured axis-aligned size of grassGround.glb ground2 mesh (node-local, centered at origin). */
export const FOREST_GROUND_MESH_EXTENT_X = 17.355;
export const FOREST_GROUND_MESH_EXTENT_Z = 19.936;

/** Uniform scale so each grassGround island covers one FOREST_BLOCK_SIZE tile. */
export const FOREST_GROUND_SCALE =
  FOREST_BLOCK_SIZE / Math.max(FOREST_GROUND_MESH_EXTENT_X, FOREST_GROUND_MESH_EXTENT_Z);

/** Average treeAnchor Y in grassGround.glb (node-local). */
export const FOREST_GROUND_SURFACE_LOCAL_Y = 0.92;

/**
 * Vertical offset so DB trees (y=0) sit on a single-block grassGround island.
 * Unified multi-block forests use {@link getForestTreeSurfaceY} instead.
 */
export const FOREST_TREE_SURFACE_Y = FOREST_GROUND_SURFACE_LOCAL_Y * FOREST_GROUND_SCALE;

/** Padding around outermost trees — matches backend planting edgePadding. */
export const FOREST_GROUND_TREE_PADDING = 2;

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

export type ForestGroundLayout = {
  center: [number, number, number];
  scale: [number, number, number];
  bounds: ForestBlockGroundBounds;
  /** World Y for DB trees with position_y = 0 on this layout. */
  surfaceY: number;
};

const FOREST_GROUND_MESH_HALF_X = FOREST_GROUND_MESH_EXTENT_X / 2;
const FOREST_GROUND_MESH_HALF_Z = FOREST_GROUND_MESH_EXTENT_Z / 2;

/** Map a grassGround-local position to world coordinates for a unified ground layout. */
export function mapForestGroundLayoutLocalToWorld(
  layout: ForestGroundLayout,
  local: [number, number, number]
): [number, number, number] {
  return [
    layout.center[0] + local[0] * layout.scale[0],
    layout.center[1] + local[1] * layout.scale[1],
    layout.center[2] + local[2] * layout.scale[2],
  ];
}

/** Whether a world X/Z point lies on the scaled grassGround ellipse (single connected island). */
export function isPositionInsideForestGroundLayout(
  layout: ForestGroundLayout,
  x: number,
  z: number
): boolean {
  const dx = (x - layout.center[0]) / (FOREST_GROUND_MESH_HALF_X * layout.scale[0]);
  const dz = (z - layout.center[2]) / (FOREST_GROUND_MESH_HALF_Z * layout.scale[2]);
  return dx * dx + dz * dz <= 1 + 1e-6;
}

/**
 * Layout for one grassGround mesh covering all trees in the forest.
 * Uses tree world positions (with padding) and uniform scale so the circular
 * grassGround mesh ellipse contains every tree — non-uniform stretch leaves
 * corner trees outside the visible island.
 */
export function getForestGroundLayout(areas: ForestArea[]): ForestGroundLayout | null {
  const withTrees = areas.filter((area) => area.trees.length > 0);
  if (withTrees.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let originY = withTrees[0].origin[1];
  const treePositions: Array<[number, number]> = [];

  for (const area of withTrees) {
    for (const tree of area.trees) {
      const x = tree.position[0];
      const z = tree.position[2];
      treePositions.push([x, z]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  minX -= FOREST_GROUND_TREE_PADDING;
  maxX += FOREST_GROUND_TREE_PADDING;
  minZ -= FOREST_GROUND_TREE_PADDING;
  maxZ += FOREST_GROUND_TREE_PADDING;

  const center: [number, number, number] = [(minX + maxX) / 2, originY, (minZ + maxZ) / 2];

  let scaleUniform = FOREST_GROUND_SCALE;
  for (const [x, z] of treePositions) {
    const dx = (x - center[0]) / FOREST_GROUND_MESH_HALF_X;
    const dz = (z - center[2]) / FOREST_GROUND_MESH_HALF_Z;
    scaleUniform = Math.max(scaleUniform, Math.sqrt(dx * dx + dz * dz));
  }

  const halfX = FOREST_GROUND_MESH_HALF_X * scaleUniform;
  const halfZ = FOREST_GROUND_MESH_HALF_Z * scaleUniform;

  return {
    center,
    scale: [scaleUniform, scaleUniform, scaleUniform],
    bounds: {
      minX: center[0] - halfX,
      maxX: center[0] + halfX,
      minZ: center[2] - halfZ,
      maxZ: center[2] + halfZ,
    },
    surfaceY: originY + FOREST_GROUND_SURFACE_LOCAL_Y * scaleUniform,
  };
}

/** Tree surface Y for the unified ground layout of these areas (fallback: single-block constant). */
export function getForestTreeSurfaceY(areas: ForestArea[]): number {
  return getForestGroundLayout(areas)?.surfaceY ?? FOREST_TREE_SURFACE_Y;
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
