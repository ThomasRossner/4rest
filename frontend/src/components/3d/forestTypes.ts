import type { ForestCategoryKey } from '../../constants/forestCategories';

/** Block size — must match backend FOREST_AREA_SPACING */
export const FOREST_BLOCK_SIZE = 12;

/**
 * Vertical offset so DB trees (y=0) sit on the grassGround island surface.
 * Matches average treeAnchor Y in public/models/grassGround.glb (~0.92).
 */
export const FOREST_TREE_SURFACE_Y = 0.92;

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
