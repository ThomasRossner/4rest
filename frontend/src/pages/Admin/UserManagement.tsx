import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES, UserRole } from '../../constants/enums';
import { pushToast } from '../../components/Toaster/Toaster';
import './UserManagement.css';

type UserListItem = {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
  user_type: string;
  points: number;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
};

type UserDetails = {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
  user_type: string;
  points: number;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  statistics?: {
    tasksCompleted: number;
    treesPlanted: number;
    totalPoints: number;
    co2Saved: number;
    rewardsRedeemed: number;
    firstTaskDate: string | null;
    lastTaskDate: string | null;
  };
};

export function UserManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filters = useMemo(() => {
    const f: any = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
    if (roleFilter !== 'all') {
      f.role = roleFilter;
    }
    if (activeFilter !== 'all') {
      f.active = activeFilter === 'active';
    }
    if (searchQuery.trim()) {
      f.search = searchQuery.trim();
    }
    return f;
  }, [roleFilter, activeFilter, searchQuery, page, pageSize]);

  const { data: usersData, isLoading, error } = useQuery(
    ['users', filters],
    () => api.listUsers(filters),
    {
      enabled: !!currentUser,
    }
  );

  const { data: userDetails, isLoading: detailsLoading } = useQuery(
    ['userDetails', selectedUserId],
    () => api.getUserDetails(selectedUserId!),
    {
      enabled: !!selectedUserId,
    }
  );

  const { data: userStatistics } = useQuery(
    ['userStatistics', selectedUserId],
    () => api.getUserStatistics(selectedUserId!),
    {
      enabled: !!selectedUserId,
    }
  );

  const updateRoleMutation = useMutation(
    ({ userId, role }: { userId: string; role: UserRole }) => api.updateUserRole(userId, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['userDetails', selectedUserId]);
        pushToast({ type: 'success', message: t('admin.users.messages.roleUpdated') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.roleUpdateError') });
      },
    }
  );

  const updatePointsMutation = useMutation(
    ({ userId, points }: { userId: string; points: number }) => api.updateUserPoints(userId, points),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['userDetails', selectedUserId]);
        pushToast({ type: 'success', message: t('admin.users.messages.pointsUpdated') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.pointsUpdateError') });
      },
    }
  );

  const toggleActiveMutation = useMutation(
    (userId: string) => api.toggleUserActive(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['userDetails', selectedUserId]);
        pushToast({ type: 'success', message: t('admin.users.messages.activeToggled') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.activeToggleError') });
      },
    }
  );

  const resetPasswordMutation = useMutation(
    (userId: string) => api.resetUserPassword(userId),
    {
      onSuccess: (data) => {
        pushToast({ type: 'success', message: t('admin.users.messages.passwordReset', { token: data.resetToken }) });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.passwordResetError') });
      },
    }
  );

  const deleteUserMutation = useMutation(
    ({ userId, hardDelete }: { userId: string; hardDelete: boolean }) => api.deleteUser(userId, hardDelete),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        if (selectedUserId) {
          setSelectedUserId(null);
        }
        pushToast({ type: 'success', message: t('admin.users.messages.userDeleted') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.userDeleteError') });
      },
    }
  );

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleCloseDetails = () => {
    setSelectedUserId(null);
  };

  const handleUpdateRole = (userId: string, role: UserRole) => {
    if (confirm(t('admin.users.confirmRoleChange'))) {
      updateRoleMutation.mutate({ userId, role });
    }
  };

  const handleUpdatePoints = (userId: string, points: number) => {
    if (confirm(t('admin.users.confirmPointsChange'))) {
      updatePointsMutation.mutate({ userId, points });
    }
  };

  const handleToggleActive = (userId: string) => {
    if (confirm(t('admin.users.confirmToggleActive'))) {
      toggleActiveMutation.mutate(userId);
    }
  };

  const handleResetPassword = (userId: string) => {
    if (confirm(t('admin.users.confirmPasswordReset'))) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const handleDeleteUser = (userId: string, hardDelete: boolean = false) => {
    const message = hardDelete
      ? t('admin.users.confirmHardDelete')
      : t('admin.users.confirmSoftDelete');
    if (confirm(message)) {
      deleteUserMutation.mutate({ userId, hardDelete });
    }
  };

  if (error) {
    return (
      <div className="admin-error">
        {t('admin.users.errors.loadError')}: {String(error)}
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-filters">
        <div className="user-management-filter-group">
          <label>{t('admin.users.filters.role')}</label>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="all">{t('admin.users.filters.allRoles')}</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`admin.users.roles.${role}`) || role}
              </option>
            ))}
          </select>
        </div>
        <div className="user-management-filter-group">
          <label>{t('admin.users.filters.status')}</label>
          <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
            <option value="all">{t('admin.users.filters.allStatuses')}</option>
            <option value="active">{t('admin.users.filters.active')}</option>
            <option value="inactive">{t('admin.users.filters.inactive')}</option>
          </select>
        </div>
        <div className="user-management-filter-group">
          <label>{t('admin.users.filters.search')}</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder={t('admin.users.filters.searchPlaceholder')}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading">{t('admin.users.loading')}</div>
      ) : (
        <>
          <div className="user-management-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.users.table.name')}</th>
                  <th>{t('admin.users.table.email')}</th>
                  <th>{t('admin.users.table.role')}</th>
                  <th>{t('admin.users.table.points')}</th>
                  <th>{t('admin.users.table.status')}</th>
                  <th>{t('admin.users.table.created')}</th>
                  <th>{t('admin.users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table-empty">
                      {t('admin.users.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((user: UserListItem) => (
                    <tr
                      key={user.id}
                      className={user.id === selectedUserId ? 'selected' : ''}
                      onClick={() => handleUserClick(user.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{user.name}</td>
                      <td>{user.email || '-'}</td>
                      <td>{t(`admin.users.roles.${user.role}`) || user.role}</td>
                      <td>{user.points}</td>
                      <td>
                        <span className={user.active ? 'status-active' : 'status-inactive'}>
                          {user.active ? t('admin.users.status.active') : t('admin.users.status.inactive')}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="admin-icon-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(user.id);
                          }}
                          title={t('admin.users.actions.viewDetails')}
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="user-management-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t('admin.users.pagination.previous')}
              </button>
              <span>
                {t('admin.users.pagination.page', { current: page, total: totalPages })}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('admin.users.pagination.next')}
              </button>
            </div>
          )}
        </>
      )}

      {selectedUserId && (
        <div className="user-details-modal" onClick={handleCloseDetails}>
          <div className="user-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="user-details-header">
              <h2>{t('admin.users.details.title')}</h2>
              <button className="admin-icon-button" onClick={handleCloseDetails}>
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="admin-loading">{t('admin.users.loading')}</div>
            ) : userDetails?.user ? (
              <div className="user-details-body">
                <div className="user-details-section">
                  <h3>{t('admin.users.details.basicInfo')}</h3>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.name')}</label>
                    <span>{userDetails.user.name}</span>
                  </div>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.email')}</label>
                    <span>{userDetails.user.email || '-'}</span>
                  </div>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.role')}</label>
                    <select
                      value={userDetails.user.role}
                      onChange={(e) => handleUpdateRole(selectedUserId, e.target.value as UserRole)}
                      disabled={selectedUserId === currentUser?.id}
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t(`admin.users.roles.${role}`) || role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.userType')}</label>
                    <span>{userDetails.user.user_type}</span>
                  </div>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.points')}</label>
                    <input
                      type="number"
                      value={userDetails.user.points || 0}
                      onChange={(e) => {
                        const newPoints = parseInt(e.target.value, 10);
                        if (!isNaN(newPoints)) {
                          handleUpdatePoints(selectedUserId, newPoints);
                        }
                      }}
                      min={0}
                    />
                  </div>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.status')}</label>
                    <span className={userDetails.user.active ? 'status-active' : 'status-inactive'}>
                      {userDetails.user.active ? t('admin.users.status.active') : t('admin.users.status.inactive')}
                    </span>
                    {selectedUserId !== currentUser?.id && (
                      <button
                        className="admin-button-secondary"
                        onClick={() => handleToggleActive(selectedUserId)}
                      >
                        {userDetails.user.active ? t('admin.users.actions.deactivate') : t('admin.users.actions.activate')}
                      </button>
                    )}
                  </div>
                  <div className="user-details-field">
                    <label>{t('admin.users.details.createdAt')}</label>
                    <span>{new Date(userDetails.user.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {userStatistics && (
                  <div className="user-details-section">
                    <h3>{t('admin.users.details.statistics')}</h3>
                    <div className="user-details-stats">
                      <div className="user-details-stat">
                        <label>{t('admin.users.stats.tasksCompleted')}</label>
                        <span>{userStatistics.tasksCompleted || 0}</span>
                      </div>
                      <div className="user-details-stat">
                        <label>{t('admin.users.stats.treesPlanted')}</label>
                        <span>{userStatistics.treesPlanted || 0}</span>
                      </div>
                      <div className="user-details-stat">
                        <label>{t('admin.users.stats.totalPointsEarned')}</label>
                        <span>{userStatistics.totalPointsEarned || 0}</span>
                      </div>
                      <div className="user-details-stat">
                        <label>{t('admin.users.stats.co2Saved')}</label>
                        <span>{userStatistics.co2Saved?.toFixed(2) || '0.00'} kg</span>
                      </div>
                      <div className="user-details-stat">
                        <label>{t('admin.users.stats.rewardsRedeemed')}</label>
                        <span>{userStatistics.rewardsRedeemed || 0}</span>
                      </div>
                      {userStatistics.tasksLast7Days !== undefined && (
                        <div className="user-details-stat">
                          <label>{t('admin.users.stats.tasksLast7Days')}</label>
                          <span>{userStatistics.tasksLast7Days || 0}</span>
                        </div>
                      )}
                      {userStatistics.tasksLast30Days !== undefined && (
                        <div className="user-details-stat">
                          <label>{t('admin.users.stats.tasksLast30Days')}</label>
                          <span>{userStatistics.tasksLast30Days || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="user-details-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => handleResetPassword(selectedUserId)}
                    disabled={resetPasswordMutation.isLoading}
                  >
                    {t('admin.users.actions.resetPassword')}
                  </button>
                  {selectedUserId !== currentUser?.id && (
                    <>
                      <button
                        className="admin-button-danger"
                        onClick={() => handleDeleteUser(selectedUserId, false)}
                        disabled={deleteUserMutation.isLoading}
                      >
                        {t('admin.users.actions.deleteUser')}
                      </button>
                      <button
                        className="admin-button-danger"
                        onClick={() => handleDeleteUser(selectedUserId, true)}
                        disabled={deleteUserMutation.isLoading}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        {t('admin.users.actions.hardDeleteUser')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="admin-error">{t('admin.users.errors.userNotFound')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

