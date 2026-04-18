import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import ForestPrototypeScene, {
  FOREST_DEFAULT_CAMERA,
  FOREST_PROTOTYPE_TREE_GROW_STEPS,
} from '../ForestPrototypeScene';

const TREE_GROW_STEPS = FOREST_PROTOTYPE_TREE_GROW_STEPS;

/**
 * Ursprünglicher Prototyp aus dem modularen Tree-System (Commit 3a39b6cf):
 * Boden ground2.glb + Baum-Anker + ControllableTree, gesteuert über Punkte.
 * Früher mit „leva“-Panel; hier per Slider wie Forest Lab, ohne extra Dependency.
 */
export default function TreeSystemPrototypeApp() {
  const [maxGlobalPoints, setMaxGlobalPoints] = useState(100);
  const [globalPoints, setGlobalPoints] = useState(0);

  return (
    <div
      className="tree-system-prototype-app"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: '#0f172a',
          color: '#e2e8f0',
          fontSize: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <strong>Tree-System-Prototyp (App.jsx)</strong>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          globalPoints: {globalPoints}
          <input
            type="range"
            min={0}
            max={maxGlobalPoints}
            value={globalPoints}
            onChange={(e) => setGlobalPoints(Number(e.target.value))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          maxPoints: {maxGlobalPoints}
          <input
            type="range"
            min={TREE_GROW_STEPS + 1}
            max={5000}
            value={maxGlobalPoints}
            onChange={(e) => setMaxGlobalPoints(Number(e.target.value))}
          />
        </label>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Suspense fallback={<div style={{ padding: 24, color: '#94a3b8' }}>Loading 3D…</div>}>
          <Canvas
            shadows
            camera={{
              position: [...FOREST_DEFAULT_CAMERA.position],
              fov: FOREST_DEFAULT_CAMERA.fov,
            }}
            style={{ width: '100%', height: '100%', background: '#1a2840' }}
          >
            <ForestPrototypeScene
              globalPoints={globalPoints}
              maxPoints={maxGlobalPoints}
              treeGrowSteps={TREE_GROW_STEPS}
            />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
