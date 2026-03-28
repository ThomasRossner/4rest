import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, PerspectiveCamera } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import ForestScene from '../../components/3d/ForestScene';
import './ForestPage.css';

function ForestPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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

  // Listen for WebSocket task updates to refresh data
  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'task:update' || event.detail?.type === 'photo:task:update') {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['userProgress', userId]);
        queryClient.invalidateQueries(['userActiveTeam', userId]);
        queryClient.invalidateQueries(['tasks']);
        // Refresh user data to update points
        api.refreshMe().catch((error) => {
          console.debug('Failed to refresh user data:', error);
        });
      }
    };

    window.addEventListener('data:update', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('data:update', handleUpdate as EventListener);
    };
  }, [queryClient, userId]);

  return (
    <div className="forest-page">
      {user && progress && (
        <section className="home-section" style={{ marginBottom: '2rem' }}>
          <div className="home-section-header">
            <h2 className="home-section-title">{t('home.impactTitle')}</h2>
          </div>
          <div className="home-stats">
            <div className="home-stat">
              <div className="home-stat-icon">⭐</div>
              <span className="home-stat-value">
                {activeTeam?.totalPoints !== undefined && activeTeam.totalPoints !== null ? (
                  <>
                    {activeTeam.totalPoints} / {userPoints}
                  </>
                ) : (
                  userPoints
                )}
              </span>
              <span className="home-stat-label">
                {activeTeam?.totalPoints !== undefined && activeTeam.totalPoints !== null
                  ? t('home.stats.teamPoints')
                  : t('home.stats.totalPoints')
                }
              </span>
            </div>
            {((progress?.treesPlanted ?? 0) > 0) && (
              <div className="home-stat">
                <div className="home-stat-icon">🌲</div>
                <span className="home-stat-value">{progress.treesPlanted}</span>
                <span className="home-stat-label">{t('home.stats.treesPlanted')}</span>
              </div>
            )}
            {((progress?.tasksCompleted ?? 0) > 0) && (
              <div className="home-stat">
                <div className="home-stat-icon">✅</div>
                <span className="home-stat-value">{progress.tasksCompleted}</span>
                <span className="home-stat-label">{t('home.stats.tasksCompleted')}</span>
              </div>
            )}
            {progress?.co2Saved !== undefined && progress?.co2Saved !== null && Number(progress.co2Saved) > 0 && (
              <div className="home-stat">
                <div className="home-stat-icon">🌍</div>
                <span className="home-stat-value">{Number(progress.co2Saved).toFixed(1)} kg</span>
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
