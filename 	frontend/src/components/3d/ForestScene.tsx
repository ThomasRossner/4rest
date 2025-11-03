import { useQuery } from 'react-query';
import { useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';
import { Tree } from './Tree';
import { Html, OrbitControls } from '@react-three/drei';
import { useAuthStore } from '../../stores/authStore';
import { useThree, useFrame } from '@react-three/fiber';

function ForestScene() {
  const { data: forest } = useQuery('forest', () => api.getForest());
  const currentUser = useAuthStore((s) => s.user);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const areas = forest?.areas || [];
  const flatTrees = forest?.trees || [];

  const myOrigin = useMemo(() => {
    if (!currentUser) return null;
    const found = areas.find((a: any) => a.userId === currentUser.id);
    return (found?.origin as [number, number, number]) || null;
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

      {/* Render per-user areas if available */}
      {areas.length > 0 && areas.map((area: any, idx: number) => {
        const origin = area.origin as [number, number, number];
        return (
          <group key={area.userId || idx} position={origin}>
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
            {/* Area label: only show for current user and use their name */}
            {currentUser && area.userId === currentUser.id && (
              <Html position={[0, 0.05, 0]} center>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  {currentUser.name}
                </div>
              </Html>
            )}
            {/* Trees in this area should use local positions (relative to origin) */}
            {area.trees?.map((t: any) => (
              <Tree key={t.id} position={(t.localPosition || t.position) as [number, number, number]} />
            ))}
          </group>
        );
      })}

      {/* Fallback: render flat list if areas not provided */}
      {areas.length === 0 && flatTrees.map((t: any) => (
        <Tree key={t.id} position={t.position as [number, number, number]} />
      ))}

      {/* Controls centered on user's area when available */}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={0}
      />
    </>
  );
}

export default ForestScene;
