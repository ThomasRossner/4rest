import type { User } from '../stores/authStore';

export type ForestCategoryPoints = NonNullable<User['forestPoints']>;

export type TreeMorphologyParams = {
  trunkHeightFactor: number;
  branchCountFactor: number;
  branchLengthFactor: number;
  growthChaosStrength: number;
};

const DEFAULT_DYAD_SCALE = 2;

/** Same ranges as legacy dyad mapping in HybridSceneController. */
export function morphologyFromDyadScales(
  dyad1 = DEFAULT_DYAD_SCALE,
  dyad2 = DEFAULT_DYAD_SCALE,
  dyad3 = DEFAULT_DYAD_SCALE
): TreeMorphologyParams {
  const clampedDyad1 = clampDyad(dyad1);
  const goalOrientation = 1 - clampedDyad1 / 4;
  const trunkHeightFactor = 1 + goalOrientation * 0.8;

  const clampedDyad2 = clampDyad(dyad2);
  const freedomOrientation = clampedDyad2 / 4;
  const growthChaosStrength = (clampedDyad2 / 4) * 0.12;
  const branchCountFactor = 1 + freedomOrientation * 0.9;

  const clampedDyad3 = clampDyad(dyad3);
  const branchLengthFactor = 0.7 + (clampedDyad3 / 4) * 0.6;

  return {
    trunkHeightFactor,
    branchCountFactor,
    branchLengthFactor,
    growthChaosStrength,
  };
}

function clampDyad(scale: number): number {
  const numeric = Number(scale);
  if (!Number.isFinite(numeric)) return DEFAULT_DYAD_SCALE;
  return Math.max(0, Math.min(4, numeric));
}

function categoryShares(points: ForestCategoryPoints): [number, number, number, number] | null {
  const kommunikation = Math.max(0, Number(points.kommunikation) || 0);
  const mensch = Math.max(0, Number(points.mensch) || 0);
  const natur = Math.max(0, Number(points.natur) || 0);
  const ressourcen = Math.max(0, Number(points.ressourcen) || 0);
  const total = kommunikation + mensch + natur + ressourcen;
  if (total <= 0) return null;
  return [kommunikation / total, mensch / total, natur / total, ressourcen / total];
}

/**
 * Maps four forest category point shares to tree morphology parameters.
 *
 * | Parameter            | Formula (shares k,m,n,r)                          |
 * |----------------------|---------------------------------------------------|
 * | trunkHeightFactor    | 1 + (n + m) * 0.8                                 |
 * | branchCountFactor    | 1 + (k + r) * 0.9                                 |
 * | branchLengthFactor   | 0.7 + (r + n) * 0.6                               |
 * | growthChaosStrength  | stdDev(shares) * (0.12 / 0.433)  (max ~0.12)      |
 */
export function morphologyFromCategoryPoints(points: ForestCategoryPoints): TreeMorphologyParams | null {
  const shares = categoryShares(points);
  if (!shares) return null;

  const [k, m, n, r] = shares;

  const trunkHeightFactor = 1 + (n + m) * 0.8;
  const branchCountFactor = 1 + (k + r) * 0.9;
  const branchLengthFactor = 0.7 + (r + n) * 0.6;

  const mean = 0.25;
  const variance =
    shares.reduce((sum, share) => sum + (share - mean) ** 2, 0) / shares.length;
  const stdDev = Math.sqrt(variance);
  const growthChaosStrength = stdDev * (0.12 / 0.433);

  return {
    trunkHeightFactor,
    branchCountFactor,
    branchLengthFactor,
    growthChaosStrength,
  };
}

type MorphologyInput = {
  forestPoints?: User['forestPoints'];
  dyadScales?: number[] | null;
};

/**
 * Prefer forest category points; fall back to dyad scales when points are missing or zero.
 */
export function resolveTreeMorphology(input: MorphologyInput): TreeMorphologyParams {
  if (input.forestPoints) {
    const fromPoints = morphologyFromCategoryPoints(input.forestPoints);
    if (fromPoints) return fromPoints;
  }

  const scales = input.dyadScales;
  return morphologyFromDyadScales(scales?.[0], scales?.[1], scales?.[2]);
}
