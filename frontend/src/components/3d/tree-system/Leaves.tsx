import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Leaves Component - Renders leaf meshes from a GLB model
 * 
 * Each instance clones the scene to ensure independent leaf objects.
 */
interface LeavesProps {
  modelPath?: string;
  position?: [number, number, number];
  [key: string]: any;
}

const Leaves = React.forwardRef<THREE.Group, LeavesProps>((props, ref) => {
  const {
    modelPath = '/old-models/leaves.glb',
    ...otherProps
  } = props;
  
  const gltf = useGLTF(modelPath);
  // Clone the scene so each Leaves instance gets its own object
  const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene;
  const cloned = scene.clone(true);
  return <primitive object={cloned} ref={ref} {...otherProps} />;
});

Leaves.displayName = 'Leaves';

export default Leaves;
