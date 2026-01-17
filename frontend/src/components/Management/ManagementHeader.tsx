import { useTranslation } from 'react-i18next';

type IconName = 'back' | 'refresh' | 'close' | 'filter';

const Icon = ({ name }: { name: IconName }) => {
  const icons: Record<IconName, string> = {
    back: '←',
    refresh: '↻',
    close: '×',
    filter: '🔍',
  };
  return <span>{icons[name] || name}</span>;
};

type ManagementHeaderProps = {
  title: string;
  subtitle?: string;
  cssPrefix?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  showBack?: boolean;
  showRefresh?: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
};

export function ManagementHeader({
  title,
  subtitle,
  cssPrefix = 'admin',
  onBack,
  onRefresh,
  showBack = true,
  showRefresh = false,
  isEditing = false,
  onCancelEdit,
}: ManagementHeaderProps) {
  const { t } = useTranslation();

  const handleBack = () => {
    if (isEditing && onCancelEdit) {
      onCancelEdit();
    } else if (onBack) {
      onBack();
    }
  };

  const backTitle = isEditing
    ? t('admin.task.cancelEditing', 'Bearbeitung abbrechen')
    : t('admin.taskManage.back', 'Zurück');

  return (
    <header className={`${cssPrefix}-section-header`}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className={`${cssPrefix}-actions`}>
        {showRefresh && !isEditing && onRefresh && (
          <button
            className={`${cssPrefix}-icon-button`}
            onClick={onRefresh}
            title={t('admin.taskManage.refresh', 'Aktualisieren')}
            type="button"
          >
            <Icon name="refresh" />
            <span className="sr-only">{t('admin.taskManage.refresh', 'Aktualisieren')}</span>
          </button>
        )}
        {showBack && (
          <button
            className={`${cssPrefix}-icon-button`}
            onClick={handleBack}
            title={backTitle}
            type="button"
          >
            <Icon name="back" />
            <span className="sr-only">{backTitle}</span>
          </button>
        )}
      </div>
    </header>
  );
}
