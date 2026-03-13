import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';
import { SurveyAnalytics } from '../Admin/SurveyAnalytics';
import { LocationMap } from '../../components/LocationMap/LocationMap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useSelection } from '../../hooks/useSelection';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { ManagementHeader } from '../../components/Management/ManagementHeader';
import { ManagementCard } from '../../components/Management/ManagementCard';
import { BulkActionsBar } from '../../components/Management/BulkActionsBar';
import { ManagementTable, type TableColumn } from '../../components/Management/ManagementTable';
import { RewardType } from '../../constants/enums';
import { pushToast } from '../../components/Toaster/Toaster';
import { TaskTypeIcon } from '../../components/TypeIcons/TaskTypeIcon';
import { RewardTypeIcon } from '../../components/TypeIcons/RewardTypeIcon';
import './RedaktionPage.css';

type RedaktionMode = 'taskManage' | 'rewardManage' | 'locationManage' | 'surveyAnalytics' | 'task' | 'reward' | null;

// Icon component helper
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    back: '←',
    refresh: '↻',
    close: '×',
  };
  return <span>{icons[name] || name}</span>;
};

function RedaktionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mode, setMode] = useState<RedaktionMode>(null);
  
  // Location management state
  const [includeInactiveLocations, setIncludeInactiveLocations] = useState(false);
  const [locationFilterStatus, setLocationFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [locationFilterName, setLocationFilterName] = useState('');
  
  // Task management state
  const [includeInactiveTasks, setIncludeInactiveTasks] = useState(false);
  
  // Reward management state
  const [includeInactiveRewards, setIncludeInactiveRewards] = useState(false);

  // Fetch tasks for task management
  const {
    data: adminTasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery(
    ['adminTasks', includeInactiveTasks],
    () => api.getTasks({ includeAll: true, includeInactive: includeInactiveTasks }),
    {
      enabled: mode === 'taskManage',
    }
  );

  // Fetch rewards for reward management
  const {
    data: rewardTemplates,
    isLoading: rewardTemplatesLoading,
    error: rewardTemplatesError,
    refetch: refetchRewardTemplates,
  } = useQuery(
    ['adminRewards', includeInactiveRewards],
    () => api.getRewardTemplates({ includeInactive: includeInactiveRewards }),
    {
      enabled: mode === 'rewardManage',
    }
  );

  // Fetch locations for location management
  const {
    data: locations,
    isLoading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery(
    ['adminLocations', includeInactiveLocations],
    () => api.getLocations({ includeInactive: includeInactiveLocations }),
    {
      enabled: mode === 'locationManage',
    }
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!adminTasks || !Array.isArray(adminTasks)) return [];
    return adminTasks;
  }, [adminTasks]);

  // Filter rewards
  const filteredRewards = useMemo(() => {
    if (!rewardTemplates || !Array.isArray(rewardTemplates)) return [];
    return rewardTemplates;
  }, [rewardTemplates]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    return locations.filter((loc: any) => {
      if (locationFilterStatus && loc.active !== (locationFilterStatus === 'active')) return false;
      if (locationFilterName && !loc.name?.toLowerCase().includes(locationFilterName.toLowerCase())) return false;
      return true;
    });
  }, [locations, locationFilterStatus, locationFilterName]);

  // Task selection and bulk operations
  const taskSelection = useSelection(filteredTasks);
  const taskBulkOperations = useBulkOperations(taskSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateTasksStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      await api.bulkDeleteTasks(ids);
    },
    refetch: async () => {
      await refetchTasks();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedTasksActivated', { count });
      if (action === 'deactivate') return t('admin.messages.selectedTasksDeactivated', { count });
      return t('admin.messages.selectedTasksDeleted', { count });
    },
  });

  // Reward selection and bulk operations
  const rewardSelection = useSelection(filteredRewards);
  const rewardBulkOperations = useBulkOperations(rewardSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateRewardsStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      await api.bulkDeleteRewards(ids);
    },
    refetch: async () => {
      await refetchRewardTemplates();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedRewardsActivated', { count });
      if (action === 'deactivate') return t('admin.messages.selectedRewardsDeactivated', { count });
      return t('admin.messages.selectedRewardsDeleted', { count });
    },
  });

  // Location selection and bulk operations
  const locationSelection = useSelection(filteredLocations);
  const locationBulkOperations = useBulkOperations(locationSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateLocationsStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      await api.bulkDeleteLocations(ids);
    },
    refetch: async () => {
      await refetchLocations();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedLocationsActivated', { count });
      if (action === 'deactivate') return t('admin.messages.selectedLocationsDeactivated', { count });
      return t('admin.messages.selectedLocationsDeleted', { count });
    },
  });

  // Task handlers
  const handleTaskBulkStatus = async (active: boolean) => {
    await taskBulkOperations.handleBulkStatus(active);
    taskSelection.deselectAll();
  };

  const handleTaskBulkDelete = async () => {
    if (!taskSelection.selectedIds.length) return;
    if (!confirm(t('admin.confirm.deleteSelectedTasks.description', { count: taskSelection.selectedIds.length }))) return;
    await taskBulkOperations.handleBulkDelete();
    taskSelection.deselectAll();
  };

  const handleTaskStatusChange = async (taskId: string, active: boolean) => {
    try {
      await api.bulkUpdateTasksStatus([taskId], active);
      pushToast({ type: 'success', message: active ? t('admin.messages.taskActivated') : t('admin.messages.taskDeactivated') });
      await refetchTasks();
    } catch (error: any) {
      pushToast({ type: 'error', message: error?.message || t('admin.messages.failedToUpdateTask') });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm(t('admin.confirm.deleteTaskSingle.description'))) return;
    try {
      await api.bulkDeleteTasks([taskId]);
      pushToast({ type: 'success', message: t('admin.messages.taskDeleted') });
      await refetchTasks();
    } catch (error: any) {
      pushToast({ type: 'error', message: error?.message || t('admin.messages.failedToDeleteTask') });
    }
  };

  const handleTaskEdit = (taskId: string) => {
    // Find the task in the current list
    const task = filteredTasks.find((t: any) => t.id === taskId);
    if (!task) {
      pushToast({ type: 'error', message: t('admin.messages.taskNotFound') });
      return;
    }
    // Set edit mode and load task data
    setMode('task');
    // TODO: Implement task editing form state and logic
    pushToast({ type: 'info', message: 'Task editing will be implemented here' });
  };

  const handleRewardEdit = (rewardId: string) => {
    // Find the reward in the current list
    const reward = filteredRewards.find((r: any) => r.id === rewardId);
    if (!reward) {
      pushToast({ type: 'error', message: t('admin.messages.rewardNotFound') });
      return;
    }
    // Set edit mode and load reward data
    setMode('reward');
    // TODO: Implement reward editing form state and logic
    pushToast({ type: 'info', message: 'Reward editing will be implemented here' });
  };

  // Reward handlers
  const handleRewardBulkStatus = async (active: boolean) => {
    await rewardBulkOperations.handleBulkStatus(active);
    rewardSelection.deselectAll();
  };

  const handleRewardBulkDelete = async () => {
    if (!rewardSelection.selectedIds.length) return;
    if (!confirm(t('admin.confirm.deleteSelectedRewards.description', { count: rewardSelection.selectedIds.length }))) return;
    await rewardBulkOperations.handleBulkDelete();
    rewardSelection.deselectAll();
  };

  const handleRewardStatusChange = async (rewardId: string, active: boolean) => {
    try {
      await api.bulkUpdateRewardsStatus([rewardId], active);
      pushToast({ type: 'success', message: active ? t('admin.messages.rewardActivated') : t('admin.messages.rewardDeactivated') });
      await refetchRewardTemplates();
    } catch (error: any) {
      pushToast({ type: 'error', message: error?.message || t('admin.messages.failedToUpdateReward') });
    }
  };

  const handleRewardDelete = async (rewardId: string) => {
    if (!confirm(t('admin.confirm.deleteRewardSingle.description'))) return;
    try {
      await api.bulkDeleteRewards([rewardId]);
      pushToast({ type: 'success', message: t('admin.messages.rewardDeleted') });
      await refetchRewardTemplates();
    } catch (error: any) {
      pushToast({ type: 'error', message: error?.message || t('admin.messages.failedToDeleteReward') });
    }
  };

  // Location handlers
  const handleLocationBulkStatus = async (active: boolean) => {
    await locationBulkOperations.handleBulkStatus(active);
    locationSelection.deselectAll();
  };

  const handleLocationBulkDelete = async () => {
    if (!locationSelection.selectedIds.length) return;
    if (!confirm(t('admin.confirm.deleteSelectedLocations.description', { count: locationSelection.selectedIds.length }))) return;
    await locationBulkOperations.handleBulkDelete();
    locationSelection.deselectAll();
  };

  const handleLocationStatusChange = async (locationId: string, active: boolean) => {
    try {
      await api.bulkUpdateLocationsStatus([locationId], active);
      pushToast({ type: 'success', message: active ? t('admin.messages.locationActivated') : t('admin.messages.locationDeactivated') });
      await refetchLocations();
    } catch (error: any) {
      pushToast({ type: 'error', message: error?.message || t('admin.messages.failedToUpdateLocation') });
    }
  };

  const handleLocationDelete = async (locationId: string) => {
    if (!confirm(t('admin.confirm.deleteLocationSingle.description'))) return;
    try {
      await api.deleteLocation(locationId);
      pushToast({ type: 'success', message: t('admin.messages.locationDeleted') });
      locationSelection.setSelectedIds((prev) => prev.filter((id) => id !== locationId));
      await refetchLocations();
    } catch (error: any) {
      pushToast({ type: 'error', message: error?.message || t('admin.messages.failedToDeleteLocation') });
    }
  };

  // Task and Reward management will reuse AdminPage components
  // For now, we'll create simplified views or redirect to admin functionality
  // In a full implementation, these would be separate components

  return (
    <div className="redaktion-page">
      <header className="redaktion-header">
        <nav className="redaktion-navbar">
          <div className="redaktion-navbar-space" />
          <button className="redaktion-logout-button" onClick={logout} type="button">
            {t('navigation.logout')}
          </button>
        </nav>
        <div className="redaktion-hero">
          <h1 className="redaktion-hero-title">{t('redaktion.title')}</h1>
          <p className="redaktion-hero-subtitle">{t('redaktion.subtitle')}</p>
        </div>
      </header>

      {mode === null && (
        <>
          {/* 1. Reihe: Aufgaben verwalten, Belohnungen verwalten */}
          <div className="redaktion-dashboard-grid">
            <DashboardCard
              icon="🗂️"
              title={t('redaktion.actions.manageTasks.title')}
              description={t('redaktion.actions.manageTasks.description')}
              onClick={() => setMode('taskManage')}
            />
            <DashboardCard
              icon="🧾"
              title={t('redaktion.actions.manageRewards.title')}
              description={t('redaktion.actions.manageRewards.description')}
              onClick={() => setMode('rewardManage')}
            />
          </div>
          {/* 2. Reihe: Standorte verwalten, Umfrage-Analysen */}
          <div className="redaktion-dashboard-grid">
            <DashboardCard
              icon="🗺️"
              title={t('redaktion.actions.manageLocations.title')}
              description={t('redaktion.actions.manageLocations.description')}
              onClick={() => setMode('locationManage')}
            />
            <DashboardCard
              icon="📊"
              title={t('redaktion.actions.surveyAnalytics.title')}
              description={t('redaktion.actions.surveyAnalytics.description')}
              onClick={() => setMode('surveyAnalytics')}
            />
          </div>
        </>
      )}

      {mode === 'surveyAnalytics' && (
        <section className="redaktion-section">
          <header className="redaktion-section-header">
            <div>
              <h2>{t('redaktion.surveyAnalytics.title')}</h2>
            </div>
            <div className="redaktion-actions">
              <button
                className="redaktion-icon-button"
                onClick={() => setMode(null)}
                title={t('common.actions.back')}
                type="button"
              >
                <Icon name="back" />
                <span className="sr-only">{t('common.actions.back')}</span>
              </button>
            </div>
          </header>
          <SurveyAnalytics />
        </section>
      )}

      {mode === 'locationManage' && (
        <section className="redaktion-section">
          <ManagementHeader
            title={t('redaktion.locationManage.title')}
            subtitle={t('redaktion.locationManage.subtitle')}
            cssPrefix="redaktion"
            onBack={() => setMode(null)}
            onRefresh={() => refetchLocations()}
            showBack={true}
            showRefresh={true}
          />

          {locationsLoading && <p>{t('redaktion.locationManage.loading')}</p>}
          {Boolean(locationsError) && (
            <p className="redaktion-error">{t('redaktion.locationManage.loadError')}</p>
          )}

          <ManagementCard
            cssPrefix="redaktion"
            title={t('redaktion.locationManage.existing.title')}
            subtitle={t('redaktion.locationManage.existing.subtitle')}
            message={locationBulkOperations.message}
            topControls={
              <>
                <div className="redaktion-filters">
                  <input
                    type="text"
                    placeholder={t('redaktion.locationManage.filterByName')}
                    value={locationFilterName}
                    onChange={(e) => setLocationFilterName(e.target.value)}
                    className="redaktion-filter-input"
                  />
                  <select
                    value={locationFilterStatus || ''}
                    onChange={(e) => setLocationFilterStatus(e.target.value as 'active' | 'inactive' | null || null)}
                    className="redaktion-filter-select"
                  >
                    <option value="">{t('redaktion.locationManage.filterAll')}</option>
                    <option value="active">{t('redaktion.locationManage.filterActive')}</option>
                    <option value="inactive">{t('redaktion.locationManage.filterInactive')}</option>
                  </select>
                </div>
                <label className="redaktion-toggle">
                  <input
                    type="checkbox"
                    className="redaktion-checkbox"
                    checked={includeInactiveLocations}
                    onChange={(event) => {
                      setIncludeInactiveLocations(event.target.checked);
                      locationSelection.deselectAll();
                    }}
                  />
                  <span>{t('redaktion.locationManage.showInactive')}</span>
                </label>
              </>
            }
          >
            <BulkActionsBar
              cssPrefix="redaktion"
              hasSelection={locationSelection.hasSelection}
              selectionCount={locationSelection.selectedIds.length}
              onActivate={() => handleLocationBulkStatus(true)}
              onDeactivate={() => handleLocationBulkStatus(false)}
              onDelete={handleLocationBulkDelete}
              activateLabel={t('admin.locationManage.activate')}
              deactivateLabel={t('admin.locationManage.deactivate')}
              deleteLabel={t('common.actions.delete')}
              selectionCountLabel={(count) => t('admin.locationManage.selectedCount', { count })}
              noSelectionLabel={t('admin.locationManage.noSelection')}
            />
            {(() => {
              const locationColumns: TableColumn<any>[] = [
                {
                  key: 'name',
                  label: t('admin.locationManage.table.name'),
                  render: (location) => (
                    <div className="redaktion-table-primary">
                      <span className="redaktion-table-title">{location.name}</span>
                      {location.description && (
                        <span className="redaktion-table-subtitle">{location.description}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'type',
                  label: t('admin.locationManage.table.type'),
                  render: (location) => (
                    <span className="redaktion-status-badge">
                      {location.is_online ? t('admin.locationManage.online') : t('admin.locationManage.physical')}
                    </span>
                  ),
                },
                {
                  key: 'details',
                  label: t('admin.locationManage.table.details'),
                  render: (location) =>
                    location.is_online ? (
                      <span className="redaktion-table-subtitle">{t('admin.locationManage.online')}</span>
                    ) : (
                      <div className="redaktion-table-secondary">
                        {location.address && (
                          <span className="redaktion-table-subtitle">{location.address}</span>
                        )}
                        <span className="redaktion-table-subtitle">
                          {location.latitude}, {location.longitude}
                        </span>
                      </div>
                    ),
                },
                {
                  key: 'status',
                  label: t('admin.locationManage.table.status'),
                  render: (location) => (
                    <span
                      className={`redaktion-status-badge ${location.active ? 'active' : 'inactive'}`}
                    >
                      {location.active ? t('common.status.active') : t('common.status.inactive')}
                    </span>
                  ),
                },
              ];

              return (
                <ManagementTable
                  items={filteredLocations}
                  columns={locationColumns}
                  cssPrefix="redaktion"
                  selectedIds={locationSelection.selectedIds}
                  onSelectAll={(checked) =>
                    checked ? locationSelection.selectAll() : locationSelection.deselectAll()
                  }
                  onSelectItem={(id, checked) => locationSelection.toggle(id, checked)}
                  allSelected={locationSelection.allSelected}
                  emptyMessage={t('redaktion.locationManage.noLocations')}
                  actionsColumn={{
                    render: (location) => (
                      <>
                        <button
                          className="redaktion-action-button"
                          type="button"
                          onClick={() => handleLocationStatusChange(location.id, !location.active)}
                        >
                          {location.active
                            ? t('admin.locationManage.deactivate')
                            : t('admin.locationManage.activate')}
                        </button>
                        <button
                          className="redaktion-action-button danger"
                          type="button"
                          onClick={() => handleLocationDelete(location.id)}
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
        </section>
      )}

      {mode === 'taskManage' && (
        <section className="redaktion-section">
          <ManagementHeader
            title={t('redaktion.actions.manageTasks.title')}
            subtitle={t('redaktion.taskManage.subtitle')}
            cssPrefix="redaktion"
            onBack={() => setMode(null)}
            onRefresh={() => refetchTasks()}
            showBack={true}
            showRefresh={true}
          />

          {tasksLoading && <p>{t('admin.taskManage.loading')}</p>}
          {Boolean(tasksError) && (
            <p className="redaktion-error">{t('admin.taskManage.loadError')}</p>
          )}

          <ManagementCard
            cssPrefix="redaktion"
            title={t('admin.taskManage.existing.title')}
            subtitle={t('admin.taskManage.reviewDescription')}
            message={taskBulkOperations.message}
            topControls={
              <label className="redaktion-toggle">
                <input
                  type="checkbox"
                  className="redaktion-checkbox"
                  checked={includeInactiveTasks}
                  onChange={(event) => {
                    setIncludeInactiveTasks(event.target.checked);
                    taskSelection.deselectAll();
                  }}
                />
                <span>{t('admin.taskManage.showInactive')}</span>
              </label>
            }
          >
            <BulkActionsBar
              cssPrefix="redaktion"
              hasSelection={taskSelection.hasSelection}
              selectionCount={taskSelection.selectedIds.length}
              onActivate={() => handleTaskBulkStatus(true)}
              onDeactivate={() => handleTaskBulkStatus(false)}
              onDelete={handleTaskBulkDelete}
              activateLabel={t('admin.taskManage.activate')}
              deactivateLabel={t('admin.taskManage.deactivate')}
              deleteLabel={t('common.actions.delete')}
              selectionCountLabel={(count) => t('admin.taskManage.selectedCount', { count })}
              noSelectionLabel={t('admin.taskManage.noSelection')}
            />
            {(() => {
              const taskColumns: TableColumn<any>[] = [
                {
                  key: 'title',
                  label: t('admin.taskManage.table.title'),
                  render: (task) => (
                    <div className="redaktion-table-primary">
                      <span className="redaktion-table-title">
                        {task.title || t('admin.task.untitled')}
                      </span>
                      {task.description && (
                        <span className="redaktion-table-subtitle">{task.description}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'type',
                  label: t('admin.filters.typeIcon'),
                  render: (task) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TaskTypeIcon type={task.type} thumbnailUrl={task.thumbnail_url} />
                      <span>{task.type}</span>
                    </div>
                  ),
                },
                {
                  key: 'location',
                  label: t('admin.taskManage.table.location'),
                  render: (task) => (
                    <div className="redaktion-table-secondary">
                      <span className="redaktion-table-title">
                        {task.location?.name || '—'}
                      </span>
                      {task.location?.is_online ? (
                        <span className="redaktion-table-subtitle">{t('common.online')}</span>
                      ) : task.location?.address ? (
                        <span className="redaktion-table-subtitle">{task.location.address}</span>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'points',
                  label: t('admin.taskManage.table.points'),
                  render: (task) => task.points,
                },
                {
                  key: 'status',
                  label: t('admin.taskManage.table.status'),
                  render: (task) => (
                    <span
                      className={`redaktion-status-badge ${
                        task.active ? 'active' : 'inactive'
                      }`}
                    >
                      {task.active ? t('common.status.active') : t('common.status.inactive')}
                    </span>
                  ),
                },
              ];

              return (
                <ManagementTable
                  items={filteredTasks}
                  columns={taskColumns}
                  cssPrefix="redaktion"
                  selectedIds={taskSelection.selectedIds}
                  onSelectAll={(checked) =>
                    checked ? taskSelection.selectAll() : taskSelection.deselectAll()
                  }
                  onSelectItem={(id, checked) => taskSelection.toggle(id, checked)}
                  allSelected={taskSelection.allSelected}
                  emptyMessage={t('admin.taskManage.noTasks')}
                  actionsColumn={{
                    render: (task) => (
                      <>
                        <button
                          className="redaktion-action-button"
                          type="button"
                          onClick={() => handleTaskEdit(task.id)}
                        >
                          {t('common.actions.edit')}
                        </button>
                        {task.type === 'qr' && (
                          <button
                            className="redaktion-action-button"
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await api.getTaskQrCode(task.id);
                                // Open QR code in new modal (similar to AdminPage)
                                // For now, show in alert - can be improved with modal later
                                alert(`${t('admin.task.qrCodeLabel')}\n${response.qrCode}`);
                              } catch (error: any) {
                                alert(error?.response?.data?.error || t('admin.task.qrCodeErrorMessage'));
                              }
                            }}
                          >
                            {t('admin.task.showQrCode')}
                          </button>
                        )}
                        <button
                          className="redaktion-action-button"
                          type="button"
                          onClick={() => handleTaskStatusChange(task.id, !task.active)}
                        >
                          {task.active ? t('admin.taskManage.deactivate') : t('admin.taskManage.activate')}
                        </button>
                        <button
                          className="redaktion-action-button danger"
                          type="button"
                          onClick={() => handleTaskDelete(task.id)}
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
        </section>
      )}

      {mode === 'rewardManage' && (
        <section className="redaktion-section">
          <ManagementHeader
            title={t('redaktion.actions.manageRewards.title')}
            subtitle={t('redaktion.rewardManage.subtitle')}
            cssPrefix="redaktion"
            onBack={() => setMode(null)}
            onRefresh={() => refetchRewardTemplates()}
            showBack={true}
            showRefresh={true}
          />

          {rewardTemplatesLoading && <p>{t('admin.rewardManage.loading')}</p>}
          {Boolean(rewardTemplatesError) && (
            <p className="redaktion-error">{t('admin.rewardManage.loadError')}</p>
          )}

          <ManagementCard
            cssPrefix="redaktion"
            title={t('admin.rewardManage.existing.title')}
            subtitle={t('admin.rewardManage.existing.subtitle')}
            message={rewardBulkOperations.message}
            topControls={
              <label className="redaktion-toggle">
                <input
                  type="checkbox"
                  className="redaktion-checkbox"
                  checked={includeInactiveRewards}
                  onChange={(event) => {
                    setIncludeInactiveRewards(event.target.checked);
                    rewardSelection.deselectAll();
                  }}
                />
                <span>{t('admin.taskManage.showInactive')}</span>
              </label>
            }
          >
            <BulkActionsBar
              cssPrefix="redaktion"
              hasSelection={rewardSelection.hasSelection}
              selectionCount={rewardSelection.selectedIds.length}
              onActivate={() => handleRewardBulkStatus(true)}
              onDeactivate={() => handleRewardBulkStatus(false)}
              onDelete={handleRewardBulkDelete}
              activateLabel={t('admin.rewardManage.activate')}
              deactivateLabel={t('admin.rewardManage.deactivate')}
              deleteLabel={t('common.actions.delete')}
              selectionCountLabel={(count) => t('admin.rewardManage.selectedCount', { count })}
              noSelectionLabel={t('admin.rewardManage.noSelection')}
            />
            {(() => {
              const rewardColumns: TableColumn<any>[] = [
                {
                  key: 'title',
                  label: t('admin.rewardManage.table.title'),
                  render: (reward) => (
                    <div className="redaktion-table-primary">
                      <span className="redaktion-table-title">
                        {reward.title || t('admin.reward.untitled')}
                      </span>
                      {reward.description && (
                        <span className="redaktion-table-subtitle">{reward.description}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'type',
                  label: t('admin.filters.typeIcon'),
                  render: (reward) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RewardTypeIcon type={reward.reward_type as RewardType} thumbnailUrl={reward.thumbnail_url} />
                      <span>{reward.reward_type}</span>
                    </div>
                  ),
                },
                {
                  key: 'location',
                  label: t('admin.rewardManage.table.location'),
                  render: (reward) => (
                    <div className="redaktion-table-secondary">
                      <span className="redaktion-table-title">
                        {reward.location?.name || '—'}
                      </span>
                      {reward.location?.is_online ? (
                        <span className="redaktion-table-subtitle">{t('common.online')}</span>
                      ) : reward.location?.address ? (
                        <span className="redaktion-table-subtitle">{reward.location.address}</span>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'cost',
                  label: t('admin.rewardManage.table.cost'),
                  render: (reward) => {
                    const cost = reward.points_cost !== undefined && reward.points_cost !== null
                      ? Number(reward.points_cost)
                      : 0;
                    return <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{cost}</span>;
                  },
                },
                {
                  key: 'status',
                  label: t('admin.rewardManage.table.status'),
                  render: (reward) => (
                    <span
                      className={`redaktion-status-badge ${
                        reward.active ? 'active' : 'inactive'
                      }`}
                    >
                      {reward.active ? t('common.status.active') : t('common.status.inactive')}
                    </span>
                  ),
                },
              ];

              return (
                <ManagementTable
                  items={filteredRewards}
                  columns={rewardColumns}
                  cssPrefix="redaktion"
                  selectedIds={rewardSelection.selectedIds}
                  onSelectAll={(checked) =>
                    checked ? rewardSelection.selectAll() : rewardSelection.deselectAll()
                  }
                  onSelectItem={(id, checked) => rewardSelection.toggle(id, checked)}
                  allSelected={rewardSelection.allSelected}
                  emptyMessage={t('admin.rewardManage.noRewards')}
                  actionsColumn={{
                    render: (reward) => (
                      <>
                        <button
                          className="redaktion-action-button"
                          type="button"
                          onClick={() => handleRewardEdit(reward.id)}
                        >
                          {t('common.actions.edit')}
                        </button>
                        <button
                          className="redaktion-action-button"
                          type="button"
                          onClick={() => handleRewardStatusChange(reward.id, !reward.active)}
                        >
                          {reward.active ? t('admin.rewardManage.deactivate') : t('admin.rewardManage.activate')}
                        </button>
                        <button
                          className="redaktion-action-button danger"
                          type="button"
                          onClick={() => handleRewardDelete(reward.id)}
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
        </section>
      )}
    </div>
  );
}

export default RedaktionPage;
