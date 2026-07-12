import { describe, expect, it } from 'vitest';
import {
  FOREST_BLOCK_SIZE,
  FOREST_GROUND_SCALE,
  getForestBlockGroundBounds,
  getForestBlockGroundCenter,
  mapForestGroundLocalToWorld,
} from '../components/3d/forestTypes';

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
];

function blockOrigin(x: number, z: number): [number, number, number] {
  const blockX = Math.floor(x / FOREST_BLOCK_SIZE) * FOREST_BLOCK_SIZE;
  const blockZ = Math.floor(z / FOREST_BLOCK_SIZE) * FOREST_BLOCK_SIZE;
  return [blockX, 0, blockZ];
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
    const world = mapForestGroundLocalToWorld([12, 0, 0], [0, 0.92, 0]);
    expect(world[0]).toBeCloseTo(18, 4);
    expect(world[1]).toBeCloseTo(0.92 * FOREST_GROUND_SCALE, 4);
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
});
