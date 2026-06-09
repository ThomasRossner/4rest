import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mapGrowthPointsToCounter, calculateTwigScale } from './growthMapper';
import { getProcessedTreeModel } from '../../../utils/treeModelCache';

// Preload the tree model for better performance (also preloaded in main.tsx)
useGLTF.preload('/old-models/twigLeafTree.glb');

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
    modelPath = '/old-models/twigLeafTree.glb',
    trunkGrowSteps = 20,
    twigGrowSteps = 8,
    leavesPerTwig = 32,
    growthPoints,
    maxVisibleLeaves,
    disableLeafShadows = true, // Default to true for performance
    ...otherProps
  } = props;

  const gltf = useGLTF(modelPath);
  const baseScene = useMemo(() => {
    const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene;
    return scene;
  }, [gltf]);

  // Process and cache the heavy scene traversal and leaf merging once per GLTF scene
  const processedModel = useMemo(
    () =>
      getProcessedTreeModel(baseScene, {
        leavesPerTwig,
        disableLeafShadows,
      }),
    [baseScene, leavesPerTwig, disableLeafShadows]
  );

  // Clone meshes per tree instance so transforms remain independent
  const trunk = useMemo<THREE.Mesh | null>(() => {
    if (!processedModel.trunkMesh) return null;
    const cloned = processedModel.trunkMesh.clone(true);
    cloned.castShadow = true;
    cloned.receiveShadow = true;
    return cloned;
  }, [processedModel.trunkMesh]);

  const twigMeshes = useMemo<THREE.Mesh[]>(() => {
    return processedModel.twigMeshes.map((twig) => {
      const cloned = twig.clone(true);
      cloned.castShadow = true;
      cloned.receiveShadow = true;
      return cloned;
    });
  }, [processedModel.twigMeshes]);

  const twigMaxPositions = processedModel.twigMaxPositions;
  const twigLeavesList = processedModel.twigLeavesList;
  const twigLeavesMaxPositions = processedModel.twigLeavesMaxPositions;
  const mergedLeafGeometries = processedModel.mergedLeafGeometries;
  const leafMaterials = processedModel.leafMaterials;
  const trunkOrigin = processedModel.trunkOrigin;

  const [manualGrowthCounter, setManualGrowthCounter] = React.useState(0);

  // Calculate growth counter from growthPoints prop, or use manual counter as fallback
  const growthCounter = growthPoints !== undefined
    ? mapGrowthPointsToCounter(growthPoints, trunkGrowSteps)
    : manualGrowthCounter;

  // All heavy scene processing now happens inside the shared cache in `treeModelCache.ts`

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
  // Ensure minimum scale of 0.10 (10%) so new trees are clearly visible (200% larger than before)
  const trunkScale = useMemo(() => Math.max(0.10, growthCounter / trunkGrowSteps), [growthCounter, trunkGrowSteps]);

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

          // Apply LOD - only hide twigs if they have significantly more leaves than allowed
          // This prevents hiding twigs when LOD is just reducing leaf count slightly
          const leavesArray = twigLeavesList[twigIndex] || [];
          if (maxVisibleLeaves && leavesArray.length > 0) {
            const maxLeavesForTwig = Math.floor((maxVisibleLeaves / twigLeavesList.length) * leavesArray.length);
            // Only hide twig if it has way too many leaves (more than 5x the limit)
            // This allows LOD to work while still showing some leaves on distant trees
            if (maxLeavesForTwig > 0 && leavesArray.length > maxLeavesForTwig * 5) {
              return null;
            }
            // If maxLeavesForTwig is 0 or very small, still show the twig (it will be handled by merged geometry)
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
                {leavesArray.map((leafMeshTemplate, leafIndex) => {
                  if (!leafMeshTemplate) return null;
                  
                  // Calculate leaf position using original logic
                  const leafMaxPos = twigLeavesMaxPositions[twigIndex]?.[leafIndex];
                  if (!leafMaxPos) {
                    // Fallback: calculate from mesh position directly
                    const twigPos = twigMaxPositions[twigIndex];
                    const leafToTwig = leafMeshTemplate.position.clone().sub(twigPos);
                    const estimatedMaxPos = twigPos.clone().add(leafToTwig.multiplyScalar(0.8));
                    const leafVektor = estimatedMaxPos.clone().sub(twigPos);
                    const leafOrigin = twigOrigin.clone().add(leafVektor.multiplyScalar(twigScale));
                    const leafMesh = leafMeshTemplate.clone(true);
                    
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
                  const leafMesh = leafMeshTemplate.clone(true);
                  
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
