import { describe, expect, it } from 'vitest';
import { mapForestApiToHybridForest } from './forestTreeMapper';
import { mapGrowthPointsToProgress } from '../components/3d/tree-system/growthMapper';
import { FOREST_TREE_SURFACE_Y } from '../components/3d/forestTypes';

describe('mapGrowthPointsToProgress', () => {
  it('maps growth points to 0–1 progress', () => {
    expect(mapGrowthPointsToProgress(0)).toBe(0);
    expect(mapGrowthPointsToProgress(50)).toBeCloseTo(0.5, 2);
    expect(mapGrowthPointsToProgress(100)).toBe(1);
  });
});

describe('mapForestApiToHybridForest', () => {
  it('returns empty forest with default area', () => {
    const result = mapForestApiToHybridForest({ areas: [], trees: [], totalTrees: 0 });
    expect(result.trees).toHaveLength(0);
    expect(result.areas).toHaveLength(1);
    expect(result.cameraOrigin).toBeNull();
    expect(result.cameraFraming).toBeNull();
  });

  it('maps flat trees with positions', () => {
    const result = mapForestApiToHybridForest({
      trees: [
        {
          id: 't1',
          position: [3, 0, 4],
          growthPoints: 25,
          size: 0.035,
          plantedAt: '2026-01-01',
        },
        {
          id: 't2',
          position: [5, 0, 6],
          growthPoints: 80,
          size: 0.05,
          plantedAt: '2026-06-01',
          forestCategory: 'natur',
        },
      ],
    });

    expect(result.trees).toHaveLength(2);
    expect(result.trees[0].position[0]).toBe(3);
    expect(result.trees[0].position[1]).toBeCloseTo(FOREST_TREE_SURFACE_Y, 2);
    expect(result.trees[0].position[2]).toBe(4);
    expect(result.trees[0].growth).toBeCloseTo(0.25, 2);
    expect(result.trees[1].growth).toBeCloseTo(0.8, 2);
    expect(result.trees[1].forestCategory).toBe('natur');
    expect(result.cameraOrigin).not.toBeNull();
    expect(result.cameraFraming).not.toBeNull();
    expect(result.cameraFraming!.position[1]).toBeGreaterThan(result.cameraFraming!.target[1]);
  });

  it('maps area trees with local positions', () => {
    const result = mapForestApiToHybridForest({
      areas: [
        {
          origin: [12, 0, 0],
          trees: [
            {
              id: 't1',
              localPosition: [2, 0, 3],
              growthPoints: 10,
            },
          ],
        },
      ],
      trees: [],
    });

    expect(result.trees).toHaveLength(1);
    expect(result.trees[0].position).toEqual([14, FOREST_TREE_SURFACE_Y, 3]);
  });
});
