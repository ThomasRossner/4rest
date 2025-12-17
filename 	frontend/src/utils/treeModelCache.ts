import * as THREE from 'three';

/**
 * Merge multiple BufferGeometries into one.
 * Extracted from `TreeComponent` so it can be shared by all tree instances.
 */
export function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  if (geometries.length === 1) {
    return geometries[0];
  }

  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const allIndices: number[] = [];
  let vertexOffset = 0;

  geometries.forEach((geometry) => {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const uvAttribute = geometry.getAttribute('uv');
    const colorAttribute = geometry.getAttribute('color');

    if (positionAttribute) {
      for (let i = 0; i < positionAttribute.count; i++) {
        positions.push(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        );
      }
    }

    if (normalAttribute) {
      for (let i = 0; i < normalAttribute.count; i++) {
        normals.push(
          normalAttribute.getX(i),
          normalAttribute.getY(i),
          normalAttribute.getZ(i)
        );
      }
    } else if (positionAttribute && positionAttribute.count > 0) {
      // Compute normals if not present
      geometry.computeVertexNormals();
      const computedNormals = geometry.getAttribute('normal');
      if (computedNormals) {
        for (let i = 0; i < computedNormals.count; i++) {
          normals.push(
            computedNormals.getX(i),
            computedNormals.getY(i),
            computedNormals.getZ(i)
          );
        }
      }
    }

    if (uvAttribute) {
      for (let i = 0; i < uvAttribute.count; i++) {
        uvs.push(uvAttribute.getX(i), uvAttribute.getY(i));
      }
    }

    if (colorAttribute) {
      const itemSize = colorAttribute.itemSize || 3;
      for (let i = 0; i < colorAttribute.count; i++) {
        colors.push(
          colorAttribute.getX(i),
          colorAttribute.getY(i),
          colorAttribute.getZ(i)
        );
        if (itemSize > 3 && (colorAttribute as any).getW) {
          colors.push((colorAttribute as any).getW(i));
        } else if (itemSize > 3) {
          colors.push(1.0);
        }
      }
    }

    // Update indices
    const index = geometry.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i++) {
        allIndices.push(index.getX(i) + vertexOffset);
      }
    } else if (positionAttribute) {
      // If no index, create one
      for (let i = 0; i < positionAttribute.count; i++) {
        allIndices.push(vertexOffset + i);
      }
    }

    vertexOffset += positionAttribute ? positionAttribute.count : 0;
  });

  // Set attributes
  if (positions.length > 0) {
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  }
  if (normals.length > 0 && normals.length === positions.length) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  if (uvs.length > 0) {
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  if (colors.length > 0) {
    const colorItemSize =
      geometries.find((g) => {
        const attr = g.getAttribute('color');
        return attr && attr.itemSize;
      })?.getAttribute('color')?.itemSize || 3;
    merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, colorItemSize));
  }

  // Set indices
  if (allIndices.length > 0) {
    merged.setIndex(allIndices);
  }

  merged.computeBoundingBox();
  merged.computeBoundingSphere();

  return merged;
}

export interface ProcessedTreeModel {
  trunkOrigin: THREE.Vector3 | null;
  trunkMesh: THREE.Mesh | null;
  twigMeshes: THREE.Mesh[];
  twigMaxPositions: THREE.Vector3[];
  twigLeavesList: THREE.Mesh[][];
  twigLeavesMaxPositions: THREE.Vector3[][];
  mergedLeafGeometries: THREE.BufferGeometry[];
  leafMaterials: THREE.Material[];
}

const sceneCache = new WeakMap<THREE.Object3D, ProcessedTreeModel>();

interface ProcessOptions {
  leavesPerTwig: number;
  disableLeafShadows: boolean;
}

/**
 * Process a GLTF scene once and cache the result.
 * All expensive traversal and leaf-geometry merging happens here.
 * Each `TreeComponent` instance can then clone the cached meshes instead of
 * traversing the full scene every time.
 */
