import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { UserLocationMap } from '../LocationMap/UserLocationMap';
import { BackArrowIcon } from './BackArrowIcon';
import './TaskDetailView.css';

type TaskDetailViewProps = {
  taskId: string;
  onBack: () => void;
  /** Startet die bestehende Aufgaben-UI (Video, Quiz, Ort, …). */
  onStartExecution: () => void;
};

export function TaskDetailView({ taskId, onBack, onStartExecution }: TaskDetailViewProps) {
  const { t } = useTranslation();
  const { data: task, isLoading } = useQuery(['task', taskId], () => api.getTask(taskId), {
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="task-detail-view task-detail-view--loading">
        <p>{t('tasksComponents.loading')}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-view">
        <p>{t('tasksComponents.notFound')}</p>
        <button type="button" className="task-detail-back" onClick={onBack}>
          {t('tasks.categories.backToCategories')}
        </button>
      </div>
    );
  }

  const isCompleted = !!task.completed && task.verification_status !== 'pending';
  const isValidating = task.verification_status === 'pending';
  const isLocked = task.is_available === false;
  const canStart = !isCompleted && !isValidating && !isLocked;

  const taskForMapPreview = useMemo(() => {
    if (task.type !== 'visit_location') return null;
    const t = task as Record<string, unknown>;
    if (t.location) return task as any;
    const lat = t.target_latitude;
    const lng = t.target_longitude;
    if (lat == null || lng == null) return null;
    return {
      ...task,
      location: {
        latitude: Number(lat),
        longitude: Number(lng),
        is_online: false,
      },
    };
  }, [task]);

  const showMapPreview = Boolean(taskForMapPreview);

  return (
    <div className="task-detail-view">
      <div className="task-detail-view-header">
        <button
          type="button"
          className="task-detail-back"
          onClick={onBack}
          title={t('tasks.backToList')}
          aria-label={t('tasks.backToList')}
        >
          <BackArrowIcon className="task-detail-back-icon" />
        </button>
        <div className="task-detail-view-heading">
          <h1 className="task-detail-title">{task.title}</h1>
          <span className="task-detail-points">
            {t('tasksComponents.points', { points: task.points })}
          </span>
        </div>
      </div>

      <div className="task-detail-view-body">
        {task.description ? (
          <div className="task-detail-description">{task.description}</div>
        ) : (
          <p className="task-detail-description task-detail-description--empty">{t('tasks.detail.noDescription')}</p>
        )}

        {showMapPreview && taskForMapPreview && (
          <div className="task-detail-map-block">
            <h2 className="task-detail-section-title">{t('tasks.detail.locationSection')}</h2>
            <UserLocationMap
              variant="tasks"
              height="min(45vh, 320px)"
              tasks={[taskForMapPreview as any]}
              previewMode
            />
          </div>
        )}
      </div>

      <div className="task-detail-view-footer">
        {isLocked && (
          <p className="task-detail-footer-hint">{t('tasks.prerequisites.unlockMessage')}</p>
        )}
        {isValidating && (
          <p className="task-detail-footer-hint">{t('tasks.badges.validating')}</p>
        )}
        {isCompleted && (
          <p className="task-detail-footer-hint">{t('tasks.badges.completed')}</p>
        )}
        <button
          type="button"
          className="task-detail-start"
          onClick={onStartExecution}
          disabled={!canStart}
        >
          {isCompleted
            ? t('tasks.buttons.completed')
            : isValidating
              ? t('tasks.buttons.validating')
              : isLocked
                ? t('tasks.buttons.locked')
                : t('tasks.buttons.start')}
        </button>
      </div>
    </div>
  );
}
