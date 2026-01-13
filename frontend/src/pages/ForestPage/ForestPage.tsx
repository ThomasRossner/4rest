import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, PerspectiveCamera } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import ForestScene from '../../components/3d/ForestScene';
import './ForestPage.css';

function ForestPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const userPoints = useAuthStore((s) => s.user?.points || 0);

  // Get active team and total points
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 }
  );

  const { data: progress, isLoading: progressLoading } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  return (
    <div className="forest-page">
      <h1 className="forest-title">{t('forest.title')}</h1>
      <p className="forest-subtitle">{t('forest.subtitle')}</p>
      
      {user && progress && (
        <section className="home-section" style={{ marginBottom: '2rem' }}>
          <div className="home-section-header">
            <h2 className="home-section-title">{t('home.impactTitle')}</h2>
            <p className="home-section-subtitle">{t('home.impactSubtitle')}</p>
          </div>
          <div className="home-stats">
            <div className="home-stat">
              <div className="home-stat-icon">⭐</div>
              <span className="home-stat-value">
                {activeTeam?.totalPoints !== undefined ? (
                  <>
                    {activeTeam.totalPoints} / {userPoints}
                  </>
                ) : (
                  userPoints
                )}
              </span>
              <span className="home-stat-label">
                {activeTeam?.totalPoints !== undefined 
                  ? t('home.stats.teamPoints')
                  : t('home.stats.totalPoints')
                }
              </span>
            </div>
            <div className="home-stat">
              <div className="home-stat-icon">🌲</div>
              <span className="home-stat-value">{progress?.treesPlanted || 0}</span>
              <span className="home-stat-label">{t('home.stats.treesPlanted')}</span>
            </div>
            <div className="home-stat">
              <div className="home-stat-icon">✅</div>
              <span className="home-stat-value">{progress?.tasksCompleted || 0}</span>
              <span className="home-stat-label">{t('home.stats.tasksCompleted')}</span>
            </div>
            {progress?.co2Saved && progress.co2Saved > 0 && (
              <div className="home-stat">
                <div className="home-stat-icon">🌍</div>
                <span className="home-stat-value">{progress.co2Saved.toFixed(1)} kg</span>
                <span className="home-stat-label">{t('home.stats.co2Saved')}</span>
              </div>
            )}
          </div>
        </section>
      )}
      
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
