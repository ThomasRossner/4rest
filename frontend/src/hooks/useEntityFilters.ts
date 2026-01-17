import { useState, useMemo, useCallback } from 'react';

export type FilterConfig<T> = {
  status?: {
    enabled: boolean;
    getValue: (item: T) => boolean;
  };
  name?: {
    enabled: boolean;
    getValue: (item: T) => string | null | undefined;
  };
  location?: {
    enabled: boolean;
    getValue: (item: T) => string | null | undefined;
  };
  type?: {
    enabled: boolean;
    getValue: (item: T) => string | null | undefined;
  };
  recurrence?: {
    enabled: boolean;
    getValue: (item: T) => string | null | undefined;
  };
  creator?: {
    enabled: boolean;
    getValue: (item: T) => string | null | undefined;
  };
  title?: {
    enabled: boolean;
    getValue: (item: T) => string | null | undefined;
  };
  points?: {
    enabled: boolean;
    getMin: (item: T) => number | null | undefined;
    getMax: (item: T) => number | null | undefined;
  };
  cost?: {
    enabled: boolean;
    getMin: (item: T) => number | null | undefined;
    getMax: (item: T) => number | null | undefined;
  };
};

export type FilterState = {
  status: 'active' | 'inactive' | null;
  name: string;
  location: string | null;
  type: string | null;
  recurrence: string | null;
  creator: string | null;
  title: string;
  pointsMin: string;
  pointsMax: string;
  costMin: string;
  costMax: string;
};

const defaultFilterState: FilterState = {
  status: null,
  name: '',
  location: null,
  type: null,
  recurrence: null,
  creator: null,
  title: '',
  pointsMin: '',
  pointsMax: '',
  costMin: '',
  costMax: '',
};

/**
 * Custom Hook für Filter-State-Management
 * Verwaltet Filter-States und filtert Items basierend auf der Konfiguration
 */
export function useEntityFilters<T>(
  items: T[],
  config: FilterConfig<T>
) {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  const setFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilterState);
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Status-Filter
    if (config.status?.enabled && filters.status) {
      filtered = filtered.filter((item) => {
        const itemStatus = config.status!.getValue(item);
        return filters.status === 'active' ? itemStatus : !itemStatus;
      });
    }

    // Name-Filter
    if (config.name?.enabled && filters.name.trim()) {
      const searchTerm = filters.name.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const itemName = config.name!.getValue(item);
        return itemName?.toLowerCase().includes(searchTerm);
      });
    }

    // Location-Filter
    if (config.location?.enabled && filters.location) {
      filtered = filtered.filter((item) => {
        const itemLocation = config.location!.getValue(item);
        return itemLocation === filters.location;
      });
    }

    // Type-Filter
    if (config.type?.enabled && filters.type) {
      filtered = filtered.filter((item) => {
        const itemType = config.type!.getValue(item);
        return itemType === filters.type;
      });
    }

    // Recurrence-Filter
    if (config.recurrence?.enabled && filters.recurrence) {
      filtered = filtered.filter((item) => {
        const itemRecurrence = config.recurrence!.getValue(item);
        return itemRecurrence === filters.recurrence;
      });
    }

    // Creator-Filter
    if (config.creator?.enabled && filters.creator) {
      filtered = filtered.filter((item) => {
        const itemCreator = config.creator!.getValue(item);
        return itemCreator === filters.creator;
      });
    }

    // Title-Filter
    if (config.title?.enabled && filters.title.trim()) {
      const searchTerm = filters.title.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const itemTitle = config.title!.getValue(item);
        return itemTitle?.toLowerCase().includes(searchTerm);
      });
    }

    // Points-Filter
    if (config.points?.enabled) {
      if (filters.pointsMin.trim()) {
        const min = parseFloat(filters.pointsMin);
        if (!isNaN(min)) {
          filtered = filtered.filter((item) => {
            const itemPoints = config.points!.getMin(item);
            return itemPoints !== null && itemPoints !== undefined && itemPoints >= min;
          });
        }
      }
      if (filters.pointsMax.trim()) {
        const max = parseFloat(filters.pointsMax);
        if (!isNaN(max)) {
          filtered = filtered.filter((item) => {
            const itemPoints = config.points!.getMax(item);
            return itemPoints !== null && itemPoints !== undefined && itemPoints <= max;
          });
        }
      }
    }

    // Cost-Filter
    if (config.cost?.enabled) {
      if (filters.costMin.trim()) {
        const min = parseFloat(filters.costMin);
        if (!isNaN(min)) {
          filtered = filtered.filter((item) => {
            const itemCost = config.cost!.getMin(item);
            return itemCost !== null && itemCost !== undefined && itemCost >= min;
          });
        }
      }
      if (filters.costMax.trim()) {
        const max = parseFloat(filters.costMax);
        if (!isNaN(max)) {
          filtered = filtered.filter((item) => {
            const itemCost = config.cost!.getMax(item);
            return itemCost !== null && itemCost !== undefined && itemCost <= max;
          });
        }
      }
    }

    return filtered;
  }, [items, filters, config]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.status,
      filters.location,
      filters.type,
      filters.recurrence,
      filters.creator,
      filters.name.trim(),
      filters.title.trim(),
      filters.pointsMin.trim() || filters.pointsMax.trim(),
      filters.costMin.trim() || filters.costMax.trim(),
    ].filter(Boolean).length;
  }, [filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    filteredItems,
    activeFilterCount,
  };
}
