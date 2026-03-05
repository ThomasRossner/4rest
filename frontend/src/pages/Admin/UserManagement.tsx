import { useState, useMemo, useEffect } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES, UserRole } from '../../constants/enums';
import { pushToast } from '../../components/Toaster/Toaster';
import { useSelection } from '../../hooks/useSelection';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { ManagementCard } from '../../components/Management/ManagementCard';
import { BulkActionsBar } from '../../components/Management/BulkActionsBar';
import { ManagementTable, type TableColumn } from '../../components/Management/ManagementTable';
import './UserManagement.css';

const COMPACT_TOGGLE_STYLE: React.CSSProperties = {
  width: '1rem',
  height: '1rem',
  cursor: 'pointer',
  margin: 0,
};

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


export function UserManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [includeInactiveUsers, setIncludeInactiveUsers] = useState(false);
  const [userManagementMessage, setUserManagementMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('guest');
  const [newUserName, setNewUserName] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const filters = useMemo(() => {
    const f: any = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
    if (!includeInactiveUsers) {
      f.active = true;
    }
    return f;
  }, [page, pageSize, includeInactiveUsers]);

  const { data: usersData, isLoading, error, refetch: refetchUsers } = useQuery(
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

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredUsers = useMemo(() => {
    return users;
  }, [users]);

  // Use selection hook for users
  const userSelection = useSelection(filteredUsers);
  const allUsersSelected = userSelection.allSelected;
  const hasUserSelection = userSelection.hasSelection;

  const updateRoleMutation = useMutation(
    ({ userId, role }: { userId: string; role: UserRole }) => api.updateUserRole(userId, role),
    {
      onSuccess: (data) => {
        // Update the cache directly instead of invalidating to avoid race condition
        if (data?.user && selectedUserId) {
          queryClient.setQueryData(['userDetails', selectedUserId], { user: data.user });
        }
        queryClient.invalidateQueries(['users']);
        pushToast({ type: 'success', message: t('admin.users.messages.roleUpdated') });
      },
      onError: (error: any) => {
        console.error('[UserManagement] updateRoleMutation error:', error);
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
        setUserManagementMessage({ type: 'success', text: t('admin.users.messages.activeToggled') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.activeToggleError') });
        setUserManagementMessage({ type: 'error', text: error?.response?.data?.error || t('admin.users.messages.activeToggleError') });
      },
    }
  );

  const resetPasswordMutation = useMutation(
    (userId: string) => api.resetUserPassword(userId),
    {
      onSuccess: () => {
        pushToast({ type: 'success', message: t('admin.users.messages.passwordResetEmailSent') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.passwordResetError') });
      },
    }
  );

  const setPasswordMutation = useMutation(
    ({ userId, password }: { userId: string; password: string }) => api.setUserPassword(userId, password),
    {
      onSuccess: () => {
        pushToast({ type: 'success', message: t('admin.users.messages.passwordSetSuccess') });
        setShowPasswordFields(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedUserId(null); // Close the user details modal
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.passwordSetError') });
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

  const createUserMutation = useMutation(
    ({ email, role, name }: { email: string; role: UserRole; name?: string }) => api.createUserByAdmin(email, role, name),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        setShowNewUserModal(false);
        setNewUserEmail('');
        setNewUserRole('guest');
        setNewUserName('');
        pushToast({ type: 'success', message: t('admin.users.messages.userCreated') });
        setUserManagementMessage({ type: 'success', text: t('admin.users.messages.userCreated') });
      },
      onError: (error: any) => {
        pushToast({ type: 'error', message: error?.response?.data?.error || t('admin.users.messages.userCreateError') });
        setUserManagementMessage({ type: 'error', text: error?.response?.data?.error || t('admin.users.messages.userCreateError') });
      },
    }
  );

  // Use bulk operations hook for users
  const userBulkOperations = useBulkOperations(userSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      // Perform bulk operation by calling toggleUserActive for each user
      const promises = ids.map((userId) => {
        // First get the user to check current status
        return api.getUserDetails(userId).then((userData) => {
          if (userData.user.active !== active) {
            return api.toggleUserActive(userId);
          }
          return Promise.resolve();
        });
      });
      await Promise.all(promises);
    },
    bulkDelete: async (ids) => {
      const promises = ids.map((userId) => api.deleteUser(userId, false));
      await Promise.all(promises);
    },
    refetch: async () => {
      await refetchUsers();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedUsersActivated', { count });
      if (action === 'deactivate') return t('admin.messages.selectedUsersDeactivated', { count });
      return t('admin.messages.selectedUsersDeleted', { count });
    },
    getErrorMessage: (action, error) => {
      if (action === 'delete') return error?.message || 'Failed to delete selected users.';
      return error?.message || 'Failed to update selected users.';
    },
  });

  const handleUserBulkStatus = async (active: boolean) => {
    await userBulkOperations.handleBulkStatus(active);
    userSelection.deselectAll();
  };

  const handleUserBulkDelete = async () => {
    if (!userSelection.selectedIds.length) return;
    const message = t('admin.users.confirmBulkDelete', { count: userSelection.selectedIds.length });
    if (!confirm(message)) return;
    await userBulkOperations.handleBulkDelete();
    userSelection.deselectAll();
  };

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
    toggleActiveMutation.mutate(userId);
  };

  const handleResetPassword = (userId: string) => {
    if (confirm(t('admin.users.confirmPasswordReset'))) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const handleTogglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (!showPasswordFields) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSetPasswordSubmit = () => {
    if (!selectedUserId) return;

    if (!newPassword || newPassword.length < 6) {
      pushToast({ type: 'error', message: t('admin.users.messages.passwordTooShort') });
      return;
    }

    if (newPassword !== confirmPassword) {
      pushToast({ type: 'error', message: t('admin.users.messages.passwordsDoNotMatch') });
      return;
    }

    setPasswordMutation.mutate({ userId: selectedUserId, password: newPassword });
  };

  const handleDeleteUser = (userId: string, hardDelete: boolean = false) => {
    const message = hardDelete
      ? t('admin.users.confirmHardDelete')
      : t('admin.users.confirmSoftDelete');
    if (confirm(message)) {
      deleteUserMutation.mutate({ userId, hardDelete });
    }
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
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
      {isLoading ? (
        <div className="admin-loading">{t('admin.users.loading')}</div>
      ) : (
        <>
          <ManagementCard
            cssPrefix="admin"
            title={t('admin.users.existing.title')}
            subtitle={t('admin.users.existing.subtitle')}
            message={userBulkOperations.message || userManagementMessage}
            topControls={
              <>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    style={COMPACT_TOGGLE_STYLE}
                    checked={includeInactiveUsers}
                    onChange={(event) => {
                      setIncludeInactiveUsers(event.target.checked);
                      userSelection.deselectAll();
                    }}
                  />
                  <span>{t('admin.taskManage.showInactive')}</span>
                </label>
                <button className="admin-action-button" type="button" onClick={() => setShowNewUserModal(true)}>
                  {t('admin.users.newButton')}
                </button>
              </>
            }
          >
            <BulkActionsBar
              cssPrefix="admin"
              hasSelection={hasUserSelection}
              selectionCount={userSelection.selectedIds.length}
              onActivate={() => handleUserBulkStatus(true)}
              onDeactivate={() => handleUserBulkStatus(false)}
              onDelete={handleUserBulkDelete}
              activateLabel={t('admin.users.activate')}
              deactivateLabel={t('admin.users.deactivate')}
              deleteLabel={t('common.actions.delete')}
              selectionCountLabel={(count) => t('admin.users.selectedCount', { count })}
              noSelectionLabel={t('admin.users.noSelection')}
            />
            {(() => {
              const userColumns: TableColumn<UserListItem>[] = [
                {
                  key: 'name',
                  label: t('admin.users.table.name'),
                  render: (user) => user.name,
                },
                {
                  key: 'email',
                  label: t('admin.users.table.email'),
                  render: (user) => user.email || '-',
                },
                {
                  key: 'role',
                  label: t('admin.users.table.role'),
                  render: (user) => t(`admin.users.roles.${user.role}`) || user.role,
                },
                {
                  key: 'points',
                  label: t('admin.users.table.points'),
                  render: (user) => user.points,
                },
                {
                  key: 'status',
                  label: t('admin.users.table.status'),
                  render: (user) => (
                    <span className={user.active ? 'status-active' : 'status-inactive'}>
                      {user.active ? t('admin.users.status.active') : t('admin.users.status.inactive')}
                    </span>
                  ),
                },
                {
                  key: 'created',
                  label: t('admin.users.table.created'),
                  render: (user) => new Date(user.created_at).toLocaleDateString(),
                },
              ];

              return (
                <ManagementTable
                  items={filteredUsers}
                  columns={userColumns}
                  cssPrefix="admin"
                  selectedIds={userSelection.selectedIds}
                  onSelectAll={(checked) =>
                    checked ? userSelection.selectAll() : userSelection.deselectAll()
                  }
                  onSelectItem={(id, checked) => userSelection.toggle(id, checked)}
                  allSelected={allUsersSelected}
                  emptyMessage={t('admin.users.noUsers')}
                  actionsColumn={{
                    render: (user) => (
                      <>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => handleEditUser(user.id)}
                        >
                          {t('common.actions.edit')}
                        </button>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => handleToggleActive(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.active ? t('admin.users.deactivate') : t('admin.users.activate')}
                        </button>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => handleDeleteUser(user.id, false)}
                          disabled={user.id === currentUser?.id}
                        >
                          {t('common.actions.delete')}
                        </button>
                      </>
                    ),
                  }}
                />
              );
            })()}
          </ManagementCard>

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
                      value={userDetails.user.role || 'guest'}
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

                {showPasswordFields && (
                  <div className="user-details-section">
                    <h3>{t('admin.users.setPassword.title')}</h3>
                    <div className="user-details-field">
                      <label>{t('admin.users.setPassword.newPassword')}</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('admin.users.setPassword.newPasswordPlaceholder')}
                      />
                    </div>
                    <div className="user-details-field">
                      <label>{t('admin.users.setPassword.confirmPassword')}</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('admin.users.setPassword.confirmPasswordPlaceholder')}
                      />
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="admin-error" style={{ marginTop: '0.5rem' }}>
                        {t('admin.users.messages.passwordsDoNotMatch')}
                      </p>
                    )}
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        className="admin-action-button"
                        onClick={handleSetPasswordSubmit}
                        disabled={setPasswordMutation.isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      >
                        {t('admin.users.setPassword.submit')}
                      </button>
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
                  <button
                    className="admin-button-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleTogglePasswordFields();
                    }}
                    disabled={setPasswordMutation.isLoading}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    {showPasswordFields ? t('admin.users.actions.cancelPassword') : t('admin.users.actions.setPassword')}
                  </button>
                  {selectedUserId !== currentUser?.id && (
                    <>
                      <button
                        className="admin-action-button"
                        onClick={() => handleDeleteUser(selectedUserId, false)}
                        disabled={deleteUserMutation.isLoading}
                      >
                        {t('admin.users.actions.deleteUser')}
                      </button>
                      <button
                        className="admin-action-button"
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

      {showNewUserModal && (
        <div className="user-details-modal" onClick={() => setShowNewUserModal(false)}>
          <div className="user-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="user-details-header">
              <h2>{t('admin.users.newUser.title')}</h2>
              <button className="admin-icon-button" onClick={() => setShowNewUserModal(false)}>
                ✕
              </button>
            </div>
            <div className="user-details-body">
              <div className="user-details-section">
                <div className="user-details-field">
                  <label>{t('admin.users.newUser.email')} *</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder={t('admin.users.newUser.emailPlaceholder')}
                  />
                </div>
                <div className="user-details-field">
                  <label>{t('admin.users.newUser.role')} *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(`admin.users.roles.${role}`) || role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="user-details-field">
                  <label>{t('admin.users.newUser.name')} ({t('admin.users.newUser.optional')})</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder={t('admin.users.newUser.namePlaceholder')}
                  />
                </div>
              </div>
              <div className="user-details-actions">
                <button
                  className="admin-button-secondary"
                  onClick={() => setShowNewUserModal(false)}
                  disabled={createUserMutation.isLoading}
                >
                  {t('common.actions.cancel')}
                </button>
                <button
                  className="admin-button-secondary"
                  onClick={() => {
                    if (!newUserEmail.trim()) {
                      pushToast({ type: 'error', message: t('admin.users.newUser.emailRequired') });
                      return;
                    }
                    createUserMutation.mutate({ 
                      email: newUserEmail.trim(), 
                      role: newUserRole,
                      name: newUserName.trim() || undefined
                    });
                  }}
                  disabled={createUserMutation.isLoading || !newUserEmail.trim()}
                >
                  {createUserMutation.isLoading 
                    ? t('admin.users.newUser.creating') 
                    : t('admin.users.newUser.create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
