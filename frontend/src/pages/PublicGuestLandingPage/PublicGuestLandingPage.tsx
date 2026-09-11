import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useRef } from 'react';
import { api } from '../../services/api';
import { QRCodeIcon } from '../../components/Icons/QRCodeIcon';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useCategoryTaskGridRowHeight } from '../../hooks/useCategoryTaskGridRowHeight';
import { descriptionPreviewPlain } from '../../utils/taskDescriptionPreview';
import '../TasksPage/TasksPage.css';
import './PublicGuestLandingPage.css';

/**
 * Einstieg „als Gast“: gleiche Kachel-Matrix wie in der eingeloggten Kategorie-Ansicht (TasksPage).
 */
export default function PublicGuestLandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de';
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const { data: tasks, isLoading, isError } = useQuery(
    ['publicGuestTasks', lang],
    () => api.listPublicGuestTasks(lang),
    { staleTime: 60_000 }
  );

  const taskCount = tasks?.length ?? 0;
  useCategoryTaskGridRowHeight(categoryScrollRef, [taskCount]);

  const openPublicTask = (taskId: string) => {
    navigate(`/public/task/${taskId}`);
  };

  return (
    <div className="tasks-page tasks-page--category tasks-page--public-guest">
      <div className="tasks-category-sticky">
        <div className="tasks-header tasks-header--category">
          <div className="tasks-header-category-row">
            <h1 className="tasks-header-category-title">{t('publicGuest.title')}</h1>
          </div>
        </div>
      </div>

      <div className="tasks-category-scroll" ref={categoryScrollRef}>
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
          <div className="tasks-category-matrix">
            {tasks.map((task) => {
              const guestTask = task as typeof task & {
                completed?: boolean;
                is_available?: boolean;
                verification_status?: string;
              };
              const isLocked = guestTask.is_available === false;
              const isCompleted = !!guestTask.completed && guestTask.verification_status !== 'pending';
              const isValidating = guestTask.verification_status === 'pending';
              const previewText = descriptionPreviewPlain(task.teaser ?? task.description, 60);
              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  className={`task-card task-card--list-tile ${isCompleted ? 'task-card-completed' : ''} ${isValidating ? 'task-card-validating' : ''} ${isLocked ? 'task-card-locked' : ''}`}
                  onClick={() => openPublicTask(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openPublicTask(task.id);
                    }
                  }}
                >
                  <div className="task-tile-zone task-tile-zone--top">
                    <span className="task-icon task-icon--tile">
                      {task.thumbnail_url ? (
                        <img src={task.thumbnail_url} alt="" className="task-icon-image task-icon-image--tile" />
                      ) : task.type === 'video' ? (
                        '🎥'
                      ) : task.type === 'quiz' ? (
                        '❓'
                      ) : task.type === 'article_quiz' ? (
                        '📄'
                      ) : task.type === 'survey' ? (
                        '📋'
                      ) : task.type === 'qr' ? (
                        <QRCodeIcon size={34} />
                      ) : task.type === 'visit_location' ? (
                        '📍'
                      ) : (
                        '📷'
                      )}
                    </span>
                    <div className="task-tile-top-right">
                      <span className="task-points task-points--tile">
                        {t('tasksComponents.points', { points: task.points })}
                      </span>
                      <div className="task-tile-status-icons">
                        {isCompleted && (
                          <span className="task-completed-badge task-completed-badge--tile" title={t('tasks.badges.completed')}>
                            ✓
                          </span>
                        )}
                        {isValidating && (
                          <span className="task-validating-badge task-validating-badge--tile" title={t('tasks.badges.validating')}>
                            ⏳
                          </span>
                        )}
                        {isLocked && (
                          <span className="task-locked-badge task-locked-badge--tile" title={t('tasks.badges.locked')}>
                            🔒
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="task-tile-zone task-tile-zone--middle">
                    <h3 className="task-title task-title--tile-middle">{task.title}</h3>
                  </div>
                  <div className="task-tile-zone task-tile-zone--bottom">
                    {isLocked ? (
                      <p className="task-tile-locked-hint">{t('tasks.prerequisites.unlockMessage')}</p>
                    ) : null}
                    <p className={`task-tile-preview ${!previewText ? 'task-tile-preview--empty' : ''}`}>
                      {previewText || t('tasks.tile.noPreview')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', padding: '0 var(--spacing-md)' }}>
          <Link to="/login">{t('publicGuest.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
