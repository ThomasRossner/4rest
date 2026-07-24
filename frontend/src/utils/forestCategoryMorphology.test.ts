import { describe, expect, it } from 'vitest';
import {
  morphologyFromCategoryPoints,
  morphologyFromDyadScales,
  pineMixFactorFromMorphology,
  resolveTreeTypeForForestTree,
  resolveTreeMorphology,
} from './forestCategoryMorphology';

describe('morphologyFromDyadScales', () => {
  it('matches legacy dyad mapping at scale 2', () => {
    const result = morphologyFromDyadScales(2, 2, 2);
    expect(result.trunkHeightFactor).toBeCloseTo(1.4, 2);
    expect(result.branchCountFactor).toBeCloseTo(1.45, 2);
    expect(result.branchLengthFactor).toBeCloseTo(1, 2);
    expect(result.growthChaosStrength).toBeCloseTo(0.06, 2);
    expect(result.pineMixFactor).toBeCloseTo(0.475, 3);
  });
});

describe('pineMixFactorFromMorphology', () => {
  it('derives a bounded pine mix from the four forest morphology controls', () => {
    const low = pineMixFactorFromMorphology({
      trunkHeightFactor: 1,
      branchCountFactor: 1.9,
      branchLengthFactor: 0.7,
      growthChaosStrength: 0,
    });
    const high = pineMixFactorFromMorphology({
      trunkHeightFactor: 1.8,
      branchCountFactor: 1,
      branchLengthFactor: 1.3,
      growthChaosStrength: 0.12,
    });

    expect(low).toBeGreaterThanOrEqual(0.1);
    expect(high).toBeLessThanOrEqual(0.8);
    expect(high).toBeGreaterThan(low);
  });
});

describe('resolveTreeTypeForForestTree', () => {
  it('keeps the selected tree type stable for the same tree id', () => {
    const morphology = morphologyFromDyadScales(2, 2, 2);
    const first = resolveTreeTypeForForestTree('tree-123', morphology);
    expect(resolveTreeTypeForForestTree('tree-123', morphology)).toBe(first);
  });

  it('selects more pines when the derived pine mix is higher', () => {
    const treeIds = Array.from({ length: 100 }, (_, index) => `tree-${index}`);
    const lowPineMorphology = {
      trunkHeightFactor: 1,
      branchCountFactor: 1.9,
      branchLengthFactor: 0.7,
      growthChaosStrength: 0,
      pineMixFactor: 0.1,
    };
    const highPineMorphology = {
      trunkHeightFactor: 1.8,
      branchCountFactor: 1,
      branchLengthFactor: 1.3,
      growthChaosStrength: 0.12,
      pineMixFactor: 0.8,
    };

    const lowPines = treeIds.filter(
      (treeId) => resolveTreeTypeForForestTree(treeId, lowPineMorphology) === 'pine'
    ).length;
    const highPines = treeIds.filter(
      (treeId) => resolveTreeTypeForForestTree(treeId, highPineMorphology) === 'pine'
    ).length;

    expect(highPines).toBeGreaterThan(lowPines);
  });
});

describe('morphologyFromCategoryPoints', () => {
  it('returns null when all points are zero', () => {
    expect(
      morphologyFromCategoryPoints({
        kommunikation: 0,
        mensch: 0,
        natur: 0,
        ressourcen: 0,
      })
    ).toBeNull();
  });

  it('maps equal shares to moderate morphology', () => {
    const result = morphologyFromCategoryPoints({
      kommunikation: 25,
      mensch: 25,
      natur: 25,
      ressourcen: 25,
    });
    expect(result).not.toBeNull();
    expect(result!.trunkHeightFactor).toBeCloseTo(1.4, 2);
    expect(result!.branchCountFactor).toBeCloseTo(1.45, 2);
    expect(result!.branchLengthFactor).toBeCloseTo(1, 2);
    expect(result!.growthChaosStrength).toBeCloseTo(0, 2);
    expect(result!.pineMixFactor).toBeCloseTo(0.4, 2);
  });

  it('increases trunk height when natur and mensch dominate', () => {
    const result = morphologyFromCategoryPoints({
      kommunikation: 0,
      mensch: 50,
      natur: 50,
      ressourcen: 0,
    });
    expect(result!.trunkHeightFactor).toBeCloseTo(1.8, 2);
    expect(result!.branchCountFactor).toBeCloseTo(1, 2);
  });

  it('increases chaos when categories are imbalanced', () => {
    const balanced = morphologyFromCategoryPoints({
      kommunikation: 25,
      mensch: 25,
      natur: 25,
      ressourcen: 25,
    });
    const skewed = morphologyFromCategoryPoints({
      kommunikation: 100,
      mensch: 0,
      natur: 0,
      ressourcen: 0,
    });
    expect(skewed!.growthChaosStrength).toBeGreaterThan(balanced!.growthChaosStrength);
    expect(skewed!.growthChaosStrength).toBeCloseTo(0.12, 2);
  });
});

describe('resolveTreeMorphology', () => {
  it('prefers forest points over dyads', () => {
    const fromPoints = resolveTreeMorphology({
      forestPoints: { kommunikation: 100, mensch: 0, natur: 0, ressourcen: 0 },
      dyadScales: [0, 0, 0],
    });
    expect(fromPoints.branchCountFactor).toBeCloseTo(1.9, 2);
    expect(fromPoints.trunkHeightFactor).toBeCloseTo(1, 2);
  });

  it('falls back to dyads when points are missing', () => {
    const fromDyads = resolveTreeMorphology({ dyadScales: [2, 2, 2] });
    expect(fromDyads.trunkHeightFactor).toBeCloseTo(1.4, 2);
  });
});
