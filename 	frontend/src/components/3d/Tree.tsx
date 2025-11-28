import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import React from 'react';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

// Simple geometric tree fallback
function FallbackTree({ position, scale = 0.25 }: TreeProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>
    </group>
  );
}

function TreeModel({ position, scale = 0.25 }: TreeProps) {
  const { scene } = useGLTF('/models/tree.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return scene.clone();
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  if (!clonedScene) {
    return <FallbackTree position={position} scale={scale} />;
  }

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={[scale, scale, scale]}
      castShadow
      receiveShadow
    />
  );
}

export function Tree({ position, scale = 0.25 }: TreeProps) {
  return (
    <ErrorBoundary fallback={<FallbackTree position={position} scale={scale} />}>
      <Suspense fallback={<FallbackTree position={position} scale={scale} />}>
        <TreeModel position={position} scale={scale} />
      </Suspense>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tree model loading error:', error, errorInfo);
    console.error('File path attempted: /models/tree.glb');
    console.error('Make sure the file exists at: frontend/public/models/tree.glb');
    console.error('Try restarting the Vite dev server if you just added the file');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
