import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES, UserRole } from '../../constants/enums';
import { pushToast } from '../../components/Toaster/Toaster';
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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [includeInactiveUsers, setIncludeInactiveUsers] = useState(false);
  const [userManagementMessage, setUserManagementMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('guest');
  const [newUserName, setNewUserName] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

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

  const allUsersSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;
  const hasUserSelection = selectedUserIds.length > 0;

  const toggleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId]);
    } else {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    }
  };

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

  const handleUserBulkStatus = async (active: boolean) => {
    if (!selectedUserIds.length) return;
    try {
      setUserManagementMessage(null);
      // Perform bulk operation by calling toggleUserActive for each user
      const promises = selectedUserIds.map((userId) => {
        // First get the user to check current status
        return api.getUserDetails(userId).then((userData) => {
          if (userData.user.active !== active) {
            return api.toggleUserActive(userId);
          }
          return Promise.resolve();
        });
      });
      await Promise.all(promises);
      setUserManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.selectedUsersActivated', { count: selectedUserIds.length }) : t('admin.messages.selectedUsersDeactivated', { count: selectedUserIds.length }),
      });
      setSelectedUserIds([]);
      void refetchUsers();
    } catch (error: any) {
      setUserManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected users.',
      });
    }
  };

  const handleUserBulkDelete = async () => {
    if (!selectedUserIds.length) return;
    const message = t('admin.users.confirmBulkDelete', { count: selectedUserIds.length });
    if (!confirm(message)) return;
    try {
      setUserManagementMessage(null);
      const promises = selectedUserIds.map((userId) => api.deleteUser(userId, false));
      await Promise.all(promises);
      setUserManagementMessage({
        type: 'success',
        text: t('admin.messages.selectedUsersDeleted', { count: selectedUserIds.length }),
      });
      setSelectedUserIds([]);
      void refetchUsers();
    } catch (error: any) {
      setUserManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to delete selected users.',
      });
    }
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
          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>{t('admin.users.existing.title', 'Bestehende Benutzer')}</h3>
                <p>{t('admin.users.existing.subtitle', 'Verwalten Sie Benutzer, bearbeiten Sie deren Details oder bereinigen Sie inaktive Einträge.')}</p>
              </div>
              <div className="admin-management-controls">
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    style={COMPACT_TOGGLE_STYLE}
                    checked={includeInactiveUsers}
                    onChange={(event) => {
                      setIncludeInactiveUsers(event.target.checked);
                      setSelectedUserIds([]);
                    }}
                  />
                  <span>{t('admin.taskManage.showInactive', 'Inaktive anzeigen')}</span>
                </label>
                <button className="admin-action-button" type="button" onClick={() => setShowNewUserModal(true)}>
                  {t('admin.users.newButton', 'Neuer Benutzer')}
                </button>
              </div>
            </div>
            {userManagementMessage && (
              <p
                className={
                  userManagementMessage.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {userManagementMessage.text}
              </p>
            )}
            <div className="admin-management-actions">
              <div className="admin-bulk-buttons">
                <button
                  className="admin-action-button"
                  onClick={() => handleUserBulkStatus(true)}
                  disabled={!hasUserSelection}
                  type="button"
                >
                  {t('admin.users.activate', 'Aktivieren')}
                </button>
                <button
                  className="admin-action-button"
                  onClick={() => handleUserBulkStatus(false)}
                  disabled={!hasUserSelection}
                  type="button"
                >
                  {t('admin.users.deactivate', 'Deaktivieren')}
                </button>
                <button
                  className="admin-action-button danger"
                  onClick={handleUserBulkDelete}
                  disabled={!hasUserSelection}
                  type="button"
                >
                  {t('common.actions.delete', 'Löschen')}
                </button>
              </div>
              <span className="admin-selection-count">
                {hasUserSelection
                  ? t('admin.users.selectedCount', { count: selectedUserIds.length })
                  : t('admin.users.noSelection', 'Keine Benutzer ausgewählt')}
              </span>
            </div>
            <div className="user-management-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        style={COMPACT_TOGGLE_STYLE}
                        checked={allUsersSelected && filteredUsers.length > 0}
                        disabled={!filteredUsers.length}
                        onChange={(event) =>
                          setSelectedUserIds(
                            event.target.checked
                              ? filteredUsers.map((user) => user.id)
                              : []
                          )
                        }
                        aria-label={t('admin.users.selectAll', 'Alle Benutzer auswählen')}
                      />
                    </th>
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="admin-table-empty">
                        {t('admin.users.noUsers')}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.includes(user.id);
                      return (
                        <tr
                          key={user.id}
                          className={user.id === selectedUserId ? 'selected' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              style={COMPACT_TOGGLE_STYLE}
                              checked={isSelected}
                              onChange={(event) =>
                                toggleUserSelection(user.id, event.target.checked)
                              }
                              aria-label={`Select user ${user.name}`}
                            />
                          </td>
                          <td data-label={t('admin.users.table.name')}>{user.name}</td>
                          <td data-label={t('admin.users.table.email')}>{user.email || '-'}</td>
                          <td data-label={t('admin.users.table.role')}>{t(`admin.users.roles.${user.role}`) || user.role}</td>
                          <td data-label={t('admin.users.table.points')}>{user.points}</td>
                          <td data-label={t('admin.users.table.status')}>
                            <span className={user.active ? 'status-active' : 'status-inactive'}>
                              {user.active ? t('admin.users.status.active') : t('admin.users.status.inactive')}
                            </span>
                          </td>
                          <td data-label={t('admin.users.table.created')}>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td data-label={t('admin.users.table.actions')} className="admin-table-actions">
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleEditUser(user.id)}
                            >
                              {t('common.actions.edit', 'Bearbeiten')}
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleToggleActive(user.id)}
                              disabled={user.id === currentUser?.id}
                            >
                              {user.active ? t('admin.users.deactivate', 'Deaktivieren') : t('admin.users.activate', 'Aktivieren')}
                            </button>
                            <button
                              className="admin-action-button danger"
                              type="button"
                              onClick={() => handleDeleteUser(user.id, false)}
                              disabled={user.id === currentUser?.id}
                            >
                              {t('common.actions.delete', 'Löschen')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
          </div>
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

      {showNewUserModal && (
        <div className="user-details-modal" onClick={() => setShowNewUserModal(false)}>
          <div className="user-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="user-details-header">
              <h2>{t('admin.users.newUser.title', 'Neuen Benutzer anlegen')}</h2>
              <button className="admin-icon-button" onClick={() => setShowNewUserModal(false)}>
                ✕
              </button>
            </div>
            <div className="user-details-body">
              <div className="user-details-section">
                <div className="user-details-field">
                  <label>{t('admin.users.newUser.email', 'E-Mail-Adresse')} *</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder={t('admin.users.newUser.emailPlaceholder', 'benutzer@example.com')}
                  />
                </div>
                <div className="user-details-field">
                  <label>{t('admin.users.newUser.role', 'Rolle')} *</label>
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
                  <label>{t('admin.users.newUser.name', 'Name')} ({t('admin.users.newUser.optional', 'Optional')})</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder={t('admin.users.newUser.namePlaceholder', 'Wird aus E-Mail abgeleitet, falls leer')}
                  />
                </div>
              </div>
              <div className="user-details-actions">
                <button
                  className="admin-button-secondary"
                  onClick={() => setShowNewUserModal(false)}
                  disabled={createUserMutation.isLoading}
                >
                  {t('common.actions.cancel', 'Abbrechen')}
                </button>
                <button
                  className="admin-button-secondary"
                  onClick={() => {
                    if (!newUserEmail.trim()) {
                      pushToast({ type: 'error', message: t('admin.users.newUser.emailRequired', 'E-Mail-Adresse ist erforderlich') });
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
                    ? t('admin.users.newUser.creating', 'Wird erstellt...') 
                    : t('admin.users.newUser.create', 'Benutzer anlegen')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
