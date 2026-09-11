import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type TableColumn<T> = {
  key: string;
  label: string;
  width?: string;
  render: (item: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  filterable?: boolean;
  onFilterClick?: (e: React.MouseEvent) => void;
  filterActive?: boolean;
};

type ManagementTableProps<T extends { id: string }> = {
  items: T[];
  columns: TableColumn<T>[];
  cssPrefix?: string;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (id: string, checked: boolean) => void;
  allSelected: boolean;
  emptyMessage?: string;
  checkboxColumnWidth?: string;
  actionsColumn?: {
    render: (item: T) => ReactNode;
  };
};

export function ManagementTable<T extends { id: string }>({
  items,
  columns,
  cssPrefix = 'admin',
  selectedIds,
  onSelectAll,
  onSelectItem,
  allSelected,
  emptyMessage,
  checkboxColumnWidth = '3rem',
  actionsColumn,
}: ManagementTableProps<T>) {
  const { t } = useTranslation();

  const COMPACT_TOGGLE_STYLE: React.CSSProperties = {
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
    margin: 0,
    flexShrink: 0,
  };

  const colSpan = columns.length + (actionsColumn ? 1 : 0) + 1; // +1 for checkbox column

  return (
    <div className={`${cssPrefix}-table-wrapper`}>
      <table className={`${cssPrefix}-table`}>
        <thead>
          <tr>
            <th style={{ width: checkboxColumnWidth }}>
              <input
                type="checkbox"
                className={`${cssPrefix}-checkbox`}
                style={COMPACT_TOGGLE_STYLE}
                checked={allSelected && items.length > 0}
                disabled={items.length === 0}
                onChange={(event) => onSelectAll(event.target.checked)}
                aria-label={t('admin.taskManage.selectAll')}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.headerClassName}
                style={{
                  width: column.width,
                  cursor: column.filterable ? 'pointer' : 'default',
                  position: column.filterable ? 'relative' : 'static',
                }}
                onClick={column.onFilterClick}
              >
                {column.label} {column.filterActive && '✓'}
              </th>
            ))}
            {actionsColumn && <th>{t('admin.taskManage.actionsColumn')}</th>}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className={`${cssPrefix}-table-empty`}>
                {emptyMessage || t('admin.taskManage.noItems')}
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      className={`${cssPrefix}-checkbox`}
                      style={COMPACT_TOGGLE_STYLE}
                      checked={isSelected}
                      onChange={(event) => onSelectItem(item.id, event.target.checked)}
                      aria-label={`Select ${item.id}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={column.label}
                      className={column.cellClassName}
                    >
                      {column.render(item, index)}
                    </td>
                  ))}
                  {actionsColumn && (
                    <td>
                      <div className={`${cssPrefix}-table-actions`}>
                        {actionsColumn.render(item)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
