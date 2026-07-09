import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Color } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import ControllableTree from './ControllableTree';
import DynamicForestGround from '../DynamicForestGround';

const INITIAL_TREE_BATCH = 40;
const TREE_BATCH_STEP = 30;
const TREE_BATCH_INTERVAL_MS = 34;
const MAX_RENDER_DISTANCE = 150;

function getLodGrowthScale(distance) {
  if (distance > 50) return 0.82;
  if (distance > 35) return 0.9;
  if (distance > 20) return 0.95;
  return 1;
}

export default function HybridSceneController({
  trees = [],
  areas = [],
  treeGrowSteps = 30,
  morphology = {
    trunkHeightFactor: 1.4,
    branchCountFactor: 1.45,
    branchLengthFactor: 1,
    growthChaosStrength: 0.06,
  },
  lowPerformanceMode = false,
  transparentBackground = false,
}) {
  const sunPosition = [0, 18, -35];
  const lightRef = useRef();
  const { scene, camera } = useThree();
  const isCameraMovingRef = useRef(false);
  const lastCameraPositionRef = useRef(camera.position.clone());
  const cameraMoveTimeoutRef = useRef(null);
  const treeDistanceCacheRef = useRef(new Map());
  const [cameraTick, setCameraTick] = useState(0);

  useEffect(() => {
    if (transparentBackground) {
      scene.background = null;
      return;
    }
    scene.background = new Color('#2f6fe4');
  }, [scene, transparentBackground]);

  const {
    trunkHeightFactor,
    branchCountFactor,
    branchLengthFactor,
    growthChaosStrength,
  } = morphology;

  const treesWithGrowth = useMemo(() => {
    return trees.map((tree) => {
      const seed = Array.from(tree.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const normalized = Math.abs((Math.sin(seed * 12.9898) * 43758.5453) % 1);
      const chaosOffset = (normalized * 2 - 1) * growthChaosStrength;
      const growth = Math.max(0, Math.min(1, tree.growth + chaosOffset));
      return { ...tree, growth };
    });
  }, [trees, growthChaosStrength]);

  const [visibleTreeCount, setVisibleTreeCount] = useState(() =>
    Math.min(treesWithGrowth.length, INITIAL_TREE_BATCH)
  );

  useEffect(() => {
    treeDistanceCacheRef.current.clear();
    setVisibleTreeCount((previous) => {
      if (treesWithGrowth.length <= INITIAL_TREE_BATCH) return treesWithGrowth.length;
      return Math.min(treesWithGrowth.length, Math.max(previous, INITIAL_TREE_BATCH));
    });
  }, [treesWithGrowth]);

  useEffect(() => {
    if (visibleTreeCount >= treesWithGrowth.length) return undefined;

    const step = lowPerformanceMode ? Math.max(10, Math.floor(TREE_BATCH_STEP / 2)) : TREE_BATCH_STEP;
    const timer = window.setInterval(() => {
      setVisibleTreeCount((previous) => {
        if (previous >= treesWithGrowth.length) {
          window.clearInterval(timer);
          return previous;
        }
        return Math.min(treesWithGrowth.length, previous + step);
      });
    }, TREE_BATCH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [treesWithGrowth.length, visibleTreeCount, lowPerformanceMode]);

  useFrame(() => {
    const cameraMoved = camera.position.distanceTo(lastCameraPositionRef.current) > 0.05;
    if (cameraMoved) {
      isCameraMovingRef.current = true;
      lastCameraPositionRef.current.copy(camera.position);
      setCameraTick((tick) => tick + 1);

      if (cameraMoveTimeoutRef.current !== null) {
        window.clearTimeout(cameraMoveTimeoutRef.current);
      }

      cameraMoveTimeoutRef.current = window.setTimeout(() => {
        isCameraMovingRef.current = false;
        treeDistanceCacheRef.current.clear();
        cameraMoveTimeoutRef.current = null;
        setCameraTick((tick) => tick + 1);
      }, 200);
    }
  });

  const visibleTrees = useMemo(() => {
    return treesWithGrowth
      .slice(0, visibleTreeCount)
      .filter((tree) => {
        const cacheKey = tree.id;
        let distance;
        if (isCameraMovingRef.current) {
          distance = treeDistanceCacheRef.current.get(cacheKey) ?? 0;
        } else {
          const worldPos = new THREE.Vector3(tree.position[0], tree.position[1], tree.position[2]);
          distance = camera.position.distanceTo(worldPos);
          treeDistanceCacheRef.current.set(cacheKey, distance);
        }
        return distance <= MAX_RENDER_DISTANCE;
      })
      .map((tree) => {
        const distance = treeDistanceCacheRef.current.get(tree.id) ?? 0;
        const lodScale = getLodGrowthScale(distance);
        return {
          ...tree,
          growth: Math.max(0.04, tree.growth * lodScale),
        };
      });
  }, [treesWithGrowth, visibleTreeCount, cameraTick, camera]);

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={sunPosition}
        intensity={1.15}
        castShadow={!lowPerformanceMode}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-normalBias={0.1}
      />
      <ambientLight intensity={1.6} />

      <DynamicForestGround areas={areas} lowPerformanceMode={lowPerformanceMode} />

      {visibleTrees.map((tree) => (
        <ControllableTree
          key={tree.id}
          position={tree.position}
          rotation={[0, tree.rotationY, 0]}
          growth={tree.growth}
          sizeFactor={tree.sizeFactor}
          trunkHeightFactor={trunkHeightFactor}
          branchCountFactor={branchCountFactor}
          branchLengthFactor={branchLengthFactor}
          maxTreeGrowSteps={treeGrowSteps}
          maxTrunkGrowth={1}
          maxTwigGrowth={1}
          leafTint={tree.leafTint}
        />
      ))}

    </>
  );
}
