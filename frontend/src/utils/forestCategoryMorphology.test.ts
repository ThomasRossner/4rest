import { describe, expect, it } from 'vitest';
import {
  morphologyFromCategoryPoints,
  morphologyFromDyadScales,
  resolveTreeMorphology,
} from './forestCategoryMorphology';

describe('morphologyFromDyadScales', () => {
  it('matches legacy dyad mapping at scale 2', () => {
    const result = morphologyFromDyadScales(2, 2, 2);
    expect(result.trunkHeightFactor).toBeCloseTo(1.4, 2);
    expect(result.branchCountFactor).toBeCloseTo(1.45, 2);
    expect(result.branchLengthFactor).toBeCloseTo(1, 2);
    expect(result.growthChaosStrength).toBeCloseTo(0.06, 2);
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
