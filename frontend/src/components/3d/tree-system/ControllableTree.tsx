import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const TRUNK_URL = '/models/trunk.glb';
const TWIG_URL = '/models/twig2.glb';
const LEAF_URL = '/models/leaf.glb';

useGLTF.preload(TRUNK_URL);
useGLTF.preload(TWIG_URL);
useGLTF.preload(LEAF_URL);

export interface ControllableTreeProps {
  position?: [number, number, number] | THREE.Vector3;
  rotation?: [number, number, number] | THREE.Euler;
  trunkQuaternion?: THREE.Quaternion;
  /** 0–1 overall trunk growth driver */
  growth?: number;
  maxTreeGrowSteps?: number;
  maxTrunkGrowth?: number;
  maxTwigGrowth?: number;
  num?: number;
}

export default function ControllableTree({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  trunkQuaternion,
  growth: trunkGrowth = 0,
  maxTreeGrowSteps = 10,
  maxTrunkGrowth = 0.9,
  maxTwigGrowth = 0.9,
  num: _num,
}: ControllableTreeProps) {
  const trunk = useGLTF(TRUNK_URL);
  const twig = useGLTF(TWIG_URL);
  const leaf = useGLTF(LEAF_URL);

  /** 0–1 driver (matches original SceneController `growth` prop) */
  const g = Math.min(Math.max(trunkGrowth ?? 0, 0), 1);

  const trunkMesh = useMemo(() => {
    return trunk.scene.children.find((o) => o.type === 'Mesh') as THREE.Mesh | undefined;
  }, [trunk]);

  const twigAnchors = useMemo(() => {
    const arr: THREE.Object3D[] = [];
    trunk.scene.traverse((o) => {
      if (o.name.startsWith('twigAnchor')) arr.push(o);
    });
    return arr;
  }, [trunk]);

  const twigMesh = useMemo(() => {
    return twig.scene.children.find((o) => o.type === 'Mesh') as THREE.Mesh | undefined;
  }, [twig]);

  const maxTwigs = twigAnchors.length;

  const maxTwigGrowSteps = useMemo(() => {
    return 15;
  }, []);

  const newTwigSteps = useMemo(() => {
    if (maxTwigs === 0) return 0;
    return (maxTreeGrowSteps - maxTwigGrowSteps) / maxTwigs;
  }, [maxTreeGrowSteps, maxTwigGrowSteps, maxTwigs]);

  const twigCount = useMemo(() => {
    if (maxTwigs === 0) return 0;
    const denom = maxTreeGrowSteps - maxTwigGrowSteps;
    if (denom <= 0) return 0;
    return Math.floor(
      (Math.min(g * maxTreeGrowSteps, maxTreeGrowSteps - maxTwigGrowSteps) / denom) * maxTwigs
    );
  }, [g, maxTwigGrowSteps, maxTreeGrowSteps, maxTwigs]);

  const leafAnchors = useMemo(() => {
    const arr: THREE.Object3D[] = [];
    twig.scene.traverse((o) => {
      if (o.name.startsWith('leafAnchor')) arr.push(o);
    });
    return arr;
  }, [twig]);

  const leafMesh = useMemo(() => {
    return leaf.scene.children.find((o) => o.type === 'Mesh') as THREE.Mesh | undefined;
  }, [leaf]);

  const maxLeaves = leafAnchors.length;

  const maxLeafGrowSteps = useMemo(() => {
    if (maxLeaves === 0) return 0;
    return maxTreeGrowSteps / maxLeaves;
  }, [maxTreeGrowSteps, maxLeaves]);

  const newLeafSteps = useMemo(() => {
    if (maxLeaves === 0) return 0;
    return (maxTwigGrowSteps - maxLeafGrowSteps) / maxLeaves;
  }, [maxTwigGrowSteps, maxLeafGrowSteps, maxLeaves]);

  const twigRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!twigRef.current || !leafRef.current) return;
    if (!trunkMesh || !twigMesh || !leafMesh) return;
    if (maxTwigs === 0 || maxLeaves === 0) return;

    const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < maxTwigs; i++) {
      twigRef.current.setMatrixAt(i, hiddenMatrix);
      for (let j = 0; j < maxLeaves; j++) {
        leafRef.current.setMatrixAt(i * maxLeaves + j, hiddenMatrix);
      }
    }

    const twigMatrix = new THREE.Matrix4();
    const leafMatrix = new THREE.Matrix4();
    const twigAnchorMatrix = new THREE.Matrix4();
    const leafAnchorMatrix = new THREE.Matrix4();

    let allLeafIndex = 0;
    const capTwigs = Math.min(twigCount, maxTwigs);

    for (let twigIndex = 0; twigIndex < capTwigs; twigIndex++) {
      const twigAnchor = twigAnchors[twigIndex];
      if (!twigAnchor) continue;

      const twigGrowth = Math.min(
        (g * maxTreeGrowSteps - (twigIndex + 1) * newTwigSteps) / maxTwigGrowSteps,
        maxTwigGrowth
      );
      const twigScaleMatrix = new THREE.Matrix4();
      twigScaleMatrix.makeScale(twigGrowth, twigGrowth, twigGrowth);

      twigAnchorMatrix.compose(
        twigAnchor.position.clone().multiplyScalar(g),
        twigAnchor.quaternion,
        new THREE.Vector3(1, 1, 1)
      );
      twigMatrix.copy(twigAnchorMatrix).multiply(twigScaleMatrix);
      twigRef.current.setMatrixAt(twigIndex, twigMatrix);
      twigRef.current.instanceMatrix.needsUpdate = true;

      const denomLeaf = maxTwigGrowSteps - maxLeafGrowSteps;
      const leafCount =
        denomLeaf > 0
          ? Math.floor(
              (Math.min(twigGrowth * maxTwigGrowSteps, maxTwigGrowSteps - maxLeafGrowSteps) / denomLeaf) *
                maxLeaves
            )
          : 0;

      const capLeaves = Math.min(leafCount, maxLeaves);
      for (let leafIndex = 0; leafIndex < capLeaves; leafIndex++) {
        const leafAnchor = leafAnchors[leafIndex];
        if (!leafAnchor) continue;

        const leafGrowth = Math.min(
          (twigGrowth * maxTwigGrowSteps - (leafIndex + 1) * newLeafSteps) / maxLeafGrowSteps,
          1
        );
        const leafScaleMatrix = new THREE.Matrix4();
        leafScaleMatrix.makeScale(leafGrowth, leafGrowth, leafGrowth);
        leafAnchorMatrix.compose(leafAnchor.position, leafAnchor.quaternion, new THREE.Vector3(1, 1, 1));
        leafMatrix.copy(twigMatrix).multiply(leafAnchorMatrix).multiply(leafScaleMatrix);
        leafRef.current.setMatrixAt(allLeafIndex++, leafMatrix);
      }
    }
    leafRef.current.instanceMatrix.needsUpdate = true;
  }, [
    g,
    twigAnchors,
    twigCount,
    maxTwigs,
    newTwigSteps,
    maxTwigGrowSteps,
    leafAnchors,
    maxLeaves,
    newLeafSteps,
    maxLeafGrowSteps,
    twigMesh,
    leafMesh,
    trunkMesh,
    maxTreeGrowSteps,
    maxTwigGrowth,
  ]);

  if (!trunkMesh || !twigMesh || !leafMesh) {
    return null;
  }

  const pos: [number, number, number] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z];

  const rot: [number, number, number] =
    rotation instanceof THREE.Euler ? [rotation.x, rotation.y, rotation.z] : rotation;

  return (
    <group position={pos} rotation={rot} castShadow receiveShadow>
      <mesh
        geometry={trunkMesh.geometry}
        material={trunkMesh.material}
        scale={g * maxTrunkGrowth}
        castShadow
        receiveShadow
      />

      <instancedMesh
        ref={twigRef}
        args={[twigMesh.geometry, twigMesh.material, Math.max(1, maxTwigs)]}
        castShadow
        receiveShadow
      />

      <instancedMesh
        ref={leafRef}
        args={[leafMesh.geometry, leafMesh.material, Math.max(1, maxLeaves * Math.max(1, maxTwigs))]}
        castShadow
        receiveShadow
      />
    </group>
  );
}
