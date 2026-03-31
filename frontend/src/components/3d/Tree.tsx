import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import React from 'react';
import type { ForestCategoryKey } from '../../constants/forestCategories';
import {
  TreeComponent,
  ControllableTree,
  computeModularTreeGrowth2a,
  type ForestPointsRecord,
} from './tree-system';

const USE_MODULAR_TREE = import.meta.env.VITE_USE_MODULAR_TREE !== 'false';
const MODULAR_MAX_TREE_GROW_STEPS = 30;

interface TreeProps {
  position: [number, number, number];
  size?: number; // Size from database - used for fallback only
  scale?: number; // Legacy support - will use size if not provided
  growthPoints?: number; // Growth points from database (1-100+) - enables animated growth
  maxVisibleLeaves?: number; // Limit leaves for performance (legacy twigLeafTree only)
  /** Wald-Kategorie der Pflanz-Aufgabe (API getForest) */
  forestCategory?: ForestCategoryKey | null;
  /** users.forestPoints — für Wachstums-Kombination 2a */
  forestPoints?: ForestPointsRecord | null;
}

// Simple geometric tree fallback
function FallbackTree({ position, size }: TreeProps) {
  const scale = size || 0.035;
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#0d9488" />
      </mesh>
    </group>
  );
}

// Static tree model (fallback for when animated tree is not available)
function StaticTreeModel({ position, size, scale }: TreeProps) {
  const { scene } = useGLTF('/models/tree.glb');
  
  // Use size from database if available, otherwise fallback to scale prop or default
  const treeSize = size ?? scale ?? 0.035;

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
    return <FallbackTree position={position} size={treeSize} />;
  }

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={[treeSize, treeSize, treeSize]}
      castShadow
      receiveShadow
    />
  );
}

// Animated tree: modulares GLB-System (Standard) oder Legacy twigLeafTree
function AnimatedTreeModel({
  position,
  growthPoints,
  size,
  maxVisibleLeaves,
  forestCategory,
  forestPoints,
}: TreeProps) {
  const modularGrowth = useMemo(
    () =>
      computeModularTreeGrowth2a(
        growthPoints ?? 1,
        forestCategory ?? null,
        forestPoints ?? null
      ),
    [growthPoints, forestCategory, forestPoints]
  );

  try {
    if (USE_MODULAR_TREE) {
      return (
        <ControllableTree
          position={position}
          growth={modularGrowth}
          maxTreeGrowSteps={MODULAR_MAX_TREE_GROW_STEPS}
          maxTrunkGrowth={1}
          maxTwigGrowth={1}
        />
      );
    }
    return (
      <TreeComponent
        position={position}
        growthPoints={growthPoints}
        modelPath="/models/twigLeafTree.glb"
        maxVisibleLeaves={maxVisibleLeaves}
        disableLeafShadows={true}
        castShadow
        receiveShadow
      />
    );
  } catch (error) {
    console.error('AnimatedTreeModel error:', error);
    throw error;
  }
}

// Memoize Tree component to prevent unnecessary re-renders
export const Tree = React.memo(function Tree({
  position,
  size,
  scale,
  growthPoints,
  maxVisibleLeaves,
  forestCategory,
  forestPoints,
}: TreeProps) {
  const treeSize = size ?? scale ?? 0.035;
  
  // Use animated tree if growthPoints is provided and > 0, otherwise use static tree
  // Note: growthPoints of 0 should still use animated tree (just very small)
  const useAnimatedTree = growthPoints !== undefined && growthPoints !== null;
  
  return (
    <ErrorBoundary 
      fallback={<FallbackTree position={position} size={treeSize} />}
      useAnimated={useAnimatedTree}
    >
      <Suspense fallback={<FallbackTree position={position} size={treeSize} />}>
        {useAnimatedTree ? (
          <AnimatedTreeModel 
            position={position} 
            growthPoints={Math.max(1, growthPoints || 1)} // Ensure at least 1 growth point
            size={treeSize}
            maxVisibleLeaves={maxVisibleLeaves}
            forestCategory={forestCategory}
            forestPoints={forestPoints}
          />
        ) : (
          <StaticTreeModel 
            position={position} 
            size={treeSize} 
            scale={scale} 
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  const fpEq = (a: ForestPointsRecord | null | undefined, b: ForestPointsRecord | null | undefined) => {
    if (a === b) return true;
    if (!a || !b) return false;
    return (
      a.kommunikation === b.kommunikation &&
      a.mensch === b.mensch &&
      a.natur === b.natur &&
      a.ressourcen === b.ressourcen
    );
  };
  return (
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.growthPoints === nextProps.growthPoints &&
    prevProps.size === nextProps.size &&
    prevProps.maxVisibleLeaves === nextProps.maxVisibleLeaves &&
    prevProps.forestCategory === nextProps.forestCategory &&
    fpEq(prevProps.forestPoints, nextProps.forestPoints)
  );
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; useAnimated?: boolean },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode; useAnimated?: boolean }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tree model loading error:', error, errorInfo);
    if (this.props.useAnimated) {
      console.error('File path attempted: /models/twigLeafTree.glb');
      console.error('Make sure the file exists at: frontend/public/models/twigLeafTree.glb');
    } else {
      console.error('File path attempted: /models/tree.glb');
      console.error('Make sure the file exists at: frontend/public/models/tree.glb');
    }
    console.error('Try restarting the Vite dev server if you just added the file');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
