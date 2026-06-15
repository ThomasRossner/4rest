import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { TaskTypeIcon } from './taskTypeIcons';
import './TaskCard.css';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  points: number;
  type?: 'video' | 'photo' | 'qr' | string;
  completed?: boolean;
  is_available?: boolean;
};

type TaskCardProps = {
  task: Task;
  onSelect?: (task: Task) => void;
  disabled?: boolean;
  isAvailable?: boolean;
};

function formatPoints(points: number): string {
  return `+${points}`;
}

function TaskCard({ task, onSelect, disabled, isAvailable }: TaskCardProps) {
  const { t } = useTranslation();

  const handleSelect = () => {
    if (!disabled && isAvailable !== false) {
      onSelect?.(task);
    }
  };

  const pointsLabel = formatPoints(task.points);
  const isLocked = isAvailable === false || task.is_available === false;
  const isDisabled = disabled || isLocked || task.completed;

  return (
    <article
      className={`task-card ${isDisabled ? 'task-card--disabled' : ''}`}
      aria-disabled={isDisabled}
    >
      <header className="task-card__header">
        <h3 className="task-card__title-row">
          <span aria-hidden>
            {(task as { thumbnail_url?: string }).thumbnail_url ? (
              <img
                src={(task as { thumbnail_url?: string }).thumbnail_url}
                alt=""
                className="task-card__thumb"
              />
            ) : (
              <TaskTypeIcon type={task.type} size={22} className="task-card__type-icon" />
            )}
          </span>
          <span>{task.title}</span>
        </h3>
        <div className="task-card__badges">
          <span className="task-card__points">{pointsLabel}</span>
          {isLocked && (
            <span className="task-card__lock" title={t('tasks.badges.locked')} aria-label={t('tasks.buttons.locked')}>
              <Lock size={18} strokeWidth={2} aria-hidden />
            </span>
          )}
        </div>
      </header>
      {task.description && <p className="task-card__description">{task.description}</p>}
      {isLocked && <p className="task-card__hint">{t('tasks.prerequisites.unlockMessage')}</p>}
      <footer className="task-card__footer">
        <span className="task-card__status">
          {task.completed
            ? t('common.status.completed')
            : isLocked
              ? t('tasks.buttons.locked')
              : t('tasks.status.available')}
        </span>
        <button
          type="button"
          className="task-card__action"
          onClick={handleSelect}
          disabled={isDisabled}
          aria-label={`Select task ${task.title}`}
        >
          {task.completed ? t('common.status.completed') : isLocked ? t('tasks.buttons.locked') : t('tasks.buttons.start')}
        </button>
      </footer>
    </article>
  );
}

export default TaskCard;
