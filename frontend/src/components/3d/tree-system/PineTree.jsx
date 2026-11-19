import React, { useEffect, useMemo, useRef, useLayoutEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

import ControllableTree from './ControllableTree';
import { APPLE_MOBILE_TEXTURE_MAX, isAppleMobileWeb, limitGltfTextureSize } from '../limitGltfTextures';

const PINE_MODEL_URL = '/models/newPine_s.glb';

// undefined: noch nicht fertig, null: fehlt, sonst das geladene GLTF.
let settledPineModel;
let pineModelPromise = null;

export function isPineModelSettled() {
  return settledPineModel !== undefined;
}

function rememberPineModel(gltf) {
  settledPineModel = gltf;
  return gltf;
}

/** Ein Ladevorgang für alle Kiefern, parallel zum Wald-Request. */
export function loadPineModel() {
  if (!pineModelPromise) {
    pineModelPromise = new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        PINE_MODEL_URL,
        (gltf) => {
          if (isAppleMobileWeb()) limitGltfTextureSize(gltf, APPLE_MOBILE_TEXTURE_MAX);
          resolve(rememberPineModel(gltf));
        },
        undefined,
        () => resolve(rememberPineModel(null))
      );
    });
  }
  return pineModelPromise;
}

if (!isAppleMobileWeb()) {
  loadPineModel();
}

export default function PineTree(props) {
  const [model, setModel] = useState(settledPineModel);

  useEffect(() => {
    if (model !== undefined) return undefined;

    let active = true;
    loadPineModel().then((gltf) => {
      if (active) setModel(gltf);
    });

    return () => {
      active = false;
    };
  }, [model]);

  // Solange das Modell fehlt, keine Buche als Platzhalter: die würde nach dem
  // Nachladen durch die Kiefer ersetzt und der Wald erschiene doppelt.
  if (model === undefined) return null;
  if (model === null) return <ControllableTree {...props} />;

  return <PineModelTree gltf={model} {...props} />;
}

function PineModelTree({
  gltf: tree,
  position,
  rotation,
  growth: trunkGrowth,
  sizeFactor = 1,
  trunkHeightFactor = 1,
  branchCountFactor = 1,
  branchLengthFactor = 1,
  maxTreeGrowSteps = 30,
}) {
  const safeTreeGrowSteps = Math.max(1, Number(maxTreeGrowSteps) || 30);

  const trunkAnchorScale = useMemo(
    () => new THREE.Vector3(trunkGrowth, trunkGrowth * trunkHeightFactor, trunkGrowth),
    [trunkGrowth, trunkHeightFactor]
  );

  const trunkMeshes = useMemo(() => {
    const trunks = [];
    tree.scene.traverse((child) => {
      if (child.isObject3D && child.name.toLowerCase().includes('trunk')) {
        trunks.push(child.clone());
      }
    });
    return trunks;
  }, [tree]);

  const twigAnchors = useMemo(() => {
    const anchors = [];
    tree.scene.traverse((child) => {
      if (child.isObject3D && child.name.startsWith('twigAnchor')) {
        anchors.push(child);
      }
    });
    return anchors;
  }, [tree]);

  const twigMeshes = useMemo(() => {
    const twigs = [];
    tree.scene.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().includes('twig')) {
        twigs.push(child.clone());
      }
    });
    return twigs;
  }, [tree]);

  const maxTwigs = twigAnchors.length;
  const maxTwigGrowSteps = Math.min(15, Math.max(1, safeTreeGrowSteps * 0.5));
  const branchWindowSteps = Math.max(1, safeTreeGrowSteps - maxTwigGrowSteps);
  const newTwigSteps = maxTwigs > 0 ? branchWindowSteps / maxTwigs : 0;

  const twigCount = useMemo(() => {
    if (maxTwigs <= 0) return 0;
    const baseCount = Math.floor(
      (Math.min(trunkGrowth * safeTreeGrowSteps, branchWindowSteps) / branchWindowSteps) *
        maxTwigs
    );
    return Math.min(maxTwigs, Math.floor(baseCount * branchCountFactor));
  }, [branchCountFactor, branchWindowSteps, maxTwigs, safeTreeGrowSteps, trunkGrowth]);

  const twigRefs = useRef([]);

  useLayoutEffect(() => {
    if (!twigRefs.current || twigRefs.current.length === 0 || maxTwigs <= 0) return;

    const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    const twigMatrix = new THREE.Matrix4();
    const twigAnchorMatrix = new THREE.Matrix4();

    for (let meshIndex = 0; meshIndex < twigRefs.current.length; meshIndex++) {
      const meshRef = twigRefs.current[meshIndex];
      if (!meshRef) continue;
      for (let twigIndex = 0; twigIndex < maxTwigs; twigIndex++) {
        meshRef.setMatrixAt(twigIndex, hiddenMatrix);
      }
    }

    twigAnchors.slice(0, Math.min(twigCount, maxTwigs)).forEach((twigAnchor, twigIndex) => {
      const twigGrowth = Math.min(
        (trunkGrowth * safeTreeGrowSteps - (twigIndex + 1) * newTwigSteps) / maxTwigGrowSteps,
        1
      );
      const twigLengthGrowth = Math.max(0, twigGrowth) * branchLengthFactor * trunkGrowth;
      const twigScaleMatrix = new THREE.Matrix4().makeScale(
        twigLengthGrowth,
        twigLengthGrowth,
        twigLengthGrowth
      );

      twigAnchorMatrix.compose(
        twigAnchor.position.clone().multiply(trunkAnchorScale),
        twigAnchor.quaternion,
        new THREE.Vector3(1, 1, 1)
      );
      twigMatrix.copy(twigAnchorMatrix).multiply(twigScaleMatrix);

      for (let meshIndex = 0; meshIndex < twigRefs.current.length; meshIndex++) {
        const meshRef = twigRefs.current[meshIndex];
        if (!meshRef) continue;
        meshRef.setMatrixAt(twigIndex, twigMatrix);
      }
    });

    for (let meshIndex = 0; meshIndex < twigRefs.current.length; meshIndex++) {
      const meshRef = twigRefs.current[meshIndex];
      if (!meshRef) continue;
      meshRef.instanceMatrix.needsUpdate = true;
    }
  }, [
    branchLengthFactor,
    maxTwigs,
    newTwigSteps,
    maxTwigGrowSteps,
    safeTreeGrowSteps,
    trunkAnchorScale,
    trunkGrowth,
    twigAnchors,
    twigCount,
  ]);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={[sizeFactor, sizeFactor, sizeFactor]}
      castShadow
      receiveShadow
    >
      {trunkMeshes.map((trunkMesh, index) => (
        <mesh
          key={`${trunkMesh.uuid}-${index}`}
          geometry={trunkMesh.geometry}
          material={trunkMesh.material}
          scale={[
            Math.max(0.06, trunkGrowth),
            Math.max(0.06, trunkGrowth) * trunkHeightFactor,
            Math.max(0.06, trunkGrowth),
          ]}
          castShadow
          receiveShadow
        />
      ))}
      {twigMeshes.map((twigMesh, meshIndex) => (
        <instancedMesh
          key={`pine-twig-${meshIndex}`}
          ref={(element) => {
            twigRefs.current[meshIndex] = element;
          }}
          args={[twigMesh.geometry, twigMesh.material, maxTwigs]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
