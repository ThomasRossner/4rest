import { useRef } from 'react';
import { Mesh } from 'three';

interface TreeProps {
  position: [number, number, number];
}

export function Tree({ position }: TreeProps) {
  const trunkRef = useRef<Mesh>(null);
  const leavesRef = useRef<Mesh>(null);

  // Simple tree: brown trunk + green cone for leaves
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh ref={trunkRef} castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Leaves */}
      <mesh ref={leavesRef} castShadow receiveShadow position={[0, 2.5, 0]}>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>
    </group>
  );
}
