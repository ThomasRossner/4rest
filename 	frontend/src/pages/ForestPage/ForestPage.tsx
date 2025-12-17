import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, PerspectiveCamera } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import ForestScene from '../../components/3d/ForestScene';
import './ForestPage.css';

function ForestPage() {
  const { t } = useTranslation();
  return (
    <div className="forest-page">
      <h1 className="forest-title">{t('forest.title')}</h1>
      <p className="forest-subtitle">{t('forest.subtitle')}</p>
      <div className="forest-container">
        <Suspense fallback={<div className="forest-loading">{t('forest.loading')}</div>}>
          <Canvas
            gl={{ 
              // Disable antialiasing to reduce GPU cost on low-end devices
              antialias: false,
              powerPreference: "high-performance",
              alpha: false,
              stencil: false,
              depth: true
            }}
            shadows
            // Slightly lower device pixel ratio for better performance
            dpr={[1, 1.5]}
            // Bias toward keeping FPS up by dynamically reducing quality when needed
            performance={{ min: 0.7 }}
            frameloop="always"
            style={{ width: '100%', height: '100%' }}
          >
            <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={75} />
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[30, 40, 20]}
              intensity={1.1}
              castShadow
              // Smaller shadow map for cheaper rendering
              shadow-mapSize-width={512}
              shadow-mapSize-height={512}
              shadow-camera-near={1}
              shadow-camera-far={200}
              shadow-camera-left={-120}
              shadow-camera-right={120}
              shadow-camera-top={120}
              shadow-camera-bottom={-120}
              shadow-bias={-0.0005}
            />
            <Sky sunPosition={[100, 20, 100]} />
            <ForestScene />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}

export default ForestPage;
