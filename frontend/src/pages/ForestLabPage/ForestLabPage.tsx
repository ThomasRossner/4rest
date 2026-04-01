import { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAuthStore } from '../../stores/authStore';
import SceneController from '../../components/3d/tree-system/SceneController.jsx';
import './ForestLabPage.css';

const TREE_GROW_STEPS = 30;

/**
 * Design-/QA-Route: Boden ground2 + Anker + ControllableTree (nicht der Produktions-Wald).
 */
export default function ForestLabPage() {
  const user = useAuthStore((s) => s.user);
  const fp = user?.forestPoints;

  const sumForestPoints = useMemo(() => {
    if (!fp) return 0;
    return fp.kommunikation + fp.mensch + fp.natur + fp.ressourcen;
  }, [fp]);

  const defaultMax = Math.max(100, sumForestPoints + 50, TREE_GROW_STEPS + 1);
  const [maxPoints, setMaxPoints] = useState(defaultMax);
  const [globalPoints, setGlobalPoints] = useState(0);

  return (
    <div className="forest-lab-page">
      <div className="forest-lab-panel">
        <h1 className="forest-lab-title">Forest Lab</h1>
        <label className="forest-lab-label">
          globalPoints: {globalPoints}
          <input
            type="range"
            min={0}
            max={maxPoints}
            value={globalPoints}
            onChange={(e) => setGlobalPoints(Number(e.target.value))}
          />
        </label>
        <label className="forest-lab-label">
          maxPoints: {maxPoints}
          <input
            type="range"
            min={TREE_GROW_STEPS + 1}
            max={5000}
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
          />
        </label>
        <p className="forest-lab-hint">
          Wald-Kategorie-Summe (User): {sumForestPoints} — Produktions-Wald bleibt unter /forest.
        </p>
      </div>
      <div className="forest-lab-canvas-wrap">
        <Suspense fallback={<div className="forest-lab-loading">Loading…</div>}>
          <Canvas
            shadows
            camera={{ position: [0, 12, 22], fov: 50 }}
            style={{ width: '100%', height: '100%', background: '#1a2840' }}
          >
            <OrbitControls zoomSpeed={0.2} zoomToCursor />
            <gridHelper args={[10, 10]} />
            <SceneController globalPoints={globalPoints} maxPoints={maxPoints} treeGrowSteps={TREE_GROW_STEPS} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
