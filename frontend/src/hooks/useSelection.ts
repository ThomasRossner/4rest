import { useState, useCallback, useMemo } from 'react';

/**
 * Custom Hook für Selection-State-Management
 * Verwaltet die Auswahl von Items in Management-Tabellen
 */
export function useSelection<T extends { id: string }>(items: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter((i) => i !== id);
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(items.map((item) => item.id));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const allSelected = useMemo(() => {
    return items.length > 0 && selectedIds.length === items.length;
  }, [items.length, selectedIds.length]);

  const hasSelection = useMemo(() => {
    return selectedIds.length > 0;
  }, [selectedIds.length]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  return {
    selectedIds,
    selectedItems,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    allSelected,
    hasSelection,
    setSelectedIds,
  };
}
