import { useTranslation } from 'react-i18next';

type BulkActionsBarProps = {
  cssPrefix?: string;
  hasSelection: boolean;
  selectionCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  activateLabel?: string;
  deactivateLabel?: string;
  deleteLabel?: string;
  selectionCountLabel?: (count: number) => string;
  noSelectionLabel?: string;
};

export function BulkActionsBar({
  cssPrefix = 'admin',
  hasSelection,
  selectionCount,
  onActivate,
  onDeactivate,
  onDelete,
  activateLabel,
  deactivateLabel,
  deleteLabel,
  selectionCountLabel,
  noSelectionLabel,
}: BulkActionsBarProps) {
  const { t } = useTranslation();

  const defaultActivateLabel = activateLabel || t('admin.taskManage.activate', 'Aktivieren');
  const defaultDeactivateLabel = deactivateLabel || t('admin.taskManage.deactivate', 'Deaktivieren');
  const defaultDeleteLabel = deleteLabel || t('common.actions.delete', 'Löschen');
  const defaultSelectionCountLabel = selectionCountLabel || ((count: number) => 
    t('admin.taskManage.selectedCount', { count }, `${count} ausgewählt`)
  );
  const defaultNoSelectionLabel = noSelectionLabel || t('admin.taskManage.noSelection', 'Keine Auswahl');

  return (
    <div className={`${cssPrefix}-management-actions`}>
      <div className={`${cssPrefix}-bulk-buttons`}>
        <button
          className={`${cssPrefix}-action-button`}
          onClick={onActivate}
          disabled={!hasSelection}
          type="button"
        >
          {defaultActivateLabel}
        </button>
        <button
          className={`${cssPrefix}-action-button`}
          onClick={onDeactivate}
          disabled={!hasSelection}
          type="button"
        >
          {defaultDeactivateLabel}
        </button>
        <button
          className={`${cssPrefix}-action-button`}
          onClick={onDelete}
          disabled={!hasSelection}
          type="button"
        >
          {defaultDeleteLabel}
        </button>
      </div>
      <span className={`${cssPrefix}-selection-count`}>
        {hasSelection ? defaultSelectionCountLabel(selectionCount) : defaultNoSelectionLabel}
      </span>
    </div>
  );
}
