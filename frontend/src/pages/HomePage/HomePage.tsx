import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useGLTF } from '@react-three/drei';
import { ArrowRight, Gift, Trees } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import './HomePage.css';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  const { data: tasks } = useQuery('tasks', () => api.getTasks(), {
    enabled: !!user,
  });

  const { openCount, totalCount } = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    const total = list.length;
    const open = list.filter((task: { completed?: boolean }) => !task.completed).length;
    return { openCount: open, totalCount: total };
  }, [tasks]);

  const summaryText = useMemo(() => {
    if (totalCount === 0) {
      return t('home.atlas.summaryNone');
    }
    if (openCount === 0) {
      return t('home.atlas.summaryAllDone');
    }
    return t('home.atlas.summaryOpen', { open: openCount, total: totalCount });
  }, [totalCount, openCount, t]);

  useEffect(() => {
    if (!user) return;

    const preloadModels = () => {
      try {
        useGLTF.preload('/models/twigLeafTree.glb');
        useGLTF.preload('/models/tree.glb');
        useGLTF.preload('/models/leaves.glb');
      } catch (error) {
        console.debug('Model preload:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadModels, { timeout: 2000 });
    } else {
      setTimeout(preloadModels, 100);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
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

      <div className="home-content">
        <section className="home-atlas" aria-labelledby="home-atlas-heading">
          <h2 id="home-atlas-heading" className="home-atlas__title">
            {t('home.atlas.sectionTitle')}
          </h2>
          <p className="home-atlas__summary">{summaryText}</p>
          <Link to="/tasks" className="home-atlas__cta btn-primary">
            <span>{t('home.atlas.ctaTasks')}</span>
            <ArrowRight size={20} strokeWidth={2} className="home-atlas__cta-icon" aria-hidden />
          </Link>
          <div className="home-atlas__secondary">
            <Link to="/forest" className="home-atlas__link">
              <Trees size={20} strokeWidth={2} aria-hidden />
              <span>{t('home.atlas.exploreForest')}</span>
            </Link>
            <Link to="/rewards" className="home-atlas__link">
              <Gift size={20} strokeWidth={2} aria-hidden />
              <span>{t('home.atlas.openRewards')}</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
