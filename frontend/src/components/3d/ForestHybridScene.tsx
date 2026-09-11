import { useRef } from 'react';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import HybridSceneController from './tree-system/HybridSceneController';
import { ForestCameraRig } from '../../hooks/useForestCamera';
import type { ForestCameraFraming } from '../../utils/forestCameraFraming';
import type { TreeMorphologyParams } from '../../utils/forestCategoryMorphology';
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
  cameraFraming: ForestCameraFraming | null;
  treeGrowSteps?: number;
  morphology: TreeMorphologyParams;
  lowPerformanceMode?: boolean;
  onNavigationActivity?: () => void;
};

/**
 * Hybrid forest: DB positions + growth_points with prototype beech assets and category morphology.
 */
export default function ForestHybridScene({
  trees,
  areas,
  cameraFraming,
  treeGrowSteps = FOREST_HYBRID_TREE_GROW_STEPS,
  morphology,
  lowPerformanceMode = false,
  onNavigationActivity,
}: ForestHybridSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const controlsTarget = cameraFraming
    ? ([...cameraFraming.target] as [number, number, number])
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
      <ForestCameraRig
        framing={cameraFraming}
        controlsRef={controlsRef}
        trees={trees}
        areas={areas}
        fovDeg={FOREST_HYBRID_DEFAULT_CAMERA.fov}
      />
      <HybridSceneController
        trees={trees}
        areas={areas}
        treeGrowSteps={treeGrowSteps}
        morphology={morphology}
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
