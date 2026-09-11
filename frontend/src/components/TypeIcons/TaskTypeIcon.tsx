import { TASK_TYPE_ICONS } from '../../constants/taskIcons';

export const TaskTypeIcon = ({ type, thumbnailUrl }: { type: string; thumbnailUrl?: string | null }) => {
  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={type} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', display: 'block', flexShrink: 0 }} />;
  }
  const typeIcon = TASK_TYPE_ICONS[type] ?? '🧩';
  // Handle ReactNode (for QR code) vs string (for emojis)
  if (typeof typeIcon === 'string') {
    return (
      <span aria-hidden="true" style={{ fontSize: '48px', lineHeight: '1', display: 'inline-block', flexShrink: 0 }}>
        {typeIcon}
      </span>
    );
  }
  // For ReactNode (QRCodeIcon), ensure it renders at full 48px size
  // Render directly without wrapper constraints - the SVG already has width={48} and height={48}
  return <div style={{ display: 'inline-block', flexShrink: 0, lineHeight: '0', verticalAlign: 'middle' }}>{typeIcon}</div>;
};
