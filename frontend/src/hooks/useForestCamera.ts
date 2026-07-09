import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const CAMERA_OFFSET = { x: 15, y: 14, z: 15 };
const CAMERA_TARGET_Y = 3.4;
const MIN_CAMERA_Y = 0.3;

type ForestCameraRigProps = {
  origin: [number, number, number] | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

/**
 * Positions camera on the user's forest centroid (ported from legacy ForestScene).
 */
export function ForestCameraRig({ origin, controlsRef }: ForestCameraRigProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (!origin) return;

    const [originX, , originZ] = origin;
    camera.position.set(originX + CAMERA_OFFSET.x, CAMERA_OFFSET.y, originZ + CAMERA_OFFSET.z);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(originX, CAMERA_TARGET_Y, originZ);
      controls.update();
    }
  }, [origin, camera, controlsRef]);

  useFrame(() => {
    if (camera.position.y < MIN_CAMERA_Y) {
      camera.position.y = MIN_CAMERA_Y;
      controlsRef.current?.update();
    }
  });

  return null;
}
