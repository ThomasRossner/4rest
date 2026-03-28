import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import './HomePage.css';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

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

  if (!user) {
    return (
      <div className="home-page">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="home-page home-page--no-scroll">
      <div className="home-hero">
        <p className="home-subtitle">{t('home.subtitle')}</p>
      </div>
      
      {user && (
        <div className="home-content">
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
