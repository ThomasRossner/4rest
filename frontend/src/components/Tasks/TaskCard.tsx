import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
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

const typeEmoji: Record<string, string> = {
  video: '🎬',
  photo: '📸',
  qr: '📱',
  visit_location: '📍',
};

function getTaskEmoji(taskType?: string): string {
  if (!taskType) {
    return '✅';
  }

  const normalized = taskType.toLowerCase();
  return typeEmoji[normalized] ?? '✅';
}

function formatPoints(points: number): string {
  return `+${points} pts`;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 20px',
  borderRadius: 12,
  border: '1px solid var(--color-border, #e5e7eb)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.08))',
  transition: 'transform 120ms ease, box-shadow 120ms ease',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const titleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 18,
  fontWeight: 600,
  color: 'var(--color-text, #1f2937)',
  margin: 0,
};

const badgeStyle: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  color: 'white',
  background: 'var(--color-primary, #0f766e)',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: 'var(--color-text-light, #4b5563)',
  fontSize: 14,
  lineHeight: 1.5,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const buttonStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  background: 'var(--color-primary, #0f766e)',
  color: 'white',
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--color-border, #e5e7eb)',
  color: 'var(--color-text-light, #6b7280)',
  cursor: 'not-allowed',
};

function TaskCard({ task, onSelect, disabled, isAvailable }: TaskCardProps) {
  const { t } = useTranslation();
  
  const handleSelect = () => {
    if (!disabled && isAvailable !== false) {
      onSelect?.(task);
    }
  };

  const pointsLabel = formatPoints(task.points);
  const emoji = getTaskEmoji(task.type);
  const isLocked = isAvailable === false || task.is_available === false;
  const isDisabled = disabled || isLocked || task.completed;

  return (
    <article
      className="task-card"
      style={{
        ...containerStyle,
        opacity: isDisabled ? 0.75 : 1,
      }}
      aria-disabled={isDisabled}
    >
      <header style={headerStyle}>
        <h3 style={titleStyle}>
          <span aria-hidden>{emoji}</span>
          <span>{task.title}</span>
        </h3>
        <span style={badgeStyle}>{pointsLabel}</span>
        {isLocked && (
          <span style={{ fontSize: 18 }} title={t('tasks.badges.locked')} aria-label={t('tasks.buttons.locked')}>
            🔒
          </span>
        )}
      </header>
      {task.description && <p style={descriptionStyle}>{task.description}</p>}
      {isLocked && (
        <p style={{ fontSize: 13, color: 'var(--color-text-light, #6b7280)', margin: 0 }}>
          {t('tasks.prerequisites.unlockMessage')}
        </p>
      )}
      <footer style={footerStyle}>
        <span style={{ fontSize: 13, color: 'var(--color-text-light, #6b7280)' }}>
          {task.completed ? t('common.status.completed') : isLocked ? t('tasks.buttons.locked') : t('tasks.status.available')}
        </span>
        <button
          type="button"
          style={isDisabled ? disabledButtonStyle : buttonStyle}
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

