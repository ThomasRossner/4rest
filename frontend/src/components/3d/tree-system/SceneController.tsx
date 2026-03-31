import React, { useMemo, useRef, Fragment } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import ControllableTree from './ControllableTree';

const GROUND_URL = '/models/ground2.glb';
useGLTF.preload(GROUND_URL);

export interface SceneControllerProps {
  globalPoints: number;
  maxPoints: number;
  treeGrowSteps: number;
}

export default function SceneController({ globalPoints, maxPoints, treeGrowSteps }: SceneControllerProps) {
  const sunPosition: [number, number, number] = [0, 30, 10];
  const lightRef = useRef<THREE.DirectionalLight>(null);

  const ground = useGLTF(GROUND_URL);

  const treeAnchors = useMemo(() => {
    const arr: THREE.Object3D[] = [];
    ground.scene.traverse((o) => {
      if (o.name.startsWith('treeAnchor')) arr.push(o);
    });
    return arr;
  }, [ground]);

  const groundMesh = useMemo(() => {
    return ground.scene.children.find((o) => (o as THREE.Mesh).isMesh) as THREE.Mesh | undefined;
  }, [ground]);

  const maxTrees = treeAnchors.length;

  const newTreeSteps = useMemo(() => {
    if (maxTrees <= 0) return 0;
    return (maxPoints - treeGrowSteps) / maxTrees;
  }, [maxPoints, maxTrees, treeGrowSteps]);

  const treeCount = useMemo(() => {
    if (maxTrees <= 0) return 0;
    const denom = maxPoints - treeGrowSteps;
    if (denom <= 0) return 0;
    return Math.floor((Math.min(globalPoints, maxPoints - treeGrowSteps) / denom) * maxTrees);
  }, [globalPoints, maxPoints, treeGrowSteps, maxTrees]);

  const trees = useMemo(() => {
    return treeAnchors.slice(0, treeCount).map((anchor, index) => {
      const growth = Math.min((globalPoints - (index + 1) * newTreeSteps) / treeGrowSteps, 1);
      return {
        treeAnchorIndex: index,
        growth,
        anchor,
      };
    });
  }, [treeAnchors, treeCount, globalPoints, newTreeSteps, treeGrowSteps]);

  if (!groundMesh) {
    return null;
  }

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={sunPosition}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
      <ambientLight intensity={0.6} />

      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * 2 * Math.PI;
        const radius = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <directionalLight key={i} position={[x, 2, z]} intensity={0.2} castShadow={false} />
        );
      })}

      <mesh position={sunPosition}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
      </mesh>
      <mesh
        geometry={groundMesh.geometry}
        material={groundMesh.material}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />

      {trees.slice(0, treeCount).map((tree, i) => {
        const p = tree.anchor.position;
        const pos: [number, number, number] = [p.x, p.y, p.z];
        const euler = tree.anchor.rotation;
        return (
          <Fragment key={`lab-tree-${i}`}>
            <ControllableTree
              position={pos}
              rotation={[euler.x, euler.y, euler.z]}
              trunkQuaternion={tree.anchor.quaternion}
              growth={tree.growth}
              maxTreeGrowSteps={treeGrowSteps}
              maxTrunkGrowth={1}
              maxTwigGrowth={1}
              num={i}
            />
          </Fragment>
        );
      })}
    </>
  );
}
