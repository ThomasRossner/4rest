import type { ForestArea, HybridTree } from '../components/3d/forestTypes';
import { FOREST_BLOCK_SIZE } from '../components/3d/forestTypes';

export const FOREST_CAMERA_TARGET_Y = 3.4;
const TREE_HEIGHT_ESTIMATE = 10;
const FRAMING_PADDING = 1.2;
const LEGACY_REFERENCE_ASPECT = 16 / 9;

export type ForestBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
};

export type ForestCameraFraming = {
  target: [number, number, number];
  position: [number, number, number];
};

function extendBounds(
  bounds: ForestBounds,
  x: number,
  y: number,
  z: number,
  padding = 0
): ForestBounds {
  return {
    minX: Math.min(bounds.minX, x - padding),
    maxX: Math.max(bounds.maxX, x + padding),
    minZ: Math.min(bounds.minZ, z - padding),
    maxZ: Math.max(bounds.maxZ, z + padding),
    minY: Math.min(bounds.minY, y),
    maxY: Math.max(bounds.maxY, y),
  };
}

/**
 * Axis-aligned bounds of trees and ground blocks (each area spans FOREST_BLOCK_SIZE).
 */
export function computeForestBounds(
  trees: HybridTree[],
  areas: ForestArea[],
  blockSize = FOREST_BLOCK_SIZE
): ForestBounds | null {
  if (trees.length === 0 && areas.every((area) => area.trees.length === 0)) {
    return null;
  }

  let bounds: ForestBounds | null = null;

  for (const area of areas) {
    const [originX, , originZ] = area.origin;
    const corners: [number, number, number][] = [
      [originX, 0, originZ],
      [originX + blockSize, 0, originZ],
      [originX, 0, originZ + blockSize],
      [originX + blockSize, 0, originZ + blockSize],
    ];
    for (const [x, y, z] of corners) {
      bounds = bounds ? extendBounds(bounds, x, y, z) : {
        minX: x,
        maxX: x,
        minZ: z,
        maxZ: z,
        minY: y,
        maxY: y,
      };
    }
  }

  for (const tree of trees) {
    const [x, y, z] = tree.position;
    bounds = bounds
      ? extendBounds(bounds, x, y, z)
      : { minX: x, maxX: x, minZ: z, maxZ: z, minY: y, maxY: y };
    if (bounds) {
      bounds.maxY = Math.max(bounds.maxY, y + TREE_HEIGHT_ESTIMATE * (tree.sizeFactor ?? 1));
    }
  }

  return bounds;
}

/**
 * Derives OrbitControls target + camera position so the full forest fits in view.
 * Keeps the legacy viewing angle (elevated corner) but scales distance to bounds.
 */
export function computeForestCameraFraming(
  bounds: ForestBounds,
  fovDeg = 45,
  aspect = 16 / 9
): ForestCameraFraming {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const target: [number, number, number] = [centerX, FOREST_CAMERA_TARGET_Y, centerZ];

  const extentX = bounds.maxX - bounds.minX;
  const extentZ = bounds.maxZ - bounds.minZ;
  const horizontalExtent = Math.max(extentX, extentZ, blockSizeFallback(extentX, extentZ));
  const verticalExtent = Math.max(bounds.maxY - bounds.minY, 6);

  const fovRad = (fovDeg * Math.PI) / 180;
  const horizontalFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
  const legacyNarrowFovRad =
    2 * Math.atan(Math.tan(fovRad / 2) / LEGACY_REFERENCE_ASPECT);

  const legacyDistH = (horizontalExtent / 2) / Math.tan(fovRad / 2);
  const legacyDistV = (verticalExtent / 2) / Math.tan(legacyNarrowFovRad / 2);
  const responsiveDistH = (horizontalExtent / 2) / Math.tan(horizontalFovRad / 2);
  const responsiveDistV = (verticalExtent / 2) / Math.tan(fovRad / 2);
  const distance = Math.max(
    legacyDistH,
    legacyDistV,
    responsiveDistH,
    responsiveDistV
  ) * FRAMING_PADDING;

  const viewOffsetX = 15;
  const viewOffsetY = 14 - FOREST_CAMERA_TARGET_Y;
  const viewOffsetZ = 15;
  const viewLen = Math.hypot(viewOffsetX, viewOffsetY, viewOffsetZ);
  const scale = distance / viewLen;

  const position: [number, number, number] = [
    centerX + viewOffsetX * scale,
    FOREST_CAMERA_TARGET_Y + viewOffsetY * scale,
    centerZ + viewOffsetZ * scale,
  ];

  return { target, position };
}

function blockSizeFallback(extentX: number, extentZ: number): number {
  if (extentX <= 0 && extentZ <= 0) return FOREST_BLOCK_SIZE;
  return 0;
}

export function computeForestCameraFromScene(
  trees: HybridTree[],
  areas: ForestArea[],
  fovDeg = 45,
  aspect = 16 / 9
): ForestCameraFraming | null {
  const bounds = computeForestBounds(trees, areas);
  if (!bounds) return null;
  return computeForestCameraFraming(bounds, fovDeg, aspect);
}
