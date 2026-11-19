import { useRef } from 'react';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { peek, suspend } from 'suspend-react';
import { GLTFLoader, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import HybridSceneController from './tree-system/HybridSceneController';
import { isAppleMobileWeb, limitGltfTextureSize, APPLE_MOBILE_TEXTURE_MAX } from './limitGltfTextures';
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

const FOREST_MODEL_URLS = [
  '/models/grassGround.glb',
  '/models/grass.glb',
  '/models/beechTrunk.glb',
  '/models/beechTwig.glb',
  '/models/beechLeaf.glb',
] as const;

// Auf dem iPhone nicht alle GLBs parallel dekodieren: die 4K-Bilder zusammen
// liegen bei etwa 750 MB und der Tab wird beendet, bevor der Canvas sie zeigt.
if (!isAppleMobileWeb()) {
  for (const url of FOREST_MODEL_URLS) {
    useGLTF.preload(url);
  }
}

function modelWasNotPreloaded(): Promise<never> {
  return Promise.reject(new Error('forest model was not preloaded'));
}

function isPromise(value: unknown): value is Promise<unknown> {
  return typeof (value as { then?: unknown } | null)?.then === 'function';
}

/** true, sobald useGLTF die Modelle synchron aus dem Cache lesen kann. */
export function areForestModelsReady(): boolean {
  return FOREST_MODEL_URLS.every((url) => peek([GLTFLoader, url]) != null);
}

function whenModelCached(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const read = () => {
      try {
        const cached = suspend(modelWasNotPreloaded, [GLTFLoader, url]);
        resolve(Array.isArray(cached) ? cached[0] : cached);
      } catch (thrown) {
        if (isPromise(thrown)) {
          thrown.then(read, reject);
          return;
        }
        reject(thrown);
      }
    };
    read();
  });
}

function settleCachedModel(url: string): Promise<void> {
  return whenModelCached(url).then((gltf) => {
    if (isAppleMobileWeb()) limitGltfTextureSize(gltf, APPLE_MOBILE_TEXTURE_MAX);
  });
}

/**
 * Wartet auf die Preloads, damit der Canvas nicht beim ersten Frame suspendet.
 * Auf iPhone/iPad nacheinander, und die Texturen werden vor dem Upload verkleinert.
 */
export function whenForestModelsReady(): Promise<void> {
  if (!isAppleMobileWeb()) {
    return Promise.all(FOREST_MODEL_URLS.map((url) => settleCachedModel(url))).then(() => undefined);
  }
  return FOREST_MODEL_URLS.reduce<Promise<void>>(
    (chain, url) =>
      chain.then(() => {
        useGLTF.preload(url);
        return settleCachedModel(url);
      }),
    Promise.resolve()
  );
}

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
