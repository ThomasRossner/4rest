import type { ForestCategoryKey } from '../constants/forestCategories';
import { mapGrowthPointsToProgress } from '../components/3d/tree-system/growthMapper';
import type {
  ForestApiResponse,
  ForestApiTree,
  ForestArea,
  HybridTree,
} from '../components/3d/forestTypes';
import { FOREST_BLOCK_SIZE, FOREST_TREE_SURFACE_Y } from '../components/3d/forestTypes';

const MIN_AGE_SIZE_FACTOR = 0.75;
const MAX_AGE_SIZE_FACTOR = 1.25;
const DEFAULT_DB_SIZE = 0.035;
const MIN_RENDER_SIZE = 0.85;
const MAX_RENDER_SIZE = 1.35;

export const FOREST_CATEGORY_LEAF_TINT: Record<ForestCategoryKey | 'sonstige', string> = {
  kommunikation: '#4f9a72',
  mensch: '#4a8f62',
  natur: '#3d8f52',
  ressourcen: '#6a9e48',
  sonstige: '#4a7c59',
};

export type MappedHybridForest = {
  trees: HybridTree[];
  areas: ForestArea[];
  cameraOrigin: [number, number, number] | null;
};

function hashStringToUnit(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 10000) / 10000;
}

function rotationYFromId(id: string): number {
  return hashStringToUnit(id) * Math.PI * 2;
}

function normalizeSizeFactor(dbSize: number | undefined): number {
  const size = Number(dbSize);
  if (!Number.isFinite(size) || size <= 0) return 1;
  const normalized = size / DEFAULT_DB_SIZE;
  return Math.max(MIN_RENDER_SIZE, Math.min(MAX_RENDER_SIZE, normalized));
}

function resolveCategoryKey(
  category: string | null | undefined
): ForestCategoryKey | 'sonstige' {
  if (!category) return 'sonstige';
  if (
    category === 'kommunikation' ||
    category === 'mensch' ||
    category === 'natur' ||
    category === 'ressourcen'
  ) {
    return category;
  }
  return 'sonstige';
}

function applyTreeSurfaceY(y: number | undefined | null): number {
  const base = Number(y ?? 0);
  if (!Number.isFinite(base)) return FOREST_TREE_SURFACE_Y;
  return base + FOREST_TREE_SURFACE_Y;
}

function resolvePosition(
  tree: ForestApiTree,
  areaOrigin?: [number, number, number]
): [number, number, number] | null {
  if (Array.isArray(tree.position) && tree.position.length >= 3) {
    return [
      Number(tree.position[0]),
      applyTreeSurfaceY(tree.position[1]),
      Number(tree.position[2]),
    ];
  }
  if (areaOrigin && Array.isArray(tree.localPosition) && tree.localPosition.length >= 3) {
    return [
      areaOrigin[0] + Number(tree.localPosition[0]),
      applyTreeSurfaceY(tree.localPosition[1]),
      areaOrigin[2] + Number(tree.localPosition[2]),
    ];
  }
  return null;
}

function mapApiTree(
  tree: ForestApiTree,
  position: [number, number, number],
  ageFactor: number
): HybridTree {
  const categoryKey = resolveCategoryKey(tree.forestCategory);
  const growth = mapGrowthPointsToProgress(Number(tree.growthPoints ?? 1));
  const sizeFactor = normalizeSizeFactor(tree.size) * ageFactor;

  return {
    id: String(tree.id),
    position,
    growth,
    sizeFactor,
    rotationY: rotationYFromId(String(tree.id)),
    forestCategory: categoryKey,
    leafTint: FOREST_CATEGORY_LEAF_TINT[categoryKey],
  };
}