export function getProcessedTreeModel(
  baseScene: THREE.Object3D,
  options: ProcessOptions
): ProcessedTreeModel {
  const cached = sceneCache.get(baseScene);
  if (cached) {
    return cached;
  }

  const { leavesPerTwig, disableLeafShadows } = options;

  let trunkOrigin: THREE.Vector3 | null = null;
  let trunkMesh: THREE.Mesh | null = null;
  const twigMeshes: THREE.Mesh[] = [];
  const twigMaxPositions: THREE.Vector3[] = [];
  const twigLeaveMeshes: THREE.Mesh[] = [];
  const twigRegex = /^Twig\d+$/;

  if (!baseScene) {
    const empty: ProcessedTreeModel = {
      trunkOrigin: null,
      trunkMesh: null,
      twigMeshes: [],
      twigMaxPositions: [],
      twigLeavesList: [],
      twigLeavesMaxPositions: [],
      mergedLeafGeometries: [],
      leafMaterials: [],
    };
    sceneCache.set(baseScene, empty);
    return empty;
  }

  baseScene.traverse((obj: THREE.Object3D) => {
    const objName = obj.name || '';
    const objType = (obj as any).type || obj.constructor.name;

    const isMesh =
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.SkinnedMesh ||
      objType === 'Mesh' ||
      objType === 'SkinnedMesh' ||
      (obj as any).isMesh === true;

    if (isMesh) {
      const mesh = obj as THREE.Mesh;
      const meshName = mesh.name || objName;

      // Enable shadows for trunk and twigs
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (meshName.includes('Trunk') && !trunkOrigin) {
        trunkOrigin = mesh.position.clone();
        trunkMesh = mesh;
      } else if (twigRegex.test(meshName)) {
        const existingIndex = twigMeshes.findIndex((t) => t.name === meshName);
        if (existingIndex === -1) {
          twigMeshes.push(mesh);
          twigMaxPositions.push(mesh.position.clone());
        }
      } else if (meshName.startsWith('Twig-Leaf')) {
        const existingIndex = twigLeaveMeshes.findIndex((l) => l.name === meshName);
        if (existingIndex === -1) {
          if (disableLeafShadows) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
          twigLeaveMeshes.push(mesh);
        }
      }
    } else if (obj instanceof THREE.Object3D && objName) {
      // Handle nested groups that contain the meshes we care about
      obj.children.forEach((child) => {
        const childType = (child as any).type || child.constructor.name;
        const isChildMesh =
          child instanceof THREE.Mesh ||
          child instanceof THREE.SkinnedMesh ||
          childType === 'Mesh' ||
          childType === 'SkinnedMesh';

        if (!isChildMesh) return;

        const childMesh = child as THREE.Mesh;
        childMesh.castShadow = true;
        childMesh.receiveShadow = true;
        const childName = childMesh.name || objName;

        if ((childName.includes('Trunk') || objName.includes('Trunk')) && !trunkOrigin) {
          trunkOrigin = childMesh.position.clone();
          trunkMesh = childMesh;
        } else if (twigRegex.test(childName) || twigRegex.test(objName)) {
          const nameToUse = twigRegex.test(childName) ? childName : objName;
          const existingIndex = twigMeshes.findIndex((t) => t.name === nameToUse);
          if (existingIndex === -1) {
            twigMeshes.push(childMesh);
            twigMaxPositions.push(childMesh.position.clone());
          }
        } else if (childName.startsWith('Twig-Leaf') || objName.startsWith('Twig-Leaf')) {
          const nameToUse = childName.startsWith('Twig-Leaf') ? childName : objName;
          if (!childMesh.name || !childMesh.name.startsWith('Twig-Leaf')) {
            childMesh.name = nameToUse;
          }
          const existingIndex = twigLeaveMeshes.findIndex((l) => l.name === nameToUse);
          if (existingIndex === -1) {
            if (disableLeafShadows) {
              childMesh.castShadow = false;
              childMesh.receiveShadow = false;
            }
            twigLeaveMeshes.push(childMesh);
          }
        }
      });
    }
  });

  // Build leaf lists per twig
  const twigLeavesList: THREE.Mesh[][] = Array.from({ length: twigMeshes.length }, () => []);
  const twigLeavesMaxPositions: THREE.Vector3[][] = Array.from(
    { length: twigMeshes.length },
    () => []
  );

  twigLeaveMeshes.forEach((leafMesh) => {
    const leafName = leafMesh.name;
    const leafIndexMatch = leafName.split('Twig-Leaf')[1];
    if (!leafIndexMatch) {
      return;
    }

    const leafIndex = parseInt(leafIndexMatch, 10);
    if (isNaN(leafIndex)) {
      return;
    }

    const twigNum = Math.floor(leafIndex / leavesPerTwig) - 1; // -1 because leaf indices start at 1

    if (twigNum >= 0 && twigNum < twigLeavesList.length) {
      twigLeavesList[twigNum].push(leafMesh);
      const twigPos = twigMaxPositions[twigNum];
      const leafToTwig = leafMesh.position.clone().sub(twigPos);
      const maxPos = twigPos.clone().add(leafToTwig.multiplyScalar(0.8));
      twigLeavesMaxPositions[twigNum].push(maxPos);
    }
  });

  // Merge leaf geometries per twig for better performance
  const mergedLeafGeometries: THREE.BufferGeometry[] = [];
  const leafMaterials: THREE.Material[] = [];

  twigLeavesList.forEach((leavesArray, twigIndex) => {
    if (leavesArray.length === 0) {
      mergedLeafGeometries.push(new THREE.BufferGeometry());
      leafMaterials.push(new THREE.MeshStandardMaterial());
      return;
    }

    const geometries: THREE.BufferGeometry[] = [];
    let firstMaterial: THREE.Material | null = null;
    const twigBasePos = twigMaxPositions[twigIndex];

    leavesArray.forEach((leafMesh, leafIndex) => {
      const sourceGeometry = leafMesh.geometry;
      if (!sourceGeometry) {
        return;
      }

      let geometry: THREE.BufferGeometry;
      const geometryType = (sourceGeometry as any).type || (sourceGeometry.constructor as any).name;
      const isBufferGeometry =
        sourceGeometry instanceof THREE.BufferGeometry ||
        geometryType === 'BufferGeometry' ||
        (sourceGeometry as any).isBufferGeometry === true;

      if (isBufferGeometry) {
        geometry = (sourceGeometry as THREE.BufferGeometry).clone();
      } else if ((sourceGeometry as any).isGeometry) {
        return;
      } else if (sourceGeometry && typeof (sourceGeometry as any).clone === 'function') {
        geometry = (sourceGeometry as any).clone();
      } else {
        return;
      }

      const leafMaxPos = twigLeavesMaxPositions[twigIndex][leafIndex];
      const leafRelativePos = leafMaxPos.clone().sub(twigBasePos);

      const relativeMatrix = new THREE.Matrix4();
      relativeMatrix.compose(
        leafRelativePos,
        (leafMesh as any).quaternion || new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1)
      );

      geometry.applyMatrix4(relativeMatrix);
      geometries.push(geometry);

      if (!firstMaterial && leafMesh.material) {
        const sourceMaterial = Array.isArray(leafMesh.material) ? leafMesh.material[0] : leafMesh.material;
        try {
          firstMaterial = sourceMaterial.clone();
        } catch {
          firstMaterial = sourceMaterial;
        }
      }
    });

    if (geometries.length > 0) {
      try {
        const mergedGeometry = mergeGeometries(geometries);
        const positionAttr = mergedGeometry.attributes.position;
        if (positionAttr && positionAttr.count > 0) {
          mergedGeometry.computeBoundingBox();
          mergedGeometry.computeBoundingSphere();

          mergedLeafGeometries.push(mergedGeometry);

          let finalMaterial: THREE.Material;
          if (firstMaterial) {
            try {
              finalMaterial = (firstMaterial as THREE.Material).clone();
              if ((finalMaterial as any).map) {
                (finalMaterial as any).map.needsUpdate = true;
              }
              finalMaterial.needsUpdate = true;
            } catch {
              const sourceMat = firstMaterial as any;
              finalMaterial = new THREE.MeshStandardMaterial({
                color: sourceMat.color?.getHex?.() || 0x2d5016,
                map: sourceMat.map,
                transparent: sourceMat.transparent ?? false,
                opacity: sourceMat.opacity ?? 1.0,
                side: THREE.DoubleSide,
                metalness: sourceMat.metalness ?? 0.0,
                roughness: sourceMat.roughness ?? 1.0,
              });
            }
          } else {
            finalMaterial = new THREE.MeshStandardMaterial({
              color: 0x2d5016,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,
            });
          }

          leafMaterials.push(finalMaterial);
        } else {
          mergedLeafGeometries.push(new THREE.BufferGeometry());
          leafMaterials.push(new THREE.MeshStandardMaterial());
        }
      } catch {
        mergedLeafGeometries.push(new THREE.BufferGeometry());
        leafMaterials.push(new THREE.MeshStandardMaterial());
      }
    } else {
      mergedLeafGeometries.push(new THREE.BufferGeometry());
      leafMaterials.push(new THREE.MeshStandardMaterial());
    }
  });

  const processed: ProcessedTreeModel = {
    trunkOrigin,
    trunkMesh,
    twigMeshes,
    twigMaxPositions,
    twigLeavesList,
    twigLeavesMaxPositions,
    mergedLeafGeometries,
    leafMaterials,
  };

  sceneCache.set(baseScene, processed);
  return processed;
}


