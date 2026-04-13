import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import ForestScene from '../../components/3d/ForestScene';
import ForestPlayerCharacter from '../../components/PlayerProfile/ForestPlayerCharacter';
import PlayerProfileTypeModal from '../../components/PlayerProfile/PlayerProfileTypeModal';
import './ForestPage.css';

function ForestPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const userPoints = useAuthStore((s) => s.user?.points || 0);


  const isLikelyAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);
  const lowPerfForestMode = useMemo(() => {
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    const lowMem = typeof deviceMemory === 'number' && deviceMemory <= 4;
    const lowCpu = cores <= 6;
    return isLikelyAndroid && (lowMem || lowCpu);
  }, [isLikelyAndroid]);

  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 }
  );

  const { data: progress } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'task:update' || event.detail?.type === 'photo:task:update') {
        queryClient.invalidateQueries(['userProgress', userId]);
        queryClient.invalidateQueries(['userActiveTeam', userId]);
        queryClient.invalidateQueries(['tasks']);
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

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.visitForest();
        if (result.success && !cancelled) {
          await api.refreshMe();
        }
      } catch (error) {
        console.debug('Forest visit:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="forest-page forest-page--immersive">
      <div className="forest-viewport">
        <div className="forest-container">
          <Suspense fallback={<div className="forest-loading">{t('forest.loading')}</div>}>
            <Canvas
              gl={{
                antialias: false,
                powerPreference: lowPerfForestMode ? 'default' : 'high-performance',
                alpha: false,
                stencil: false,
                depth: true,
              }}
              shadows={!lowPerfForestMode}
              dpr={lowPerfForestMode ? 1 : [1, 1.5]}
              performance={{ min: lowPerfForestMode ? 0.45 : 0.7 }}
              frameloop={lowPerfForestMode ? 'demand' : 'always'}
              camera={{ position: [0, 12, 22], fov: 50 }}
              style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #dff3ff 0%, #eaf8ff 45%, #f4fbff 100%)' }}
            >
              <ForestScene plantedTrees={progress?.treesPlanted} />
            </Canvas>
          </Suspense>
        </div>

        {(user?.playerProfile || (user && progress)) && (
          <div className="forest-hud">
            <div className="forest-hud__bottom">
              {user?.playerProfile && (
                <div className="forest-hud__player">
                  <ForestPlayerCharacter
                    variant="overlay"
                    user={user}
                    onOpenMore={() => setTypeModalOpen(true)}
                  />
                </div>
              )}
              {user && progress && (
                <div
                  className="forest-impact-stats forest-impact-stats--overlay"
                  aria-label={t('home.impactTitle')}
                >
                  <div className="forest-stat">
                    <div className="forest-stat-icon">⭐</div>
                    <span className="forest-stat-value">
                      {activeTeam?.totalPoints !== undefined && activeTeam.totalPoints !== null ? (
                        <>
                          {activeTeam.totalPoints} / {userPoints}
                        </>
                      ) : (
                        userPoints
                      )}
                    </span>
                    <span className="forest-stat-label">
                      {activeTeam?.totalPoints !== undefined && activeTeam.totalPoints !== null
                        ? t('home.stats.teamPoints')
                        : t('home.stats.totalPoints')}
                    </span>
                  </div>
                  {(progress?.treesPlanted ?? 0) > 0 && (
                    <div className="forest-stat">
                      <div className="forest-stat-icon">🌲</div>
                      <span className="forest-stat-value">{progress.treesPlanted}</span>
                      <span className="forest-stat-label">{t('home.stats.treesPlanted')}</span>
                    </div>
                  )}
                  {(progress?.tasksCompleted ?? 0) > 0 && (
                    <div className="forest-stat">
                      <div className="forest-stat-icon">✅</div>
                      <span className="forest-stat-value">{progress.tasksCompleted}</span>
                      <span className="forest-stat-label">{t('home.stats.tasksCompleted')}</span>
                    </div>
                  )}
                  {progress?.co2Saved !== undefined &&
                    progress?.co2Saved !== null &&
                    Number(progress.co2Saved) > 0 && (
                      <div className="forest-stat">
                        <div className="forest-stat-icon">🌍</div>
                        <span className="forest-stat-value">
                          {Number(progress.co2Saved).toFixed(1)} kg
                        </span>
                        <span className="forest-stat-label">{t('home.stats.co2Saved')}</span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {user?.playerProfile && typeModalOpen && (
        <PlayerProfileTypeModal
          profile={user.playerProfile}
          onClose={() => setTypeModalOpen(false)}
        />
      )}
    </div>
  );
}

export default ForestPage;
