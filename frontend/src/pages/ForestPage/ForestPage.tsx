import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import ForestPrototypeScene, {
  FOREST_DEFAULT_CAMERA,
  FOREST_PROTOTYPE_TREE_GROW_STEPS,
} from '../../components/3d/ForestPrototypeScene';
import ForestCategoryProgressGrid from '../../components/Forest/ForestCategoryProgressGrid';
import ForestPlayerCharacter from '../../components/PlayerProfile/ForestPlayerCharacter';
import PlayerProfileTypeModal from '../../components/PlayerProfile/PlayerProfileTypeModal';
import './ForestPage.css';

const PANEL_RESHOW_MS = 5000;

function ForestPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [progressPanelVisible, setProgressPanelVisible] = useState(true);
  const panelReshowTimerRef = useRef<ReturnType<typeof setTimeout>>();
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
    if (!Number.isFinite(numeric)) return 2;
    return Math.max(0, Math.min(4, numeric));
  }, [user?.playerProfile?.dyadScales]);

  const dyad2Scale = useMemo(() => {
    const scale = user?.playerProfile?.dyadScales?.[1];
    const numeric = Number(scale);
    if (!Number.isFinite(numeric)) return 2;
    return Math.max(0, Math.min(4, numeric));
  }, [user?.playerProfile?.dyadScales]);

  const dyad3Scale = useMemo(() => {
    const scale = user?.playerProfile?.dyadScales?.[2];
    const numeric = Number(scale);
    if (!Number.isFinite(numeric)) return 2;
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

  const {
    data: progress,
    isLoading: progressLoading,
    isError: progressError,
    refetch: refetchProgress,
  } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId, retry: 2, refetchOnWindowFocus: true, refetchOnReconnect: true }
  );

  const {
    data: forestData,
    isError: forestError,
    refetch: refetchForest,
  } = useQuery(
    ['forest', userId],
    () => api.getForest(),
    { enabled: !!userId, retry: 2, refetchOnWindowFocus: true, refetchOnReconnect: true }
  );

  const plantedAtList = useMemo(() => {
    const trees = Array.isArray(forestData?.trees) ? forestData.trees : [];
    return trees
      .map((tree: { plantedAt?: string | Date }) => tree?.plantedAt)
      .filter((value): value is string | Date => typeof value === 'string' || value instanceof Date)
      .map((value) => new Date(value).toISOString())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [forestData?.trees]);

  const handleNavigationStart = useCallback(() => {
    if (panelReshowTimerRef.current) {
      clearTimeout(panelReshowTimerRef.current);
    }
    setProgressPanelVisible((visible) => (visible ? false : visible));
    panelReshowTimerRef.current = setTimeout(() => {
      setProgressPanelVisible(true);
    }, PANEL_RESHOW_MS);
  }, []);

  useEffect(() => {
    setProgressPanelVisible(true);
    if (panelReshowTimerRef.current) {
      clearTimeout(panelReshowTimerRef.current);
      panelReshowTimerRef.current = undefined;
    }
    return () => {
      if (panelReshowTimerRef.current) {
        clearTimeout(panelReshowTimerRef.current);
      }
    };
  }, []);

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

  const showProgressLoadError = progressError && !progress;
  const showForestLoadError = forestError && !forestData;
  const sceneLoading = progressLoading && !progress;

  return (
    <div className="forest-page forest-page--immersive">
      <div className="forest-viewport">
        <div className="glass-hero-fog forest-viewport__fog" aria-hidden />
        <div className="glass-hero-vignette forest-viewport__vignette" aria-hidden />

        <div
          className={`forest-progress-panel${progressPanelVisible ? '' : ' forest-progress-panel--hidden'}`}
          aria-label={t('home.progress.title')}
          aria-hidden={!progressPanelVisible}
        >
          {user?.playerProfile && (
            <div className="forest-progress-panel__character">
              <ForestPlayerCharacter
                variant="overlay"
                user={user}
                onOpenMore={() => setTypeModalOpen(true)}
              />
            </div>
          )}
          <ForestCategoryProgressGrid
            forestPoints={user?.forestPoints}
            className="forest-progress-panel__grid"
          />
        </div>

        <div className="forest-container">
          {showProgressLoadError && (
            <div className="forest-load-error forest-load-error--overlay" role="alert">
              <p>{t('forest.loadError')}</p>
              <button type="button" className="btn-primary forest-load-error__retry" onClick={() => refetchProgress()}>
                {t('common.actions.refresh')}
              </button>
            </div>
          )}
          {showForestLoadError && !showProgressLoadError && (
            <div className="forest-load-error forest-load-error--overlay" role="alert">
              <p>{t('forest.loadError')}</p>
              <button type="button" className="btn-primary forest-load-error__retry" onClick={() => refetchForest()}>
                {t('common.actions.refresh')}
              </button>
            </div>
          )}
          {sceneLoading && !showProgressLoadError && (
            <div className="forest-loading forest-loading--overlay">{t('forest.loading')}</div>
          )}
          <Suspense fallback={<div className="forest-loading forest-loading--overlay">{t('forest.loading')}</div>}>
            <Canvas
              gl={{
                antialias: false,
                powerPreference: lowPerfForestMode ? 'default' : 'high-performance',
                alpha: true,
                stencil: false,
                depth: true,
              }}
              onCreated={({ gl, scene }) => {
                gl.setClearColor(0x000000, 0);
                scene.background = null;
              }}
              shadows={!lowPerfForestMode}
              dpr={lowPerfForestMode ? 1 : [1, 1.5]}
              performance={{ min: lowPerfForestMode ? 0.45 : 0.7 }}
              frameloop={lowPerfForestMode ? 'demand' : 'always'}
              camera={{
                position: [...FOREST_DEFAULT_CAMERA.position],
                fov: FOREST_DEFAULT_CAMERA.fov,
              }}
              style={{ width: '100%', height: '100%' }}
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
                onNavigationActivity={handleNavigationStart}
              />
            </Canvas>
          </Suspense>
        </div>
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
