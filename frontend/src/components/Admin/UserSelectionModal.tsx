import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import './UserSelectionModal.css';

type UserSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userIds: string[]) => void;
  excludeUserIds?: string[];
  includeOnlyUserIds?: string[]; // If provided, only show these users (for remove mode)
  title?: string;
  addButtonLabel?: string;
  roleFilter?: 'all' | 'guest' | 'rezeption' | 'redaktion' | 'administrator';
  onlyActive?: boolean;
};

export function UserSelectionModal({
  isOpen,
  onClose,
  onAdd,
  excludeUserIds = [],
  includeOnlyUserIds,
  title,
  addButtonLabel,
  roleFilter = 'all',
  onlyActive = true,
}: UserSelectionModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'points'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const modalRef = useRef<HTMLDivElement>(null);

  // Determine role filter for API call
  let roleToFilter: string | undefined = undefined;
  if (roleFilter !== 'all') {
    roleToFilter = roleFilter;
  }

  const { data: usersData, isLoading, error } = useQuery(
    ['users', roleToFilter, onlyActive],
    () => api.listUsers({
      role: roleToFilter,
      active: onlyActive ? true : undefined,
      limit: 1000,
    }),
    {
      enabled: isOpen,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const users = usersData?.users || [];

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user: any) => {
      // If includeOnlyUserIds is provided, only show those users (for remove mode)
      if (includeOnlyUserIds && includeOnlyUserIds.length > 0) {
        if (!includeOnlyUserIds.includes(user.id)) {
          return false;
        }
      } else {
        // Exclude already added users (for add mode)
        if (excludeUserIds.includes(user.id)) {
          return false;
        }
      }
      
      // Filter by search term
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        return (
          user.name?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.role?.toLowerCase().includes(search)
        );
      }
      return true;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'role':
          aVal = a.role || '';
          bVal = b.role || '';
          break;
        case 'points':
          aVal = a.points || 0;
          bVal = b.points || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal);
        }
        return aVal - bVal;
      } else {
        if (typeof aVal === 'string') {
          return bVal.localeCompare(aVal);
        }
        return bVal - aVal;
      }
    });

    return filtered;
  }, [users, excludeUserIds, includeOnlyUserIds, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds(new Set());
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleToggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredAndSortedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredAndSortedUsers.map((u: any) => u.id)));
    }
  };

  const handleAdd = () => {
    if (selectedUserIds.size > 0) {
      onAdd(Array.from(selectedUserIds));
      setSelectedUserIds(new Set());
      onClose();
    }
  };

  const handleSort = (field: 'name' | 'email' | 'role' | 'points') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div ref={modalRef} className="user-selection-modal">
        <div className="user-selection-header">
          <h3>{title || t('admin.userSelection.title')}</h3>
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            aria-label={t('common.actions.close')}
          >
            ✕
          </button>
        </div>

        <div className="user-selection-content">
          <div className="user-selection-filters">
            <input
              type="text"
              placeholder={t('admin.userSelection.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-selection-search"
            />
            <div className="user-selection-sort">
              <label>{t('admin.userSelection.sortBy')}</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="name">{t('admin.userSelection.sortName')}</option>
                <option value="email">{t('admin.userSelection.sortEmail')}</option>
                <option value="role">{t('admin.userSelection.sortRole')}</option>
                <option value="points">{t('admin.userSelection.sortPoints')}</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="user-selection-sort-toggle"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {isLoading && <p>{t('admin.userSelection.loading')}</p>}
          {error && (
            <p className="admin-error">
              {t('admin.userSelection.error')}
            </p>
          )}

          {!isLoading && !error && (
            <>
              <div className="user-selection-actions">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="admin-action-button secondary"
                >
                  {selectedUserIds.size === filteredAndSortedUsers.length
                    ? t('admin.userSelection.deselectAll')
                    : t('admin.userSelection.selectAll')}
                </button>
                <span className="user-selection-count">
                  {selectedUserIds.size > 0
                    ? t('admin.userSelection.selected', { count: selectedUserIds.size })
                    : t('admin.userSelection.noSelection')}
                </span>
              </div>

              <div className="user-selection-list">
                {filteredAndSortedUsers.length === 0 ? (
                  <p className="user-selection-empty">
                    {t('admin.userSelection.noUsers')}
                  </p>
                ) : (
                  filteredAndSortedUsers.map((user: any) => (
                    <label
                      key={user.id}
                      className={`user-selection-item ${selectedUserIds.has(user.id) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => handleToggleUser(user.id)}
                      />
                      <div className="user-selection-item-info">
                        <span className="user-selection-item-name">{user.name}</span>
                        <span className="user-selection-item-email">{user.email || '-'}</span>
                        <span className="user-selection-item-role">
                          {t(`admin.users.roles.${user.role}`, user.role)}
                        </span>
                        <span className="user-selection-item-points">
                          {t('admin.userSelection.points')}: {user.points || 0}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="user-selection-footer">
          <button
            type="button"
            onClick={onClose}
            className="admin-action-button secondary"
          >
            {t('common.actions.cancel')}
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedUserIds.size === 0}
            className="admin-action-button"
          >
            {addButtonLabel || t('admin.userSelection.add')} ({selectedUserIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