function buildAgeFactorMap(apiTrees: ForestApiTree[]): Map<string, number> {
  const sorted = [...apiTrees]
    .filter((tree) => tree.plantedAt)
    .sort(
      (a, b) => new Date(String(a.plantedAt)).getTime() - new Date(String(b.plantedAt)).getTime()
    );

  const factors = new Map<string, number>();
  if (sorted.length <= 1) {
    sorted.forEach((tree) => factors.set(String(tree.id), 1));
    apiTrees.forEach((tree) => {
      if (!factors.has(String(tree.id))) factors.set(String(tree.id), 1);
    });
    return factors;
  }

  sorted.forEach((tree, rank) => {
    const normalizedAgeRank = 1 - rank / (sorted.length - 1);
    factors.set(
      String(tree.id),
      MIN_AGE_SIZE_FACTOR + normalizedAgeRank * (MAX_AGE_SIZE_FACTOR - MIN_AGE_SIZE_FACTOR)
    );
  });

  apiTrees.forEach((tree) => {
    if (!factors.has(String(tree.id))) factors.set(String(tree.id), 1);
  });
  return factors;
}

function computeCameraOrigin(trees: HybridTree[], areas: ForestArea[]): [number, number, number] | null {
  const originsWithTrees = areas.filter((area) => area.trees.length > 0);
  if (originsWithTrees.length > 0) {
    const sumX = originsWithTrees.reduce((sum, area) => sum + area.origin[0], 0);
    const sumZ = originsWithTrees.reduce((sum, area) => sum + area.origin[2], 0);
    return [sumX / originsWithTrees.length, 0, sumZ / originsWithTrees.length];
  }

  if (trees.length > 0) {
    const sumX = trees.reduce((sum, tree) => sum + tree.position[0], 0);
    const sumZ = trees.reduce((sum, tree) => sum + tree.position[2], 0);
    return [sumX / trees.length, 0, sumZ / trees.length];
  }

  return null;
}

function defaultEmptyArea(): ForestArea[] {
  return [{ origin: [0, 0, 0], trees: [] }];
}

export function mapForestApiToHybridForest(data: ForestApiResponse | null | undefined): MappedHybridForest {
  const flatTrees = Array.isArray(data?.trees) ? data.trees : [];
  const apiAreas = Array.isArray(data?.areas) ? data.areas : [];
  const ageFactors = buildAgeFactorMap(flatTrees);

  const trees: HybridTree[] = [];
  const areas: ForestArea[] = [];

  if (apiAreas.length > 0) {
    for (const area of apiAreas) {
      const origin = area.origin as [number, number, number];
      const areaTrees: HybridTree[] = [];
      for (const apiTree of area.trees ?? []) {
        const position = resolvePosition(apiTree, origin);
        if (!position) continue;
        const hybrid = mapApiTree(apiTree, position, ageFactors.get(String(apiTree.id)) ?? 1);
        areaTrees.push(hybrid);
        trees.push(hybrid);
      }
      areas.push({ origin, trees: areaTrees });
    }
  } else {
    for (const apiTree of flatTrees) {
      const position = resolvePosition(apiTree);
      if (!position) continue;
      const hybrid = mapApiTree(apiTree, position, ageFactors.get(String(apiTree.id)) ?? 1);
      trees.push(hybrid);
      const blockX = Math.floor(position[0] / FOREST_BLOCK_SIZE) * FOREST_BLOCK_SIZE;
      const blockZ = Math.floor(position[2] / FOREST_BLOCK_SIZE) * FOREST_BLOCK_SIZE;
      const key = `${blockX},${blockZ}`;
      let area = areas.find(
        (candidate) =>
          candidate.origin[0] === blockX && candidate.origin[2] === blockZ
      );
      if (!area) {
        area = { origin: [blockX, 0, blockZ], trees: [] };
        areas.push(area);
      }
      area.trees.push(hybrid);
    }
  }

  const resolvedAreas = areas.length > 0 ? areas : defaultEmptyArea();
  const cameraOrigin = computeCameraOrigin(trees, resolvedAreas);

  return { trees, areas: resolvedAreas, cameraOrigin };
}
