import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import ForestPrototypeScene, {
  FOREST_PROTOTYPE_TREE_GROW_STEPS,
} from '../../components/3d/ForestPrototypeScene';
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

  const sumForestPoints = useMemo(() => {
    const fp = user?.forestPoints;
    if (!fp) return 0;
    return fp.kommunikation + fp.mensch + fp.natur + fp.ressourcen;
  }, [user?.forestPoints]);
  const dyad1Scale = useMemo(() => {
    const scale = user?.playerProfile?.dyadScales?.[0];
    const numeric = Number(scale);
    if (!Number.isFinite(numeric)) return 2; // neutral fallback
    return Math.max(0, Math.min(4, numeric));
  }, [user?.playerProfile?.dyadScales]);
  const dyad2Scale = useMemo(() => {
    const scale = user?.playerProfile?.dyadScales?.[1];
    const numeric = Number(scale);
    if (!Number.isFinite(numeric)) return 2; // neutral fallback
    return Math.max(0, Math.min(4, numeric));
  }, [user?.playerProfile?.dyadScales]);
  const dyad3Scale = useMemo(() => {
    const scale = user?.playerProfile?.dyadScales?.[2];
    const numeric = Number(scale);
    if (!Number.isFinite(numeric)) return 2; // neutral fallback
    return Math.max(0, Math.min(4, numeric));
  }, [user?.playerProfile?.dyadScales]);

  const forestGlobalPoints = Math.round(Math.max(0, sumForestPoints));
  const forestMaxPoints = useMemo(
    () =>
      Math.max(
        100,
        forestGlobalPoints + 50,
        FOREST_PROTOTYPE_TREE_GROW_STEPS + 1,
        userPoints ?? 0
      ),
    [forestGlobalPoints, userPoints]
  );

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

  const co2SavedValue = useMemo(() => {
    const numeric = Number(progress?.co2Saved);
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return numeric;
  }, [progress?.co2Saved]);
  const formattedCo2Saved = useMemo(() => {
    if (co2SavedValue === 0) return '0';
    return Number.isInteger(co2SavedValue) ? co2SavedValue.toFixed(0) : co2SavedValue.toFixed(1);
  }, [co2SavedValue]);

  const { data: forestData } = useQuery(
    ['forest', userId],
    () => api.getForest(),
    { enabled: !!userId }
  );

  const plantedAtList = useMemo(() => {
    const trees = Array.isArray(forestData?.trees) ? forestData.trees : [];
    return trees
      .map((tree: any) => tree?.plantedAt)
      .filter((value: any) => typeof value === 'string' || value instanceof Date)
      .map((value: any) => new Date(value).toISOString())
      .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
  }, [forestData?.trees]);

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
              <ForestPrototypeScene
                globalPoints={Math.min(forestGlobalPoints, forestMaxPoints)}
                maxPoints={forestMaxPoints}
                treeGrowSteps={FOREST_PROTOTYPE_TREE_GROW_STEPS}
                plantedTrees={progress?.treesPlanted ?? 0}
                plantedAtList={plantedAtList}
                dyad1Scale={dyad1Scale}
                dyad2Scale={dyad2Scale}
                dyad3Scale={dyad3Scale}
                lowPerformanceMode={lowPerfForestMode}
              />
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
                  <div className="forest-stat forest-stat--overlay-tile">
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
                  <div className="forest-stat forest-stat--overlay-tile">
                    <div className="forest-stat-icon">🌲</div>
                    <span className="forest-stat-value">{progress?.treesPlanted ?? 0}</span>
                    <span className="forest-stat-label">{t('home.stats.treesPlanted')}</span>
                  </div>
                  <div className="forest-stat forest-stat--overlay-tile">
                    <div className="forest-stat-icon">✅</div>
                    <span className="forest-stat-value">{progress?.tasksCompleted ?? 0}</span>
                    <span className="forest-stat-label">{t('home.stats.tasksCompleted')}</span>
                  </div>
                  <div className="forest-stat forest-stat--overlay-tile">
                    <div className="forest-stat-icon">🌍</div>
                    <span className="forest-stat-value">{formattedCo2Saved} kg</span>
                    <span className="forest-stat-label">{t('home.stats.co2Saved')}</span>
                  </div>
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
