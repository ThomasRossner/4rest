import type { CSSProperties } from 'react';
type Task = {
  id: string;
  title: string;
  description?: string | null;
  points: number;
  type?: 'video' | 'photo' | 'qr' | string;
  completed?: boolean;
};

type TaskCardProps = {
  task: Task;
  onSelect?: (task: Task) => void;
  disabled?: boolean;
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

function TaskCard({ task, onSelect, disabled }: TaskCardProps) {
  const handleSelect = () => {
    if (!disabled) {
      onSelect?.(task);
    }
  };

  const pointsLabel = formatPoints(task.points);
  const emoji = getTaskEmoji(task.type);

  return (
    <article
      className="task-card"
      style={{
        ...containerStyle,
        opacity: disabled ? 0.75 : 1,
      }}
      aria-disabled={disabled}
    >
      <header style={headerStyle}>
        <h3 style={titleStyle}>
          <span aria-hidden>{emoji}</span>
          <span>{task.title}</span>
        </h3>
        <span style={badgeStyle}>{pointsLabel}</span>
      </header>
      {task.description && <p style={descriptionStyle}>{task.description}</p>}
      <footer style={footerStyle}>
        <span style={{ fontSize: 13, color: 'var(--color-text-light, #6b7280)' }}>
          {task.completed ? 'Completed' : 'Available task'}
        </span>
        <button
          type="button"
          style={disabled ? disabledButtonStyle : buttonStyle}
          onClick={handleSelect}
          disabled={disabled}
          aria-label={`Select task ${task.title}`}
        >
          {disabled ? 'Locked' : 'Start task'}
        </button>
      </footer>
    </article>
  );
}

export default TaskCard;

