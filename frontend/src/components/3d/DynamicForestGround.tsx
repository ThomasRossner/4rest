import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  getForestGroundLayout,
  mapForestGroundLayoutLocalToWorld,
  type ForestArea,
} from './forestTypes';

type GrassAnchorRef = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
};

type DynamicForestGroundProps = {
  areas: ForestArea[];
  lowPerformanceMode?: boolean;
};

function hashVec3(vector: THREE.Vector3): number {
  return (
    (Math.floor(vector.x * 1000) * 73856093) ^
    (Math.floor(vector.y * 1000) * 19349663) ^
    (Math.floor(vector.z * 1000) * 83492791)
  );
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function GrassInstances({
  mesh,
  anchors,
}: {
  mesh: THREE.Mesh;
  anchors: GrassAnchorRef[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!ref.current || anchors.length === 0) return;

    const temp = new THREE.Object3D();

    anchors.forEach((anchor, index) => {
      const seed = Math.floor(anchor.position.x * 1000);

      temp.position.copy(anchor.position);
      temp.quaternion.copy(anchor.quaternion);

      const scaleRand = 0.8 + (Math.sin(seed) * 0.5 + 0.5) * 0.4;
      temp.scale.set(6 * scaleRand, 4 * scaleRand, 6 * scaleRand);

      temp.updateMatrix();
      ref.current!.setMatrixAt(index, temp.matrix);
    });

    ref.current.count = anchors.length;
    ref.current.instanceMatrix.needsUpdate = true;
  }, [anchors, mesh]);

  if (anchors.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[mesh.geometry, mesh.material, anchors.length]}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Renders one grassGround island for the full forest plus instanced grass on that surface.
 */
export default function DynamicForestGround({
  areas,
  lowPerformanceMode = false,
}: DynamicForestGroundProps) {
  const ground = useGLTF('/models/grassGround.glb');
  const grassGltf = useGLTF('/models/grass.glb');

  const groundMesh = useMemo(() => {
    let mesh: THREE.Mesh | null = null;
    ground.scene.traverse((object) => {
      if (!mesh && object instanceof THREE.Mesh) {
        mesh = object;
      }
    });
    return mesh;
  }, [ground]);

  const grassAnchorsTemplate = useMemo(() => {
    const anchors: THREE.Object3D[] = [];
    ground.scene.traverse((object) => {
      if (object.name.startsWith('grassAnchor')) {
        anchors.push(object);
      }
    });
    return anchors;
  }, [ground]);

  const grassMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    grassGltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshes.push(object);
      }
    });
    return meshes;
  }, [grassGltf]);

  const groundLayout = useMemo(
    () => getForestGroundLayout(areas),
    [areas]
  );

  const groupedGrass = useMemo(() => {
    if (!grassAnchorsTemplate.length || !grassMeshes.length || !groundLayout) {
      return [] as GrassAnchorRef[][];
    }

    const worldAnchors: GrassAnchorRef[] = [];
    for (const anchor of grassAnchorsTemplate) {
      const [worldX, worldY, worldZ] = mapForestGroundLayoutLocalToWorld(groundLayout, [
        anchor.position.x,
        anchor.position.y,
        anchor.position.z,
      ]);
      worldAnchors.push({
        position: new THREE.Vector3(worldX, worldY, worldZ),
        quaternion: anchor.quaternion.clone(),
      });
    }

    const groups = Array.from({ length: grassMeshes.length }, () => [] as GrassAnchorRef[]);
    worldAnchors.forEach((anchor) => {
      const seed = hashVec3(anchor.position);
      const meshIndex = Math.floor(seededRandom(seed) * grassMeshes.length);
      groups[meshIndex].push(anchor);
    });

    return groups;
  }, [groundLayout, grassAnchorsTemplate, grassMeshes]);

  if (!groundMesh || !groundLayout) return null;

  return (
    <group>
      <mesh
        geometry={groundMesh.geometry}
        material={groundMesh.material}
        position={groundLayout.center}
        scale={groundLayout.scale}
        castShadow
        receiveShadow
      />

      {!lowPerformanceMode &&
        groupedGrass.map((anchors, meshIndex) => {
          const mesh = grassMeshes[meshIndex];
          if (!mesh || anchors.length === 0) return null;
          return <GrassInstances key={meshIndex} mesh={mesh} anchors={anchors} />;
        })}
    </group>
  );
}

useGLTF.preload('/models/grassGround.glb');
useGLTF.preload('/models/grass.glb');
