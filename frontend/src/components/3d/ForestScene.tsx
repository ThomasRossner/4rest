import { useQuery } from 'react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import { Tree } from './Tree';
import { OrbitControls } from '@react-three/drei';
import { useAuthStore } from '../../stores/authStore';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ForestScene() {
  const { data: forest, refetch: refetchForest } = useQuery('forest', () => api.getForest());
  const currentUser = useAuthStore((s) => s.user);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  // Track camera movement state using ref (no React re-renders)
  // This allows us to skip expensive calculations during camera movement
  const isCameraMovingRef = useRef(false);
  const lastCameraPositionRef = useRef(camera.position.clone());
  const cameraMoveCheckTimeoutRef = useRef<number | null>(null);
  
  // Cache LOD values per tree to avoid recalculating on every render
  const treeLodCacheRef = useRef<Map<string, number | undefined>>(new Map());
  
  // Track camera movement - update ref only (no state updates during movement)
  useFrame((state, delta) => {
    const cameraMoved = camera.position.distanceTo(lastCameraPositionRef.current) > 0.05;
    
    if (cameraMoved) {
      isCameraMovingRef.current = true;
      lastCameraPositionRef.current.copy(camera.position);
      
      // Clear any pending timeout
      if (cameraMoveCheckTimeoutRef.current !== null) {
        window.clearTimeout(cameraMoveCheckTimeoutRef.current);
      }
      
      // Set camera as stopped after movement stops for 200ms
      cameraMoveCheckTimeoutRef.current = window.setTimeout(() => {
        isCameraMovingRef.current = false;
        // Recalculate LOD when camera stops (this will trigger a single render)
        treeLodCacheRef.current.clear();
        cameraMoveCheckTimeoutRef.current = null;
      }, 200);
    }
  });
  
  const getMaxLeavesForDistance = useMemo(() => {
    return (distance: number) => {
      // LOD system for performance - reduces leaves based on distance
      // Increased minimums to ensure distant trees still show some leaves
      if (distance > 50) return 40;   // Minimum leaves for very far trees (increased from 20)
      if (distance > 35) return 80;   // Few leaves (increased from 60)
      if (distance > 20) return 120;  // Medium leaves
      return 200;                     // Cap close trees
    };
  }, []);
  
  // Extract areas and flatTrees before using them in useEffect
  const areas = forest?.areas || [];
  const flatTrees = forest?.trees || [];
  
  // Memoize tree world positions to avoid recalculating on every render
  const treeWorldPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  
  // Rebuild tree positions cache when forest data changes
  useEffect(() => {
    treeWorldPositionsRef.current.clear();
    treeLodCacheRef.current.clear(); // Clear LOD cache when trees change
    // Pre-calculate world positions for all trees
    if (areas.length > 0) {
      areas.forEach((area: any) => {
        const origin = area.origin as [number, number, number];
        area.trees?.forEach((t: any) => {
          const treeLocalPos = (t.localPosition || t.position) as [number, number, number];
          const treeKey = `tree-${t.id}`;
          treeWorldPositionsRef.current.set(treeKey, new THREE.Vector3(
            origin[0] + treeLocalPos[0],
            origin[1] + treeLocalPos[1],
            origin[2] + treeLocalPos[2]
          ));
        });
      });
    } else if (flatTrees.length > 0) {
      flatTrees.forEach((t: any) => {
        const treePos = t.position as [number, number, number];
        const treeKey = `flat-tree-${t.id}`;
        treeWorldPositionsRef.current.set(treeKey, new THREE.Vector3(treePos[0], treePos[1], treePos[2]));
      });
    }
  }, [areas, flatTrees]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (cameraMoveCheckTimeoutRef.current !== null) {
        window.clearTimeout(cameraMoveCheckTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle daily forest visit on component mount
  useEffect(() => {
    const handleDailyVisit = async () => {
      if (!currentUser) return;
      
      try {
        const result = await api.visitForest();
        if (result.success) {
          // Refetch forest data to get updated growth points
          refetchForest();
        }
      } catch (error) {
        // Silently handle errors (e.g., already visited today)
        console.debug('Forest visit:', error);
      }
    };
    
    handleDailyVisit();
  }, [currentUser, refetchForest]);

  const myOrigin = useMemo(() => {
    if (!currentUser || areas.length === 0) return null;
    
    // Calculate the center of all blocks for this user
    // Since blocks are in a square grid centered around the primary origin,
    // we calculate the center by averaging all block origins
    const sumX = areas.reduce((sum, a: any) => sum + a.origin[0], 0);
    const sumZ = areas.reduce((sum, a: any) => sum + a.origin[2], 0);
    const centerX = sumX / areas.length;
    const centerZ = sumZ / areas.length;
    
    return [centerX, 0, centerZ] as [number, number, number];
  }, [areas, currentUser?.id]);

  useEffect(() => {
    if (!myOrigin) return;
    // Position camera offset from the center and look at the center
    camera.position.set(myOrigin[0] + 10, 10, myOrigin[2] + 10);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(myOrigin[0], 0, myOrigin[2]);
      controlsRef.current.update();
    }
  }, [myOrigin, camera]);

  // Clamp camera position to prevent going below ground surface
  useFrame(() => {
    const minY = 0.5; // Minimum height above ground
    if (camera.position.y < minY) {
      camera.position.y = minY;
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      {/* Background ground (covers multiple areas) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* Render user's forest areas */}
      {areas.length > 0 && areas.map((area: any) => {
        const origin = area.origin as [number, number, number];
        // Create unique key from origin coordinates
        const uniqueKey = `${origin[0]}-${origin[2]}`;
        return (
          <group key={uniqueKey} position={origin}>
            {/* Area ground tile - positioned to cover 0-20 range (not centered) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[10, 0.001, 10]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#5b8f69" />
            </mesh>
            {/* Area border (perimeter only) - covers 0-20 range, aligned with ground tile */}
            <lineSegments position={[0, 0.012, 0]}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={8}
                  array={new Float32Array([
                    0, 0, 0,    // Top-left (at block origin)
                    20, 0, 0,   // Top-right
                    20, 0, 0,   // Top-right
                    20, 0, 20,  // Bottom-right
                    20, 0, 20,  // Bottom-right
                    0, 0, 20,   // Bottom-left
                    0, 0, 20,   // Bottom-left
                    0, 0, 0,    // Top-left (close the square)
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#e9f2ec" transparent opacity={0.7} />
            </lineSegments>
            {/* Trees in this area should use local positions (relative to origin) */}
            {area.trees?.map((t: any) => {
              const treeLocalPos = (t.localPosition || t.position) as [number, number, number];
              
              // Use cached world position (calculated in useEffect)
              const treeKey = `tree-${t.id}`;
              const treeWorldPos = treeWorldPositionsRef.current.get(treeKey);
              
              // Calculate distance and LOD for this tree
              let distance: number | undefined;
              let maxLeaves: number | undefined;
              
              if (treeWorldPos) {
                // Skip rendering trees that are too far away (camera frustum culling)
                // During camera movement: use cached distance (no calculations)
                // When camera stops: calculate and cache distance
                if (isCameraMovingRef.current) {
                  // During movement: use cached distance, fallback to rendering (no calculation)
                  distance = treeLodCacheRef.current.get(`${treeKey}-distance`) ?? 0;
                } else {
                  // Camera stopped: calculate distance once and cache it
                  distance = camera.position.distanceTo(treeWorldPos);
                  treeLodCacheRef.current.set(`${treeKey}-distance`, distance);
                }
                
                // Only skip rendering if we have a cached distance > 150
                // Increased from 40 to 150 to accommodate forests spread across multiple blocks
                if (distance > 150) {
                  return null;
                }
                
                // Calculate LOD value when camera is not moving
                if (!isCameraMovingRef.current && distance !== undefined) {
                  maxLeaves = getMaxLeavesForDistance(distance);
                  // Cache the result
                  treeLodCacheRef.current.set(treeKey, maxLeaves);
                } else {
                  // Use cached value during camera movement (prevents re-renders)
                  maxLeaves = treeLodCacheRef.current.get(treeKey);
                }
              }
              
              return (
                <Tree 
                  key={t.id} 
                  position={treeLocalPos}
                  size={t.size}
                  growthPoints={t.growthPoints}
                  maxVisibleLeaves={maxLeaves}
                />
              );
            })}
          </group>
        );
      })}

      {/* Fallback: render flat list if areas not provided */}
      {areas.length === 0 && flatTrees.map((t: any) => {
        const treePos = t.position as [number, number, number];
        
        // Use cached world position (calculated in useEffect)
        const treeKey = `flat-tree-${t.id}`;
        const treeWorldPos = treeWorldPositionsRef.current.get(treeKey);
        
        // Calculate distance and LOD for this tree (same logic as area trees)
        let distance: number | undefined;
        let maxLeaves: number | undefined;
        
        if (treeWorldPos) {
          // Skip rendering trees that are too far away (camera frustum culling)
          // During camera movement: use cached distance (no calculations)
          // When camera stops: calculate and cache distance
          if (isCameraMovingRef.current) {
            // During movement: use cached distance, fallback to rendering (no calculation)
            distance = treeLodCacheRef.current.get(`${treeKey}-distance`) ?? 0;
          } else {
            // Camera stopped: calculate distance once and cache it
            distance = camera.position.distanceTo(treeWorldPos);
            treeLodCacheRef.current.set(`${treeKey}-distance`, distance);
          }
          
          // Only skip rendering if we have a cached distance > 150
          // Increased from 40 to 150 to accommodate forests spread across multiple blocks
          if (distance > 150) {
            return null;
          }
          
          // Calculate LOD value when camera is not moving
          if (!isCameraMovingRef.current && distance !== undefined) {
            maxLeaves = getMaxLeavesForDistance(distance);
            // Cache the result
            treeLodCacheRef.current.set(treeKey, maxLeaves);
          } else {
            // Use cached value during camera movement (prevents re-renders)
            maxLeaves = treeLodCacheRef.current.get(treeKey);
          }
        }
        
        return (
          <Tree 
            key={t.id} 
            position={treePos}
            size={t.size}
            growthPoints={t.growthPoints}
            maxVisibleLeaves={maxLeaves}
          />
        );
      })}

      {/* Controls centered on user's area when available */}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={75}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={0}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
      />
    </>
  );
}

export default ForestScene;
