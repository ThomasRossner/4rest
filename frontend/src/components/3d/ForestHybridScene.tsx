import { useRef } from 'react';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import HybridSceneController from './tree-system/HybridSceneController';
import { ForestCameraRig } from '../../hooks/useForestCamera';
import type { ForestArea, HybridTree } from './forestTypes';

export const FOREST_HYBRID_TREE_GROW_STEPS = 30;

export const FOREST_HYBRID_DEFAULT_CAMERA = {
  position: [0, 14, 42] as const,
  fov: 45,
  target: [0, 3.4, 0] as const,
};

useGLTF.preload('/models/grassGround.glb');
useGLTF.preload('/models/grass.glb');
useGLTF.preload('/models/beechTrunk.glb');
useGLTF.preload('/models/beechTwig.glb');
useGLTF.preload('/models/beechLeaf.glb');

type ForestHybridSceneProps = {
  trees: HybridTree[];
  areas: ForestArea[];
  cameraOrigin: [number, number, number] | null;
  treeGrowSteps?: number;
  dyad1Scale?: number;
  dyad2Scale?: number;
  dyad3Scale?: number;
  lowPerformanceMode?: boolean;
  onNavigationActivity?: () => void;
};

/**
 * Hybrid forest: DB positions + growth_points with prototype beech assets and dyad morphology.
 */
export default function ForestHybridScene({
  trees,
  areas,
  cameraOrigin,
  treeGrowSteps = FOREST_HYBRID_TREE_GROW_STEPS,
  dyad1Scale = 2,
  dyad2Scale = 2,
  dyad3Scale = 2,
  lowPerformanceMode = false,
  onNavigationActivity,
}: ForestHybridSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const controlsTarget = cameraOrigin
    ? ([cameraOrigin[0], FOREST_HYBRID_DEFAULT_CAMERA.target[1], cameraOrigin[2]] as [
        number,
        number,
        number,
      ])
    : ([...FOREST_HYBRID_DEFAULT_CAMERA.target] as [number, number, number]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        target={controlsTarget}
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={75}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 - 0.06}
        zoomSpeed={lowPerformanceMode ? 0.16 : 0.2}
        zoomToCursor={!lowPerformanceMode}
        onStart={onNavigationActivity}
      />
      <ForestCameraRig origin={cameraOrigin} controlsRef={controlsRef} />
      <HybridSceneController
        trees={trees}
        areas={areas}
        treeGrowSteps={treeGrowSteps}
        dyad1Scale={dyad1Scale}
        dyad2Scale={dyad2Scale}
        dyad3Scale={dyad3Scale}
        lowPerformanceMode={lowPerformanceMode}
        transparentBackground
      />
    </>
  );
}

/** @deprecated Use FOREST_HYBRID_TREE_GROW_STEPS — kept for HomePage import compatibility */
export const FOREST_PROTOTYPE_TREE_GROW_STEPS = FOREST_HYBRID_TREE_GROW_STEPS;
/** @deprecated Use FOREST_HYBRID_DEFAULT_CAMERA */
export const FOREST_DEFAULT_CAMERA = FOREST_HYBRID_DEFAULT_CAMERA;
