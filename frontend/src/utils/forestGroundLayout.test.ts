import { describe, expect, it } from 'vitest';
import {
  FOREST_BLOCK_SIZE,
  FOREST_GROUND_SCALE,
  FOREST_GROUND_SURFACE_LOCAL_Y,
  getForestBlockGroundBounds,
  getForestBlockGroundCenter,
  getForestGroundLayout,
  getForestTreeSurfaceY,
  isPositionInsideForestGroundLayout,
  mapForestGroundLocalToWorld,
  type ForestArea,
  type HybridTree,
} from '../components/3d/forestTypes';

/** demo@example.com tree positions from database/mirror_dump_latest.sql */
const DEMO_TREE_POSITIONS: Array<[number, number]> = [
  [33.48, 8.23],
  [33.66, 6.18],
  [19.28, 20.29],
  [21.9, 8.64],
  [28.99, 5.11],
  [21.17, 19.21],
  [20.83, 21.24],
  [30.36, 4.89],
  [28.46, 6.58],
  [31.34, 2.99],
  [26.05, 9.98],
  [16.36, 21.47],
  [21.54, 3.49],
  [18.57, 9.73],
  [15.82, 8.44],
  [28.42, 9.47],
  [30.24, 6.37],
  [13.54, 2.41],
  [14.39, 3.77],
  [19.01, 7.9],
  [17.52, 8.17],
  [18.52, 3.68],
  [14.09, 8.45],
  [31.94, 5.13],
];

function blockOrigin(x: number, z: number): [number, number, number] {
  const blockX = Math.floor(x / FOREST_BLOCK_SIZE) * FOREST_BLOCK_SIZE;
  const blockZ = Math.floor(z / FOREST_BLOCK_SIZE) * FOREST_BLOCK_SIZE;
  return [blockX, 0, blockZ];
}

function stubTree(id: string, x: number, z: number): HybridTree {
  return {
    id,
    position: [x, 0, z],
    growth: 1,
    sizeFactor: 1,
    rotationY: 0,
  };
}

function demoForestAreas(): ForestArea[] {
  const byBlock = new Map<string, HybridTree[]>();
  for (const [x, z] of DEMO_TREE_POSITIONS) {
    const origin = blockOrigin(x, z);
    const key = `${origin[0]},${origin[2]}`;
    const trees = byBlock.get(key) ?? [];
    trees.push(stubTree(`${key}-${trees.length}`, x, z));
    byBlock.set(key, trees);
  }
  return [...byBlock.entries()].map(([key, trees]) => {
    const [ox, oz] = key.split(',').map(Number);
    return { origin: [ox, 0, oz] as [number, number, number], trees };
  });
}

