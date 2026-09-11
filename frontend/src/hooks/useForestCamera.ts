import { useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  computeForestCameraFromScene,
  type ForestCameraFraming,
} from '../utils/forestCameraFraming';
import type { ForestArea, HybridTree } from '../components/3d/forestTypes';

const MIN_CAMERA_Y = 0.3;

type ForestCameraRigProps = {
  framing: ForestCameraFraming | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  trees?: HybridTree[];
  areas?: ForestArea[];
  fovDeg?: number;
};

/**
 * Positions camera to frame the user's full forest on load.
 */
export function ForestCameraRig({
  framing,
  controlsRef,
  trees = [],
  areas = [],
  fovDeg = 45,
}: ForestCameraRigProps) {
  const { camera, size } = useThree();

  const responsiveFraming = useMemo(() => {
    const aspect = size.height > 0 ? size.width / size.height : null;
    if (!aspect || !Number.isFinite(aspect)) return framing;
    return computeForestCameraFromScene(trees, areas, fovDeg, aspect) ?? framing;
  }, [areas, fovDeg, framing, size.height, size.width, trees]);

  useLayoutEffect(() => {
    if (!responsiveFraming) return;

    const [px, py, pz] = responsiveFraming.position;
    const [tx, ty, tz] = responsiveFraming.target;
    camera.position.set(px, py, pz);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(tx, ty, tz);
      controls.update();
    }
  }, [responsiveFraming, camera, controlsRef]);

  useFrame(() => {
    if (camera.position.y < MIN_CAMERA_Y) {
      camera.position.y = MIN_CAMERA_Y;
      controlsRef.current?.update();
    }
  });

  return null;
}
