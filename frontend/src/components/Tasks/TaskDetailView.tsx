import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { UserLocationMap } from '../LocationMap/UserLocationMap';
import { BackArrowIcon } from './BackArrowIcon';
import './TaskDetailView.css';

type TaskDetailViewProps = {
  taskId: string;
  /** Daten aus der Liste (Fallback, falls GET /tasks/:id langsam fehlschlägt). */
  listTask?: Record<string, unknown> | null;
  onBack: () => void;
  /** Startet die bestehende Aufgaben-UI (Video, Quiz, Ort, …). */
  onStartExecution: () => void;
};

function formatCompletedAt(iso: unknown, localeHint: string): string {
  if (iso == null || iso === '') return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  const locale = localeHint.startsWith('de') ? 'de-DE' : 'en-US';
  return d.toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
}

export function TaskDetailView({ taskId, listTask, onBack, onStartExecution }: TaskDetailViewProps) {
  const { t, i18n } = useTranslation();
  const { data: fetchedTask, isLoading, isError, error, refetch } = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    {
      enabled: !!taskId,
      retry: 1,
    }
  );

  const task = (fetchedTask as Record<string, unknown> | undefined) ?? listTask ?? undefined;

  if (isLoading && !listTask) {
    return (
      <div className="task-detail-view task-detail-view--loading">
        <p>{t('tasksComponents.loading')}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-view">
        <p className="task-detail-error">
          {isError && error
            ? (error as { message?: string }).message || String(error)
            : t('tasksComponents.notFound')}
        </p>
        <button type="button" className="task-detail-back" onClick={onBack}>
          {t('tasks.categories.backToCategories')}
        </button>
        {isError ? (
          <button type="button" className="task-detail-retry" onClick={() => refetch()}>
            {t('common.actions.refresh')}
          </button>
        ) : null}
      </div>
    );
  }

  const row = task as Record<string, unknown>;

  const isCompleted = !!row.completed && row.verification_status !== 'pending';
  const isValidating = row.verification_status === 'pending';
  const isLocked = row.is_available === false;

  const completedAtLabel = formatCompletedAt(row.completed_at, i18n.language || 'de');

  const taskForMapPreview = useMemo(() => {
    if (row.type !== 'visit_location') return null;
    if (row.location) return row as any;
    const lat = row.target_latitude;
    const lng = row.target_longitude;
    if (lat == null || lng == null) return null;
    return {
      ...row,
      location: {
        latitude: Number(lat),
        longitude: Number(lng),
        is_online: false,
      },
    };
  }, [row]);

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
          <h1 className="task-detail-title">{String(row.title ?? '')}</h1>
          <span className="task-detail-points">
            {t('tasksComponents.points', { points: Number(row.points ?? 0) })}
          </span>
        </div>
      </div>

      <div className="task-detail-view-body">
        {row.description ? (
          <div className="task-detail-description">{String(row.description)}</div>
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
        {isLocked && !isCompleted && (
          <p className="task-detail-footer-hint">{t('tasks.prerequisites.unlockMessage')}</p>
        )}
        {isValidating && (
          <p className="task-detail-footer-hint">{t('tasks.badges.validating')}</p>
        )}
        {isCompleted && (
          <div className="task-detail-completed-meta">
            {completedAtLabel ? (
              <p className="task-detail-completed-date">{t('tasks.detail.completedAt', { date: completedAtLabel })}</p>
            ) : (
              <p className="task-detail-footer-hint">{t('tasks.badges.completed')}</p>
            )}
          </div>
        )}
        {!isCompleted && (
          <button
            type="button"
            className="task-detail-start"
            onClick={onStartExecution}
            disabled={isValidating || isLocked}
          >
            {isValidating
              ? t('tasks.buttons.validating')
              : isLocked
                ? t('tasks.buttons.locked')
                : t('tasks.buttons.start')}
          </button>
        )}
      </div>
    </div>
  );
}
