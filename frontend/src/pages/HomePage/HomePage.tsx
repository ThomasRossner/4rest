import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { ListTodo, Star, UserPlus, Share2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { shareInvite } from '../../utils/invite';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { TaskTypeIcon } from '../../components/Tasks/taskTypeIcons';
import ForestCategoryProgressGrid from '../../components/Forest/ForestCategoryProgressGrid';
import { FOREST_PROTOTYPE_TREE_GROW_STEPS } from '../../components/3d/ForestPrototypeScene';
import { filterExecutableTasks } from '../../utils/executableTasks';
import './HomePage.css';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const forestPoints = user?.forestPoints;
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);

  const handleShareApp = async () => {
    const url = `${window.location.origin}/login`;
    const result = await shareInvite({
      url,
      title: t('home.invite.shareTitle') || '4rest',
      text: t('home.invite.shareText') || 'Join me on 4rest!',
    });
    if (result === 'copied') {
      showToast({
        type: 'success',
        title: t('home.invite.linkCopied') || 'Link copied',
        message: t('home.invite.linkCopiedMessage') || 'Invite link copied to clipboard',
      });
    } else if (result === 'failed') {
      showToast({
        type: 'error',
        title: t('home.invite.shareError') || 'Error',
        message: t('home.invite.shareErrorMessage') || 'Could not share the invite link',
      });
    }
  };

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: tasks } = useQuery('tasks', () => api.getTasks(), {
    enabled: !!user,
  });

  const { data: progress } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  useEffect(() => {
    if (!user || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setUserLocation(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  const nextTasks = useMemo(
    () => filterExecutableTasks(tasks, { userLocation }).slice(0, 10),
    [tasks, userLocation]
  );

  const forestLevel = useMemo(() => {
    const planted = progress?.treesPlanted ?? 0;
    return Math.min(planted, FOREST_PROTOTYPE_TREE_GROW_STEPS);
  }, [progress?.treesPlanted]);

  if (!user) {
    return (
      <div className="home-page">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="home-page home-page--sections">
      <section className="glass-section home-section" aria-labelledby="home-next-tasks-title">
        <h2 id="home-next-tasks-title" className="glass-section__title">
          {t('home.nextTasks.title')}
        </h2>
        <div className="glass-scroll-row home-task-row">
          {nextTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks?task=${encodeURIComponent(task.id)}`}
              className="glass-task-tile"
            >
              <span className="glass-task-tile__thumb">
                {task.thumbnail_url ? (
                  <img src={task.thumbnail_url} alt="" />
                ) : (
                  <TaskTypeIcon type={task.type ?? ''} size={22} strokeWidth={2} />
                )}
              </span>
              <span className="glass-task-tile__title">{task.title}</span>
              <span className="glass-points-badge">
                <Star size={10} strokeWidth={2} aria-hidden />
                {t('tasksComponents.points', { points: Number(task.points ?? 0) })}
              </span>
            </Link>
          ))}
          <Link to="/tasks" className="glass-task-tile glass-task-tile--all">
            <ListTodo size={22} strokeWidth={2} aria-hidden />
            <span className="glass-task-tile__title">{t('home.nextTasks.allTasks')}</span>
          </Link>
        </div>
      </section>

      <section className="glass-section home-section" aria-labelledby="home-progress-title">
        <h2 id="home-progress-title" className="glass-section__title">
          {t('home.progress.title')}
        </h2>
        <span className="glass-level-badge">
          {t('home.progress.level', {
            level: forestLevel,
            max: FOREST_PROTOTYPE_TREE_GROW_STEPS,
          })}
        </span>
        <ForestCategoryProgressGrid forestPoints={forestPoints} className="home-category-grid" />
      </section>

      <section className="glass-section home-section home-invite" aria-labelledby="home-invite-title">
        <h2 id="home-invite-title" className="glass-section__title">
          {t('home.invite.title')}
        </h2>
        <p className="home-invite__text">{t('home.invite.description')}</p>
        <div className="home-invite__actions">
          <button type="button" className="glass-invite-cta" onClick={handleShareApp}>
            <Share2 size={14} strokeWidth={2} aria-hidden />
            {t('home.invite.share')}
          </button>
          <Link to="/groups#contests" className="glass-invite-cta glass-invite-cta--secondary">
            <UserPlus size={14} strokeWidth={2} aria-hidden />
            {t('home.invite.cta')}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
