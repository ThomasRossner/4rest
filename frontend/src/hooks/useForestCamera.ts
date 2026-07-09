import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ForestCameraFraming } from '../utils/forestCameraFraming';

const MIN_CAMERA_Y = 0.3;

type ForestCameraRigProps = {
  framing: ForestCameraFraming | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

/**
 * Positions camera to frame the user's full forest on load.
 */
export function ForestCameraRig({ framing, controlsRef }: ForestCameraRigProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (!framing) return;

    const [px, py, pz] = framing.position;
    const [tx, ty, tz] = framing.target;
    camera.position.set(px, py, pz);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(tx, ty, tz);
      controls.update();
    }
  }, [framing, camera, controlsRef]);

  useFrame(() => {
    if (camera.position.y < MIN_CAMERA_Y) {
      camera.position.y = MIN_CAMERA_Y;
      controlsRef.current?.update();
    }
  });

  return null;
}
