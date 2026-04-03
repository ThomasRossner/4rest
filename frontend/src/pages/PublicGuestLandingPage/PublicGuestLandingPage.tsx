import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { QRCodeIcon } from '../../components/Icons/QRCodeIcon';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import '../TasksPage/TasksPage.css';
import './PublicGuestLandingPage.css';

/**
 * Einstieg „als Gast“: gleiche Karten-Darstellung wie auf der Aufgaben-Liste (TasksPage).
 */
export default function PublicGuestLandingPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de';

  const { data: tasks, isLoading, isError } = useQuery(
    ['publicGuestTasks', lang],
    () => api.listPublicGuestTasks(lang),
    { staleTime: 60_000 }
  );

  return (
    <div className="tasks-page tasks-page--category">
      <div className="tasks-category-sticky">
        <div className="tasks-header tasks-header--category">
          <div className="tasks-header-category-row">
            <h1 className="tasks-header-category-title">{t('publicGuest.title')}</h1>
          </div>
        </div>
      </div>

      <div className="tasks-category-scroll">
        {isLoading && <LoadingSkeleton lines={6} />}

        {isError && (
          <p role="alert" style={{ padding: '0 var(--spacing-md)', textAlign: 'center' }}>
            {t('publicGuest.loadError')}
          </p>
        )}

        {!isLoading && !isError && tasks && tasks.length === 0 && (
          <EmptyState title={t('publicGuest.empty')} />
        )}

        {!isLoading && !isError && tasks && tasks.length > 0 && (
          <div className="tasks-grid tasks-grid--compact">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <span className="task-icon">
                    {task.thumbnail_url ? (
                      <img src={task.thumbnail_url} alt={task.title} className="task-icon-image" />
                    ) : task.type === 'video' ? (
                      '🎥'
                    ) : task.type === 'quiz' ? (
                      '❓'
                    ) : task.type === 'article_quiz' ? (
                      '📄'
                    ) : task.type === 'survey' ? (
                      '📋'
                    ) : task.type === 'qr' ? (
                      <QRCodeIcon size={48} />
                    ) : task.type === 'visit_location' ? (
                      '📍'
                    ) : (
                      '📷'
                    )}
                  </span>
                  <span className="task-points">{t('tasksComponents.points', { points: task.points })}</span>
                </div>
                <h3 className="task-title">{task.title}</h3>
                {task.description ? <p className="task-description">{task.description}</p> : null}
                <Link className="task-button" to={`/public/task/${task.id}`}>
                  {t('tasks.buttons.start')}
                </Link>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', padding: '0 var(--spacing-md)' }}>
          <Link to="/login">{t('publicGuest.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
