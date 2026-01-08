import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import './HomePage.css';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const userPoints = useAuthStore((s) => s.user?.points || 0);
  const { t } = useTranslation();

  // Get active team and total points
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 } // Refetch every 5 seconds to keep team points updated in real-time
  );

  // Preload 3D tree models in background when user is on homepage
  // This ensures models are ready when user navigates to ForestPage
  useEffect(() => {
    if (!user) return;

    // Use requestIdleCallback for non-blocking preload, fallback to setTimeout
    const preloadModels = () => {
      try {
        useGLTF.preload('/models/twigLeafTree.glb');
        useGLTF.preload('/models/tree.glb');
        useGLTF.preload('/models/leaves.glb');
      } catch (error) {
        // Silently handle errors - models might already be preloaded or not critical
        console.debug('Model preload:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadModels, { timeout: 2000 });
    } else {
      setTimeout(preloadModels, 100);
    }
  }, [user]);

  const { data: progress, isLoading: progressLoading } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );


  if (progressLoading && !progress) {
    return (
      <div className="home-page">
        <div className="home-hero">
          <h1 className="home-title">{t('home.title')}</h1>
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">{t('home.title')}</h1>
        <p className="home-subtitle">{t('home.subtitle')}</p>
      </div>
      
      {user && (
        <div className="home-content">
          <section className="home-section">
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
              <div className="home-stat">
                <div className="home-stat-icon">🌍</div>
                <span className="home-stat-value">{progress?.co2Saved ? `${progress.co2Saved.toFixed(1)} kg` : '0 kg'}</span>
                <span className="home-stat-label">{t('home.stats.co2Saved')}</span>
              </div>
            </div>
          </section>
          
          <section className="home-section home-section-actions">
            <div className="home-section-header">
              <h2 className="home-section-title">{t('home.quickActions.title')}</h2>
              <p className="home-section-subtitle">{t('home.quickActions.subtitle')}</p>
            </div>
            <div className="home-actions">
              <Link to="/tasks" className="home-action-card">
                <span className="home-action-icon">✅</span>
                <h3>{t('home.quickActions.tasks.title')}</h3>
                <p>{t('home.quickActions.tasks.description')}</p>
              </Link>
              <Link to="/forest" className="home-action-card">
                <span className="home-action-icon">🌲</span>
                <h3>{t('home.quickActions.forest.title')}</h3>
                <p>{t('home.quickActions.forest.description')}</p>
              </Link>
              <Link to="/rewards" className="home-action-card">
                <span className="home-action-icon">🎁</span>
                <h3>{t('home.quickActions.rewards.title')}</h3>
                <p>{t('home.quickActions.rewards.description')}</p>
              </Link>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

export default HomePage;
