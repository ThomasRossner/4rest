import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, PerspectiveCamera } from '@react-three/drei';
import ForestScene from '../../components/3d/ForestScene';
import './ForestPage.css';

function ForestPage() {
  return (
    <div className="forest-page">
      <h1 className="forest-title">Virtual Forest</h1>
      <p className="forest-subtitle">Watch your trees grow as you complete sustainable actions</p>
      <div className="forest-container">
        <Suspense fallback={<div className="forest-loading">Loading forest...</div>}>
          <Canvas
            gl={{ antialias: true }}
            shadows
            style={{ width: '100%', height: '100%' }}
          >
            <PerspectiveCamera makeDefault position={[10, 10, 10]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Sky sunPosition={[100, 20, 100]} />
            <ForestScene />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={5}
              maxDistance={50}
            />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}

export default ForestPage;
