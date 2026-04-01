import { OrbitControls } from '@react-three/drei';
import SceneController from './tree-system/SceneController.jsx';

export const FOREST_PROTOTYPE_TREE_GROW_STEPS = 30;

type Props = {
  globalPoints: number;
  maxPoints: number;
  treeGrowSteps?: number;
};

/**
 * Gleiche 3D-Kernszene wie in tree-system/App.jsx: Grid, OrbitControls, SceneController
 * (ground2.glb + ControllableTree an Anchors).
 */
export default function ForestPrototypeScene({
  globalPoints,
  maxPoints,
  treeGrowSteps = FOREST_PROTOTYPE_TREE_GROW_STEPS,
}: Props) {
  return (
    <>
      <OrbitControls zoomSpeed={0.2} zoomToCursor />
      <gridHelper args={[10, 10]} />
      <SceneController globalPoints={globalPoints} maxPoints={maxPoints} treeGrowSteps={treeGrowSteps} />
    </>
  );
}
