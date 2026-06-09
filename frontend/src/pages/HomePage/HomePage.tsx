import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { ListTodo, Star, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { TaskTypeIcon } from '../../components/Tasks/taskTypeIcons';
import { forestKeyFromTaskCategory } from '../../constants/forestCategories';
import ForestCategoryProgressGrid from '../../components/Forest/ForestCategoryProgressGrid';
import { FOREST_PROTOTYPE_TREE_GROW_STEPS } from '../../components/3d/ForestPrototypeScene';
import { filterExecutableTasks } from '../../utils/executableTasks';
import './HomePage.css';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const forestPoints = user?.forestPoints;
  const { t } = useTranslation();

  const { data: tasks } = useQuery('tasks', () => api.getTasks(), {
    enabled: !!user,
  });

  const { data: progress } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  const nextTasks = useMemo(() => filterExecutableTasks(tasks).slice(0, 10), [tasks]);

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
          {nextTasks.map((task) => {
            const categoryKey = forestKeyFromTaskCategory(
              (task as { category?: string }).category
            );
            return (
            <Link
              key={task.id}
              to={`/tasks/c/${categoryKey}`}
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
            );
          })}
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
        <Link to="/profile" className="glass-invite-cta">
          <UserPlus size={14} strokeWidth={2} aria-hidden />
          {t('home.invite.cta')}
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