describe('forest ground layout', () => {
  it('scales grassGround to fit FOREST_BLOCK_SIZE on the longest axis', () => {
    expect(FOREST_GROUND_SCALE).toBeCloseTo(12 / 19.936, 4);
    const bounds = getForestBlockGroundBounds([0, 0, 0]);
    expect(bounds.maxZ - bounds.minZ).toBeCloseTo(FOREST_BLOCK_SIZE, 1);
    expect(bounds.minX).toBeLessThanOrEqual(2);
    expect(bounds.maxX).toBeGreaterThanOrEqual(10);
  });

  it('centers each island on the block midpoint', () => {
    const origin: [number, number, number] = [24, 0, 12];
    const center = getForestBlockGroundCenter(origin);
    expect(center).toEqual([30, 0, 18]);
    const bounds = getForestBlockGroundBounds(origin);
    expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(center[0], 4);
    expect((bounds.minZ + bounds.maxZ) / 2).toBeCloseTo(center[2], 4);
  });

  it('maps local anchor positions into the scaled block', () => {
    const world = mapForestGroundLocalToWorld([12, 0, 0], [0, FOREST_GROUND_SURFACE_LOCAL_Y, 0]);
    expect(world[0]).toBeCloseTo(18, 4);
    expect(world[1]).toBeCloseTo(FOREST_GROUND_SURFACE_LOCAL_Y * FOREST_GROUND_SCALE, 4);
    expect(world[2]).toBeCloseTo(6, 4);
  });

  it('keeps demo user tree positions inside their block ground bounds', () => {
    for (const [x, z] of DEMO_TREE_POSITIONS) {
      const origin = blockOrigin(x, z);
      const bounds = getForestBlockGroundBounds(origin);
      expect(x).toBeGreaterThanOrEqual(bounds.minX - 0.01);
      expect(x).toBeLessThanOrEqual(bounds.maxX + 0.01);
      expect(z).toBeGreaterThanOrEqual(bounds.minZ - 0.01);
      expect(z).toBeLessThanOrEqual(bounds.maxZ + 0.01);
    }
  });

  it('covers backend planting range [origin+2, origin+10] per axis', () => {
    for (const origin of [
      [0, 0, 0],
      [12, 0, 0],
      [24, 0, 12],
    ] as Array<[number, number, number]>) {
      const bounds = getForestBlockGroundBounds(origin);
      const minTree = origin[0] + 2;
      const maxTree = origin[0] + 10;
      const minTreeZ = origin[2] + 2;
      const maxTreeZ = origin[2] + 10;
      expect(bounds.minX).toBeLessThanOrEqual(minTree);
      expect(bounds.maxX).toBeGreaterThanOrEqual(maxTree);
      expect(bounds.minZ).toBeLessThanOrEqual(minTreeZ);
      expect(bounds.maxZ).toBeGreaterThanOrEqual(maxTreeZ);
    }
  });

  it('documents per-block X gap that multi-block layout must bridge', () => {
    const left = getForestBlockGroundBounds([0, 0, 0]);
    const right = getForestBlockGroundBounds([12, 0, 0]);
    const gap = right.minX - left.maxX;
    expect(gap).toBeGreaterThan(1);
    expect(gap).toBeLessThan(2);
  });

  it('builds one uniform-scale ground layout from tree positions', () => {
    const areas: ForestArea[] = [
      { origin: [12, 0, 0], trees: [stubTree('t1', 18, 6)] },
      { origin: [24, 0, 0], trees: [stubTree('t2', 30, 6)] },
      { origin: [12, 0, 12], trees: [stubTree('t3', 18, 18)] },
      { origin: [24, 0, 12], trees: [stubTree('t4', 30, 18)] },
    ];

    const layout = getForestGroundLayout(areas);
    expect(layout).not.toBeNull();
    expect(layout!.scale[0]).toBe(layout!.scale[1]);
    expect(layout!.scale[1]).toBe(layout!.scale[2]);
    expect(layout!.bounds.maxX - layout!.bounds.minX).toBeGreaterThan(FOREST_BLOCK_SIZE);
    expect(layout!.bounds.maxZ - layout!.bounds.minZ).toBeGreaterThan(FOREST_BLOCK_SIZE);

    for (const area of areas) {
      for (const tree of area.trees) {
        expect(isPositionInsideForestGroundLayout(layout!, tree.position[0], tree.position[2])).toBe(
          true
        );
      }
    }
  });

  it('keeps every demo forest tree on the unified ground ellipse', () => {
    const areas = demoForestAreas();
    const layout = getForestGroundLayout(areas);
    expect(layout).not.toBeNull();

    for (const [x, z] of DEMO_TREE_POSITIONS) {
      expect(isPositionInsideForestGroundLayout(layout!, x, z)).toBe(true);
    }
  });

  it('exposes matching surface Y for the unified layout', () => {
    const areas = demoForestAreas();
    const layout = getForestGroundLayout(areas);
    expect(getForestTreeSurfaceY(areas)).toBeCloseTo(layout!.surfaceY, 6);
    expect(layout!.surfaceY).toBeCloseTo(
      FOREST_GROUND_SURFACE_LOCAL_Y * layout!.scale[1],
      6
    );
  });

  it('ignores empty blocks when building merged ground layout', () => {
    const layout = getForestGroundLayout([
      { origin: [0, 0, 0], trees: [stubTree('t1', 6, 6)] },
      { origin: [12, 0, 0], trees: [] },
    ]);
    const single = getForestGroundLayout([
      { origin: [0, 0, 0], trees: [stubTree('t1', 6, 6)] },
    ]);
    expect(layout!.center).toEqual(single!.center);
    expect(layout!.scale).toEqual(single!.scale);
  });
});
