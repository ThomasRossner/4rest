import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import ForestHybridScene, {
  FOREST_HYBRID_DEFAULT_CAMERA,
} from '../../components/3d/ForestHybridScene';
import { mapForestApiToHybridForest } from '../../utils/forestTreeMapper';
import { resolveTreeMorphology } from '../../utils/forestCategoryMorphology';
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

  const isLikelyAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);
  const lowPerfForestMode = useMemo(() => {
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    const lowMem = typeof deviceMemory === 'number' && deviceMemory <= 4;
    const lowCpu = cores <= 6;
    return isLikelyAndroid && (lowMem || lowCpu);
  }, [isLikelyAndroid]);

  const treeMorphology = useMemo(
    () =>
      resolveTreeMorphology({
        forestPoints: user?.forestPoints,
        dyadScales: user?.playerProfile?.dyadScales,
      }),
    [user?.forestPoints, user?.playerProfile?.dyadScales]
  );

  const {
    data: forestData,
    isLoading: forestLoading,
    isError: forestError,
    refetch: refetchForest,
  } = useQuery(
    ['forest', userId],
    () => api.getForest(),
    { enabled: !!userId, retry: 2, refetchOnWindowFocus: true, refetchOnReconnect: true }
  );

  const hybridForest = useMemo(() => mapForestApiToHybridForest(forestData), [forestData]);

  const initialCamera = hybridForest.cameraFraming ?? {
    position: [...FOREST_HYBRID_DEFAULT_CAMERA.position] as [number, number, number],
    target: [...FOREST_HYBRID_DEFAULT_CAMERA.target] as [number, number, number],
  };

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
        queryClient.invalidateQueries(['forest', userId]);
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
          await queryClient.invalidateQueries(['forest', userId]);
          await api.refreshMe();
        }
      } catch (error) {
        console.debug('Forest visit:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, queryClient]);

  const showForestLoadError = forestError && !forestData;
  const sceneLoading = forestLoading && !forestData;

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
          {showForestLoadError && (
            <div className="forest-load-error forest-load-error--overlay" role="alert">
              <p>{t('forest.loadError')}</p>
              <button type="button" className="btn-primary forest-load-error__retry" onClick={() => refetchForest()}>
                {t('common.actions.refresh')}
              </button>
            </div>
          )}
          {sceneLoading && !showForestLoadError && (
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
                position: initialCamera.position,
                fov: FOREST_HYBRID_DEFAULT_CAMERA.fov,
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <ForestHybridScene
                trees={hybridForest.trees}
                areas={hybridForest.areas}
                cameraFraming={hybridForest.cameraFraming}
                morphology={treeMorphology}
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
