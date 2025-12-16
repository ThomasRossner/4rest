import React, { useState, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mapGrowthPointsToCounter, calculateTwigScale } from './growthMapper';

/**
 * Merge multiple BufferGeometries into one
 * This is a manual implementation since BufferGeometryUtils might not be available
 */
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        positions.push(x, y, z);
      }
    }

    if (normalAttribute) {
      for (let i = 0; i < normalAttribute.count; i++) {
        const x = normalAttribute.getX(i);
        const y = normalAttribute.getY(i);
        const z = normalAttribute.getZ(i);
        normals.push(x, y, z);
      }
    } else if (positionAttribute && positionAttribute.count > 0) {
      // Compute normals if not present
      geometry.computeVertexNormals();
      const computedNormals = geometry.getAttribute('normal');
      if (computedNormals) {
        for (let i = 0; i < computedNormals.count; i++) {
          normals.push(computedNormals.getX(i), computedNormals.getY(i), computedNormals.getZ(i));
        }
      }
    }

    if (uvAttribute) {
      for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i);
        const v = uvAttribute.getY(i);
        uvs.push(u, v);
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
    const colorItemSize = geometries.find(g => {
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

// Preload the tree model for better performance
useGLTF.preload('/models/twigLeafTree.glb');

/**
 * TreeComponent - A procedural tree growth component
 * 
 * This component handles the growth animation of a tree, including trunk, twigs, and leaves.
 * The tree grows in stages: trunk grows first, then twigs appear and grow, followed by leaves.
 */
export interface AnimatedTreeProps {
  position?: [number, number, number];
  modelPath?: string;
  trunkGrowSteps?: number;
  twigGrowSteps?: number;
  leavesPerTwig?: number;
  growthPoints?: number; // From database - maps to animation state
  maxVisibleLeaves?: number; // Limit leaves for performance (default: all)
  disableLeafShadows?: boolean; // Disable shadows on leaves for performance
  [key: string]: any;
}

export interface TreeComponentRef {
  getKey: () => string;
  grow?: () => void; // Optional - kept for manual animation if needed
}

const TreeComponent = React.forwardRef<TreeComponentRef, AnimatedTreeProps>((props, ref) => {
  const {
    position = [0, 0, 0],
    modelPath = '/models/twigLeafTree.glb',
    trunkGrowSteps = 20,
    twigGrowSteps = 8,
    leavesPerTwig = 32,
    growthPoints,
    maxVisibleLeaves,
    disableLeafShadows = true, // Default to true for performance
    ...otherProps
  } = props;

  const gltf = useGLTF(modelPath);
  // Share the base scene geometry - only clone what we need to modify
  // This is more memory efficient than cloning the entire scene
  const baseScene = useMemo(() => {
    const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene;
    return scene;
  }, [gltf]);
  
  // Only clone once for this component instance
  const clonedScene = useMemo(() => {
    return baseScene.clone(true);
  }, [baseScene]);
  
  const [twigMeshes, setTwigMeshes] = useState<THREE.Mesh[]>([]);
  const [twigMaxPositions, setTwigMaxPositions] = useState<THREE.Vector3[]>([]);
  const [twigLeavesList, setTwigLeavesList] = useState<THREE.Mesh[][]>([]);   // array of arrays of leaves per twig (for LOD)
  const [twigLeavesMaxPositions, setTwigLeavesMaxPositions] = useState<THREE.Vector3[][]>([]); // array of arrays of leaf max positions per twig
  const [mergedLeafGeometries, setMergedLeafGeometries] = useState<THREE.BufferGeometry[]>([]); // merged geometries per twig (optimized)
  const [leafMaterials, setLeafMaterials] = useState<THREE.Material[]>([]); // materials per twig group

  const [trunkOrigin, setTrunkOrigin] = useState<THREE.Vector3 | null>(null);
  const [trunk, setTrunk] = useState<THREE.Mesh | null>(null);
  const [manualGrowthCounter, setManualGrowthCounter] = useState(0);

  // Calculate growth counter from growthPoints prop, or use manual counter as fallback
  const growthCounter = growthPoints !== undefined
    ? mapGrowthPointsToCounter(growthPoints, trunkGrowSteps)
    : manualGrowthCounter;

  useEffect(() => {   //initialize
    let trunkOriginTmp: THREE.Vector3 | null = null;
    const twigList: THREE.Mesh[] = [];
    const twigMaxPosList: THREE.Vector3[] = [];
    const twigLeaveMeshes: THREE.Mesh[] = [];
    const twigRegex = /^Twig\d+$/;
    
    if (!clonedScene) {
      return;
    }
    
    // Traverse scene to find meshes
    // GLB files can have different mesh types: Mesh, SkinnedMesh, InstancedMesh, etc.
    clonedScene.traverse((obj: THREE.Object3D) => {
      const objName = obj.name || '';
      const objType = (obj as any).type || obj.constructor.name;
      
      // Check if it's any type of mesh (Mesh, SkinnedMesh, InstancedMesh, etc.)
      const isMesh = obj instanceof THREE.Mesh || 
                     obj instanceof THREE.SkinnedMesh ||
                     objType === 'Mesh' ||
                     objType === 'SkinnedMesh' ||
                     (obj as any).isMesh === true;
      
      if (isMesh) {
        const mesh = obj as THREE.Mesh;
        const meshName = mesh.name || objName;
        
        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        if (meshName.includes('Trunk') && !trunkOriginTmp) {
          trunkOriginTmp = mesh.position.clone();
          setTrunk(mesh);
        }
        else if (twigRegex.test(meshName)) {
          const existingIndex = twigList.findIndex(t => t.name === meshName);
          if (existingIndex === -1) {
            twigList.push(mesh);
            twigMaxPosList.push(mesh.position.clone());
          }
        }
        else if (meshName.startsWith('Twig-Leaf')) {
          const existingIndex = twigLeaveMeshes.findIndex(l => l.name === meshName);
          if (existingIndex === -1) {
            // Disable shadows on leaves for better performance
            if (disableLeafShadows) {
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            }
            twigLeaveMeshes.push(mesh);
          }
        }
      }
      // If not a mesh but has the right name, it might be a group - check children
      else if (obj instanceof THREE.Object3D && objName) {
        // Check if this object's children contain meshes with matching names
        obj.children.forEach((child) => {
          const childType = (child as any).type || child.constructor.name;
          const isChildMesh = child instanceof THREE.Mesh || 
                              child instanceof THREE.SkinnedMesh ||
                              childType === 'Mesh' ||
                              childType === 'SkinnedMesh';
          
          if (isChildMesh) {
            const childMesh = child as THREE.Mesh;
            childMesh.castShadow = true;
            childMesh.receiveShadow = true;
            const childName = childMesh.name || objName;
            
            if ((childName.includes('Trunk') || objName.includes('Trunk')) && !trunkOriginTmp) {
              trunkOriginTmp = childMesh.position.clone();
              setTrunk(childMesh);
            }
            else if (twigRegex.test(childName) || twigRegex.test(objName)) {
              const nameToUse = twigRegex.test(childName) ? childName : objName;
              const existingIndex = twigList.findIndex(t => t.name === nameToUse);
              if (existingIndex === -1) {
                twigList.push(childMesh);
                twigMaxPosList.push(childMesh.position.clone());
              }
            }
            else if (childName.startsWith('Twig-Leaf') || objName.startsWith('Twig-Leaf')) {
              const nameToUse = childName.startsWith('Twig-Leaf') ? childName : objName;
              // Update the mesh name to ensure it matches what we expect
              if (!childMesh.name || !childMesh.name.startsWith('Twig-Leaf')) {
                childMesh.name = nameToUse;
              }
              const existingIndex = twigLeaveMeshes.findIndex(l => l.name === nameToUse);
              if (existingIndex === -1) {
                // Disable shadows on leaves for better performance
                if (disableLeafShadows) {
                  childMesh.castShadow = false;
                  childMesh.receiveShadow = false;
                }
                twigLeaveMeshes.push(childMesh);
              }
            }
          }
        });
      }
    });
    
    setTwigMeshes(twigList);
    setTwigMaxPositions(twigMaxPosList);
    setTrunkOrigin(trunkOriginTmp);

    const tmpTwigLeavesList: THREE.Mesh[][] = Array.from({ length: twigList.length }, () => []); // array of arrays of leaves per twig
    const tmpTwigLeavesMaxPositions: THREE.Vector3[][] = Array.from({ length: twigList.length }, () => []); // array of arrays of leaf max positions per twig (0.8x distance)
    
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

      if(twigNum >= 0 && twigNum < tmpTwigLeavesList.length){
        tmpTwigLeavesList[twigNum].push(leafMesh);
        // Calculate max position as 0.8x the distance from twig to leaf (same as original)
        // Formula: leafPos - (leafPos - twigPos) * 0.2 = twigPos + (leafPos - twigPos) * 0.8
        const twigPos = twigMaxPosList[twigNum];
        const leafToTwig = leafMesh.position.clone().sub(twigPos);
        const maxPos = twigPos.clone().add(leafToTwig.multiplyScalar(0.8));
        tmpTwigLeavesMaxPositions[twigNum].push(maxPos);
      }
    });
    setTwigLeavesList(tmpTwigLeavesList);
    setTwigLeavesMaxPositions(tmpTwigLeavesMaxPositions);

    // Merge leaf geometries per twig for better performance
    // This reduces from 1400+ individual meshes to ~10-20 merged meshes (one per twig)
    const mergedGeometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    
    tmpTwigLeavesList.forEach((leavesArray, twigIndex) => {
      if (leavesArray.length === 0) {
        mergedGeometries.push(new THREE.BufferGeometry());
        materials.push(new THREE.MeshStandardMaterial());
        return;
      }

      // Collect geometries from all leaves in this twig
      const geometries: THREE.BufferGeometry[] = [];
      let firstMaterial: THREE.Material | null = null;
      
      // Get twig position as reference point for relative positioning
      const twigBasePos = twigMaxPosList[twigIndex];
      
      leavesArray.forEach((leafMesh, leafIndex) => {
        // Check if geometry exists and is a valid type
        const sourceGeometry = leafMesh.geometry;
        if (!sourceGeometry) {
          return;
        }
        
        let geometry: THREE.BufferGeometry;
        
        // Handle different geometry types
        // Check type property first, then instanceof (some geometries might not pass instanceof check)
        const geometryType = (sourceGeometry as any).type || (sourceGeometry.constructor as any).name;
        const isBufferGeometry = sourceGeometry instanceof THREE.BufferGeometry || 
                                 geometryType === 'BufferGeometry' ||
                                 (sourceGeometry as any).isBufferGeometry === true;
        
        if (isBufferGeometry) {
          geometry = (sourceGeometry as THREE.BufferGeometry).clone();
        } else if ((sourceGeometry as any).isGeometry) {
          // Old Geometry type - skip for now (would need conversion)
          return;
        } else {
          // Try to use it anyway if it has the right methods
          if (sourceGeometry && typeof (sourceGeometry as any).clone === 'function') {
            geometry = (sourceGeometry as any).clone();
          } else {
            return;
          }
        }
        
        // Store leaf position data - we'll apply transforms at render time instead of merging
        // This way the geometry stays in its original space and we can apply the same transforms as the fallback
        // For now, we still need to position it relative to twig base, but we'll store the max position
        const leafMaxPos = tmpTwigLeavesMaxPositions[twigIndex][leafIndex];
        const leafRelativePos = leafMaxPos.clone().sub(twigBasePos);
        
        // Apply transform to position geometry relative to twig base (at max position)
        // This matches the fallback behavior where leaves scale from twig to max position
        const relativeMatrix = new THREE.Matrix4();
        relativeMatrix.compose(
          leafRelativePos, // Position at max distance from twig base
          (leafMesh as any).quaternion || new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1) // Don't apply mesh scale here - apply at render
        );
        
        // Apply the relative transform to the geometry
        geometry.applyMatrix4(relativeMatrix);
        
        geometries.push(geometry);
        
          if (!firstMaterial && leafMesh.material) {
            const sourceMaterial = Array.isArray(leafMesh.material) 
              ? leafMesh.material[0] 
              : leafMesh.material;
            // Clone the material to avoid sharing state between instances
            try {
              firstMaterial = sourceMaterial.clone();
            } catch (e) {
              // If cloning fails, use the original material
              firstMaterial = sourceMaterial;
            }
          }
      });

      if (geometries.length > 0) {
        try {
          // Merge all geometries into one
          const mergedGeometry = mergeGeometries(geometries);
          
          // Verify the merged geometry has valid data
          const positionAttr = mergedGeometry.attributes.position;
          if (positionAttr && positionAttr.count > 0) {
            // Compute bounding box and sphere for proper rendering
            mergedGeometry.computeBoundingBox();
            mergedGeometry.computeBoundingSphere();
            
            mergedGeometries.push(mergedGeometry);
            // Ensure material is cloned and has proper settings
            // Use the original material properties if available
            let finalMaterial: THREE.Material;
            if (firstMaterial) {
              try {
                finalMaterial = (firstMaterial as THREE.Material).clone();
                // Ensure material properties are set
                if ((finalMaterial as any).map) {
                  (finalMaterial as any).map.needsUpdate = true;
                }
                finalMaterial.needsUpdate = true;
              } catch (e) {
                // If cloning fails, create a new material with similar properties
                const sourceMat = firstMaterial as any;
                finalMaterial = new THREE.MeshStandardMaterial({
                  color: sourceMat.color?.getHex?.() || 0x2d5016,
                  map: sourceMat.map,
                  transparent: sourceMat.transparent ?? false,
                  opacity: sourceMat.opacity ?? 1.0,
                  side: THREE.DoubleSide,
                  metalness: sourceMat.metalness ?? 0.0,
                  roughness: sourceMat.roughness ?? 1.0
                });
              }
            } else {
              // Fallback material
              finalMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2d5016,
                transparent: false,
                opacity: 1.0,
                side: THREE.DoubleSide
              });
            }
            materials.push(finalMaterial);
          } else {
            // Empty geometry - push empty buffer geometry as fallback
            mergedGeometries.push(new THREE.BufferGeometry());
            materials.push(new THREE.MeshStandardMaterial());
          }
        } catch (error) {
          // On error, provide empty geometry as fallback
          mergedGeometries.push(new THREE.BufferGeometry());
          materials.push(new THREE.MeshStandardMaterial());
        }
      } else {
        mergedGeometries.push(new THREE.BufferGeometry());
        materials.push(new THREE.MeshStandardMaterial());
      }
    });
    
    setMergedLeafGeometries(mergedGeometries);
    setLeafMaterials(materials);

  }, [clonedScene, position, trunkGrowSteps, leavesPerTwig]);

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    getKey: () => {
      return position.toString();
    },
    grow: () => {
      // Optional manual growth - increment manual counter
      if (growthPoints === undefined) {
        setManualGrowthCounter((prev) => Math.min(prev + 1, trunkGrowSteps));
      }
    }
  }));

  // Calculate trunk scale based on growth counter - memoized
  // Ensure minimum scale of 0.05 (5%) so tree is always visible if growthPoints > 0
  const trunkScale = useMemo(() => Math.max(0.05, growthCounter / trunkGrowSteps), [growthCounter, trunkGrowSteps]);

  // Memoize twig scales to avoid recalculating on every render
  const twigScales = useMemo(() => {
    return twigMeshes.map((_, index) => calculateTwigScale(
      index,
      growthCounter,
      trunkGrowSteps,
      twigGrowSteps,
      twigMeshes.length
    ));
  }, [twigMeshes.length, growthCounter, trunkGrowSteps, twigGrowSteps]);

  // Memoize twig positions
  const twigPositions = useMemo(() => {
    return twigMaxPositions.map(pos => pos.clone().multiplyScalar(trunkScale));
  }, [twigMaxPositions, trunkScale]);

  // If trunk is not found, return null to fallback
  if (!trunk || !trunkOrigin) {
    return null;
  }

  return (
    <group position={position} {...otherProps}>
      <primitive 
        key={trunk.name}
        object={trunk}
        scale={[trunkScale, trunkScale, trunkScale]}  
      />

      {twigMeshes.map((twig, index) => {
        const twigScale = twigScales[index];
        if (twigScale === 0) return null;

        return (
          <primitive 
            key={twig.name}
            object={twig}
            position={twigPositions[index]}
            scale={[twigScale, twigScale, twigScale]}
          />
        );
      })}
      
      {/* Render merged leaves (optimized) or fall back to individual leaves */}
      {(() => {
        // Check if we have valid merged geometries
        const validMerged = mergedLeafGeometries.filter(g => 
          g && g.attributes && g.attributes.position && g.attributes.position.count > 0
        );
        return validMerged.length > 0;
      })() ? (
        // Render using merged geometries (optimized path)
        mergedLeafGeometries.map((mergedGeometry, twigIndex) => {
          const twigScale = twigScales[twigIndex];
          if(twigScale === 0) return null;
          
          if (!mergedGeometry || !mergedGeometry.attributes || !mergedGeometry.attributes.position || mergedGeometry.attributes.position.count === 0) {
            return null;
          }

          // Calculate twig origin position (matches fallback logic exactly)
          const twigVektor = twigMaxPositions[twigIndex].clone().sub(trunkOrigin!);
          const twigOriginPos = twigVektor.multiplyScalar(trunkScale);

          // Apply LOD
          const leavesArray = twigLeavesList[twigIndex] || [];
          if (maxVisibleLeaves && leavesArray.length > 0) {
            const maxLeavesForTwig = Math.floor((maxVisibleLeaves / twigLeavesList.length) * leavesArray.length);
            if (leavesArray.length > maxLeavesForTwig * 2) {
              return null;
            }
          }

          const material = leafMaterials[twigIndex];
          if (!material) {
            return null;
          }

          // Render merged leaves geometry
          // The merged geometry positions leaves at their max positions relative to twig base (0,0,0)
          // Group scale (twigScale) affects both position and size
          // Mesh scale (0.5) compensates to achieve desired leaf size
          return (
            <group
              key={`merged-leaves-group-${twigIndex}`}
              position={[twigOriginPos.x, twigOriginPos.y, twigOriginPos.z]}
              scale={[twigScale, twigScale, twigScale]}
            >
              <mesh
                key={`merged-leaves-${twigIndex}`}
                geometry={mergedGeometry}
                material={material}
                scale={[0.5, 0.5, 0.5]}
                castShadow={!disableLeafShadows}
                receiveShadow={!disableLeafShadows}
                frustumCulled={false}
              />
            </group>
          );
        })
      ) : (
        // Fallback: render individual leaves (matches original implementation)
        twigLeavesList.length > 0 ? (
          twigLeavesList.map((leavesArray, twigIndex) => {
            const twigScale = twigScales[twigIndex];
            if(twigScale === 0 || !leavesArray || leavesArray.length === 0) return null;
            
            const twigVektor = twigMaxPositions[twigIndex].clone().sub(trunkOrigin!);
            const twigOrigin = twigVektor.multiplyScalar(trunkScale);

            return (
              <React.Fragment key={`leaves-${twigIndex}`}>
                {leavesArray.map((leafMesh, leafIndex) => {
                  if (!leafMesh) return null;
                  
                  // Calculate leaf position using original logic
                  const leafMaxPos = twigLeavesMaxPositions[twigIndex]?.[leafIndex];
                  if (!leafMaxPos) {
                    // Fallback: calculate from mesh position directly
                    const twigPos = twigMaxPositions[twigIndex];
                    const leafToTwig = leafMesh.position.clone().sub(twigPos);
                    const estimatedMaxPos = twigPos.clone().add(leafToTwig.multiplyScalar(0.8));
                    const leafVektor = estimatedMaxPos.clone().sub(twigPos);
                    const leafOrigin = twigOrigin.clone().add(leafVektor.multiplyScalar(twigScale));
                    
                    return (
                      <primitive 
                        key={leafMesh.name}
                        object={leafMesh}
                        position={leafOrigin}
                        scale={[twigScale / 10, twigScale / 10, twigScale / 10]}
                      />
                    );
                  }
                  
                  const twigPos = twigMaxPositions[twigIndex];
                  const leafVektor = leafMaxPos.clone().sub(twigPos);
                  const leafOrigin = twigOrigin.clone().add(leafVektor.multiplyScalar(twigScale));
                  
                  return (
                    <primitive 
                      key={leafMesh.name}
                      object={leafMesh}
                      position={leafOrigin}
                      scale={[twigScale / 10, twigScale / 10, twigScale / 10]}
                    />
                  );
                })}
              </React.Fragment>
            );
          })
        ) : null
      )}
    </group>
  );
});

TreeComponent.displayName = 'TreeComponent';

export default TreeComponent;

