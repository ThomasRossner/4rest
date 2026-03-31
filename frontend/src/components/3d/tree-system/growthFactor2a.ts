import type { ForestCategoryKey } from '../../../constants/forestCategories';
import { FOREST_CATEGORY_KEYS } from '../../../constants/forestCategories';

/** Same scale as growthMapper trunk cap for tree growth_points */
export const MAX_GROWTH_POINTS_NORM = 100;

/** Soft cap for normalizing a single forest category column (tunable) */
export const MAX_FOREST_CATEGORY_POINTS_NORM = 10_000;

export type ForestPointsRecord = {
  kommunikation: number;
  mensch: number;
  natur: number;
  ressourcen: number;
};

/**
 * Variante 2a: kombiniert Baum-growth_points (normiert) mit dem passenden Wald-Kategorie-Saldo.
 * Ohne gültige Kategorie nur Baum-Fortschritt.
 */
export function computeModularTreeGrowth2a(
  growthPoints: number,
  forestCategory: ForestCategoryKey | null | undefined,
  forestPoints: ForestPointsRecord | undefined | null
): number {
  const nTree = Math.min(Math.max(Number(growthPoints) || 0, 0), MAX_GROWTH_POINTS_NORM) / MAX_GROWTH_POINTS_NORM;

  if (
    !forestCategory ||
    !forestPoints ||
    !(FOREST_CATEGORY_KEYS as readonly string[]).includes(forestCategory)
  ) {
    return clamp01(nTree);
  }

  const raw = forestPoints[forestCategory as ForestCategoryKey] ?? 0;
  const nCat = Math.min(Math.max(raw, 0), MAX_FOREST_CATEGORY_POINTS_NORM) / MAX_FOREST_CATEGORY_POINTS_NORM;

  const combined = Math.sqrt(Math.max(nTree, 1e-6) * Math.max(nCat, 1e-6));
  return clamp01(combined);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
