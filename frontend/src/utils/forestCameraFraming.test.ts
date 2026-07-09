import { describe, expect, it } from 'vitest';
import {
  computeForestBounds,
  computeForestCameraFraming,
  computeForestCameraFromScene,
} from './forestCameraFraming';
import type { ForestArea, HybridTree } from '../components/3d/forestTypes';
import { FOREST_BLOCK_SIZE } from '../components/3d/forestTypes';

function makeTree(id: string, x: number, z: number): HybridTree {
  return {
    id,
    position: [x, 0.92, z],
    growth: 0.5,
    sizeFactor: 1,
    rotationY: 0,
  };
}

describe('computeForestBounds', () => {
  it('returns null for empty forest', () => {
    expect(computeForestBounds([], [{ origin: [0, 0, 0], trees: [] }])).toBeNull();
  });

  it('includes ground block corners per area', () => {
    const areas: ForestArea[] = [{ origin: [12, 0, 0], trees: [makeTree('t1', 14, 3)] }];
    const bounds = computeForestBounds(areas[0].trees, areas);
    expect(bounds).not.toBeNull();
    expect(bounds!.minX).toBe(12);
    expect(bounds!.maxX).toBe(12 + FOREST_BLOCK_SIZE);
    expect(bounds!.minZ).toBe(0);
    expect(bounds!.maxZ).toBe(FOREST_BLOCK_SIZE);
  });

  it('spans multiple distant areas', () => {
    const areas: ForestArea[] = [
      { origin: [0, 0, 0], trees: [makeTree('t1', 2, 2)] },
      { origin: [24, 0, 24], trees: [makeTree('t2', 26, 26)] },
    ];
    const trees = areas.flatMap((area) => area.trees);
    const bounds = computeForestBounds(trees, areas);
    expect(bounds!.minX).toBe(0);
    expect(bounds!.maxX).toBe(24 + FOREST_BLOCK_SIZE);
    expect(bounds!.minZ).toBe(0);
    expect(bounds!.maxZ).toBe(24 + FOREST_BLOCK_SIZE);
  });
});

describe('computeForestCameraFraming', () => {
  it('centers target on bounds and places camera farther for larger forests', () => {
    const small = computeForestCameraFraming({
      minX: 0,
      maxX: FOREST_BLOCK_SIZE,
      minZ: 0,
      maxZ: FOREST_BLOCK_SIZE,
      minY: 0,
      maxY: 8,
    });
    const large = computeForestCameraFraming({
      minX: 0,
      maxX: FOREST_BLOCK_SIZE * 4,
      minZ: 0,
      maxZ: FOREST_BLOCK_SIZE * 4,
      minY: 0,
      maxY: 8,
    });

    expect(small.target[0]).toBeCloseTo(FOREST_BLOCK_SIZE / 2, 1);
    expect(large.target[0]).toBeCloseTo(FOREST_BLOCK_SIZE * 2, 1);

    const smallDist = Math.hypot(
      small.position[0] - small.target[0],
      small.position[1] - small.target[1],
      small.position[2] - small.target[2]
    );
    const largeDist = Math.hypot(
      large.position[0] - large.target[0],
      large.position[1] - large.target[1],
      large.position[2] - large.target[2]
    );
    expect(largeDist).toBeGreaterThan(smallDist);
  });
});

describe('computeForestCameraFromScene', () => {
  it('returns framing for trees with positions', () => {
    const trees = [makeTree('t1', 3, 4), makeTree('t2', 8, 9)];
    const areas: ForestArea[] = [{ origin: [0, 0, 0], trees }];
    const framing = computeForestCameraFromScene(trees, areas);
    expect(framing).not.toBeNull();
    expect(framing!.target[0]).toBeGreaterThan(0);
    expect(framing!.position[1]).toBeGreaterThan(framing!.target[1]);
  });
});
