import { useQuery } from 'react-query';
import { useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';
import { Tree } from './Tree';
import { OrbitControls } from '@react-three/drei';
import { useAuthStore } from '../../stores/authStore';
import { useThree, useFrame } from '@react-three/fiber';

function ForestScene() {
  const { data: forest, refetch: refetchForest } = useQuery('forest', () => api.getForest());
  const currentUser = useAuthStore((s) => s.user);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
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

  const areas = forest?.areas || [];
  const flatTrees = forest?.trees || [];

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
            {/* Area ground tile */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.001, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#5b8f69" />
            </mesh>
            {/* Area border (perimeter only) */}
            <lineSegments position={[0, 0.012, 0]}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={8}
                  array={new Float32Array([
                    -10, 0, -10,  // Top-left
                    10, 0, -10,   // Top-right
                    10, 0, -10,   // Top-right
                    10, 0, 10,    // Bottom-right
                    10, 0, 10,    // Bottom-right
                    -10, 0, 10,   // Bottom-left
                    -10, 0, 10,   // Bottom-left
                    -10, 0, -10,  // Top-left (close the square)
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#e9f2ec" transparent opacity={0.7} />
            </lineSegments>
            {/* Trees in this area should use local positions (relative to origin) */}
            {area.trees?.map((t: any) => (
              <Tree 
                key={t.id} 
                position={(t.localPosition || t.position) as [number, number, number]}
                size={t.size}
                stage={t.stage}
              />
            ))}
          </group>
        );
      })}

      {/* Fallback: render flat list if areas not provided */}
      {areas.length === 0 && flatTrees.map((t: any) => (
        <Tree 
          key={t.id} 
          position={t.position as [number, number, number]}
          size={t.size}
          stage={t.stage}
        />
      ))}

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
      />
    </>
  );
}

export default ForestScene;
