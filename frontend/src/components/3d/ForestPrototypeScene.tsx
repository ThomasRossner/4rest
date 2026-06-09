import { OrbitControls, useGLTF } from '@react-three/drei';
import SceneController from './tree-system/SceneController.jsx';

export const FOREST_PROTOTYPE_TREE_GROW_STEPS = 30;

// Assets frueh in den GLTF-Cache laden, um den ersten Waldaufbau zu beschleunigen.
useGLTF.preload('/models/grassGround.glb');
useGLTF.preload('/models/grass.glb');
useGLTF.preload('/models/beechTrunk.glb');
useGLTF.preload('/models/beechTwig.glb');
useGLTF.preload('/models/beechLeaf.glb');

/** Standard-Blick: leicht nach oben gerichtet, damit der Wald unter dem Top-Panel sichtbar sitzt. */
export const FOREST_DEFAULT_CAMERA = {
  position: [0, 10.5, 28] as const,
  fov: 45,
  /** OrbitControls-Blickpunkt (Insel/Boden) */
  target: [0, 3.4, 0] as const,
};

type Props = {
  globalPoints: number;
  maxPoints: number;
  treeGrowSteps?: number;
  plantedTrees?: number;
  plantedAtList?: string[];
  dyad1Scale?: number;
  dyad2Scale?: number;
  dyad3Scale?: number;
  lowPerformanceMode?: boolean;
  /** Wird bei OrbitControls-Interaktion (Drag, Zoom, Pan) aufgerufen — nur onStart, nicht onChange */
  onNavigationActivity?: () => void;
};

/**
 * Gleiche 3D-Kernszene wie in tree-system/App.jsx: Grid, OrbitControls, SceneController
 * (ground2.glb + ControllableTree an Anchors).
 */
export default function ForestPrototypeScene({
  globalPoints,
  maxPoints,
  treeGrowSteps = FOREST_PROTOTYPE_TREE_GROW_STEPS,
  plantedTrees,
  plantedAtList,
  dyad1Scale = 2,
  dyad2Scale = 2,
  dyad3Scale = 2,
  lowPerformanceMode = false,
  onNavigationActivity,
}: Props) {
  return (
    <>
      <OrbitControls
        target={[...FOREST_DEFAULT_CAMERA.target]}
        zoomSpeed={lowPerformanceMode ? 0.16 : 0.2}
        zoomToCursor={!lowPerformanceMode}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 - 0.06}
        onStart={onNavigationActivity}
      />
      {!lowPerformanceMode && <gridHelper args={[10, 10]} />}
      <SceneController
        globalPoints={globalPoints}
        maxPoints={maxPoints}
        treeGrowSteps={treeGrowSteps}
        plantedTrees={plantedTrees}
        plantedAtList={plantedAtList}
        dyad1Scale={dyad1Scale}
        dyad2Scale={dyad2Scale}
        dyad3Scale={dyad3Scale}
        lowPerformanceMode={lowPerformanceMode}
        transparentBackground
      />
    </>
  );
}
