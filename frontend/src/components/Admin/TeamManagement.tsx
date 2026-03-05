import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TeamCreator } from '../Teams/TeamCreator';
import { UserSelectionModal } from './UserSelectionModal';
import { useSelection } from '../../hooks/useSelection';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { ManagementHeader } from '../Management/ManagementHeader';
import { ManagementCard } from '../Management/ManagementCard';
import { BulkActionsBar } from '../Management/BulkActionsBar';
import { ManagementTable, type TableColumn } from '../Management/ManagementTable';
import QRCode from 'qrcode.react';

type TeamManagementProps = {
  cssPrefix?: string; // 'rezeption' or 'admin'
  onBack?: () => void;
  enabled?: boolean;
};

// Icon component helper
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    back: '←',
    refresh: '↻',
    close: '×',
  };
  return <span>{icons[name] || name}</span>;
};

export function TeamManagement({ cssPrefix = 'rezeption', onBack, enabled = true }: TeamManagementProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();

  // Team management state
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [includeInactiveTeams, setIncludeInactiveTeams] = useState(false);
  const [teamFilterStatus, setTeamFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [teamFilterName, setTeamFilterName] = useState('');
  const [teamFilterCreator, setTeamFilterCreator] = useState<string | null>(null);
  const [teamManagementMessage, setTeamManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [showTeamAddUsersModal, setShowTeamAddUsersModal] = useState(false);
  const [showTeamRemoveUsersModal, setShowTeamRemoveUsersModal] = useState(false);
  const [showTeamJoinQrModal, setShowTeamJoinQrModal] = useState(false);
  const [showTeamRegistrationQrModal, setShowTeamRegistrationQrModal] = useState(false);
  const [teamJoinQrToken, setTeamJoinQrToken] = useState<string | null>(null);
  const [teamRegistrationQrData, setTeamRegistrationQrData] = useState<{ token: string; url: string } | null>(null);
  const [teamConfirmDialog, setTeamConfirmDialog] = useState<{
    visible: boolean;
    teamId: string | null;
    action: 'delete' | 'toggleActive' | null;
    teamName: string;
  }>({
    visible: false,
    teamId: null,
    action: null,
    teamName: '',
  });

  // Teams query
  const {
    data: adminTeams,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery<any[]>(
    ['adminTeams', includeInactiveTeams],
    () => {
      return api.getAllTeams({ includeInactive: includeInactiveTeams }).then((data) => {
        return data;
      }).catch((error) => {
        throw error;
      });
    },
    {
      enabled,
    }
  );

  // Team members query
  const {
    data: teamMembersData,
    isLoading: teamMembersLoading,
    refetch: refetchTeamMembers,
  } = useQuery<any[]>(
    ['teamMembers', editingTeamId],
    () => api.getTeamMembers(editingTeamId!),
    {
      enabled: !!editingTeamId,
    }
  );

  // Teams filter logic
  const teamsList = adminTeams ?? [];
  const filteredTeams = useMemo(() => {
    let filtered = teamsList;
    
    if (teamFilterStatus) {
      filtered = filtered.filter((team) => 
        teamFilterStatus === 'active' ? team.active : !team.active
      );
    }
    
    if (teamFilterName.trim()) {
      const searchTerm = teamFilterName.toLowerCase().trim();
      filtered = filtered.filter((team) => 
        team.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (teamFilterCreator) {
      filtered = filtered.filter((team) => 
        team.creator_name === teamFilterCreator
      );
    }
    
    filtered.sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    
    return filtered;
  }, [teamsList, teamFilterStatus, teamFilterName, teamFilterCreator]);

  // Use selection hook for teams
  const teamSelection = useSelection(filteredTeams);
  const allTeamsSelected = teamSelection.allSelected;
  const hasTeamSelection = teamSelection.hasSelection;

  // Use bulk operations hook for teams
  const teamBulkOperations = useBulkOperations(teamSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateTeamsStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      // Handle bulk delete through confirm dialog
      setTeamConfirmDialog({
        visible: true,
        teamId: null,
        action: 'delete',
        teamName: `${ids.length} ${t('rezeption.team.manage.teams')}`,
      });
      // Store IDs for bulk delete
      (teamConfirmDialog as any).bulkIds = ids;
    },
    refetch: async () => {
      await refetchTeams();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('rezeption.team.manage.bulkActivateSuccess');
      if (action === 'deactivate') return t('rezeption.team.manage.bulkDeactivateSuccess');
      return t('rezeption.team.manage.bulkDeleteSuccess');
    },
    getErrorMessage: (action, error) => {
      if (action === 'delete') return error?.response?.data?.error || t('rezeption.team.manage.bulkDeleteError');
      return error?.response?.data?.error || t('rezeption.team.manage.bulkStatusError');
    },
  });

  // Measure table column widths after render
  useEffect(() => {
  }, [filteredTeams.length, cssPrefix]);

  // Team QR code generation
  const generateTeamJoinQrMutation = useMutation(
    (teamId: string) => api.getTeamQrCode(teamId),
    {
      onSuccess: (data) => {
        setTeamJoinQrToken(data.qrToken);
        setShowTeamJoinQrModal(true);
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.qrError'),
        });
      },
    }
  );

  const generateTeamRegistrationQrMutation = useMutation(
    (teamId: string) => api.getTeamRegistrationQrCode(teamId),
    {
      onSuccess: (data) => {
        setTeamRegistrationQrData({ token: data.token, url: data.registrationUrl });
        setShowTeamRegistrationQrModal(true);
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.registrationQrError'),
        });
      },
    }
  );

  // Team member management
  const addTeamMembersMutation = useMutation(
    ({ teamId, userIds }: { teamId: string; userIds: string[] }) => api.addTeamMembers(teamId, userIds),
    {
      onSuccess: async () => {
        await refetchTeamMembers();
        await refetchTeams();
        setShowTeamAddUsersModal(false);
        showToast({
          type: 'success',
          message: t('rezeption.team.membersAdded'),
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.addMembersError'),
        });
      },
    }
  );

  const removeTeamMembersMutation = useMutation(
    ({ teamId, userIds }: { teamId: string; userIds: string[] }) => api.removeTeamMembers(teamId, userIds),
    {
      onSuccess: async () => {
        await refetchTeamMembers();
        await refetchTeams();
        setShowTeamRemoveUsersModal(false);
        showToast({
          type: 'success',
          message: t('rezeption.team.membersRemoved'),
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.removeMembersError'),
        });
      },
    }
  );

  // Get team members for remove modal
  const { data: teamMembersForRemove } = useQuery<any[]>(
    ['teamMembersAdmin', editingTeamId],
    () => api.getTeamMembers(editingTeamId!),
    {
      enabled: !!editingTeamId && showTeamRemoveUsersModal,
    }
  );

  // Team toggle active mutation
  const toggleTeamActiveMutation = useMutation(
    ({ teamId, active }: { teamId: string; active: boolean }) => api.updateTeam(teamId, { active }),
    {
      onSuccess: async () => {
        // Invalidate and refetch teams queries
        await queryClient.invalidateQueries(['adminTeams']);
        await refetchTeams();
        showToast({
          type: 'success',
          message: t('rezeption.team.manage.toggleSuccess'),
        });
        setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.manage.toggleError'),
        });
      },
    }
  );

  // Team delete mutation
  const deleteTeamMutation = useMutation(
    (teamId: string) => api.dissolveTeam(teamId),
    {
      onSuccess: async (response, teamId) => {
        // Update cache directly by removing the deleted team
        queryClient.setQueriesData(['adminTeams'], (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          const filtered = oldData.filter((team) => team.id !== teamId);
          return filtered;
        });
        // Invalidate and refetch to ensure consistency
        await queryClient.invalidateQueries(['adminTeams'], { exact: false });
        await refetchTeams();
        showToast({
          type: 'success',
          message: t('rezeption.team.manage.deleteSuccess'),
        });
        setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' });
      },
      onError: (error: any, teamId) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.manage.deleteError'),
        });
      },
    }
  );

  // Bulk operations handlers
  const handleTeamBulkStatus = async (active: boolean) => {
    await teamBulkOperations.handleBulkStatus(active);
    teamSelection.deselectAll();
  };

  // Store bulk IDs for delete confirmation
  const bulkDeleteIdsRef = useRef<string[]>([]);

  const handleTeamBulkDelete = async () => {
    if (!teamSelection.selectedIds.length) return;
    bulkDeleteIdsRef.current = teamSelection.selectedIds;
    setTeamConfirmDialog({
      visible: true,
      teamId: null,
      action: 'delete',
      teamName: `${teamSelection.selectedIds.length} ${t('rezeption.team.manage.teams')}`,
    });
  };

  const handleBack = () => {
    if (editingTeamId) {
      setEditingTeamId(null);
    } else if (isCreatingTeam) {
      setIsCreatingTeam(false);
    } else if (onBack) {
      onBack();
    }
  };


  return (
    <section className={`${cssPrefix}-section`}>
      <ManagementHeader
        title={t('rezeption.team.manage.title')}
        subtitle={t('rezeption.team.manage.subtitle')}
        cssPrefix={cssPrefix}
        onBack={handleBack}
        onRefresh={() => refetchTeams()}
        showBack={true}
        showRefresh={!editingTeamId && !isCreatingTeam}
        isEditing={!!editingTeamId}
        onCancelEdit={() => setEditingTeamId(null)}
      />
      {!editingTeamId && !isCreatingTeam && (
        <button
          className={`${cssPrefix}-action-button`}
          onClick={() => setIsCreatingTeam(true)}
          type="button"
          style={{ marginBottom: '1rem' }}
        >
          {t('rezeption.team.manage.createNew')}
        </button>
      )}

      {teamsLoading && <p>{t('rezeption.team.manage.loading')}</p>}
      {Boolean(teamsError) && <p className={`${cssPrefix}-error`}>{t('rezeption.team.manage.loadError')}</p>}

      {(teamBulkOperations.message || teamManagementMessage) && (
        <div className={`${cssPrefix}-message ${cssPrefix}-message-${(teamBulkOperations.message || teamManagementMessage)?.type}`}>
          {(teamBulkOperations.message || teamManagementMessage)?.text}
        </div>
      )}

      {isCreatingTeam && (
        <div className={`${cssPrefix}-form-card`}>
          <TeamCreator
            onSuccess={async (teamId) => {
              setIsCreatingTeam(false);
              await refetchTeams();
              setTeamManagementMessage({
                type: 'success',
                text: t('rezeption.team.manage.createSuccess'),
              });
            }}
            onClose={() => setIsCreatingTeam(false)}
          />
        </div>
      )}

      {editingTeamId && (() => {
        const editingTeam = teamsList.find((t) => t.id === editingTeamId);
        if (!editingTeam) {
          setEditingTeamId(null);
          return null;
        }
        return (
          <div className={`${cssPrefix}-form-card`}>
            <div className={`${cssPrefix}-form-section`}>
              <h3>{t('rezeption.team.manage.edit.title')}</h3>
              <div className={`${cssPrefix}-field`}>
                <label>
                  {t('rezeption.team.manage.edit.name')}
                  <input
                    type="text"
                    value={editingTeam.name || ''}
                    onChange={async (e) => {
                      try {
                        await api.updateTeam(editingTeamId, { name: e.target.value || null });
                        await refetchTeams();
                        setTeamManagementMessage({
                          type: 'success',
                          text: t('rezeption.team.manage.edit.nameUpdated'),
                        });
                      } catch (err: any) {
                        setTeamManagementMessage({
                          type: 'error',
                          text: err?.response?.data?.error || err?.message || t('rezeption.team.manage.edit.nameUpdateError'),
                        });
                      }
                    }}
                  />
                </label>
              </div>
              <div className={`${cssPrefix}-form-actions`}>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setShowTeamAddUsersModal(true)}
                >
                  {t('rezeption.team.manage.edit.addMembers')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setShowTeamRemoveUsersModal(true)}
                >
                  {t('rezeption.team.manage.edit.removeMembers')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => generateTeamJoinQrMutation.mutate(editingTeamId)}
                >
                  {t('rezeption.team.manage.edit.showJoinQr')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => generateTeamRegistrationQrMutation.mutate(editingTeamId)}
                >
                  {t('rezeption.team.manage.edit.showRegistrationQr')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setEditingTeamId(null)}
                >
                  {t('common.actions.back')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {!editingTeamId && !isCreatingTeam && (
        <>
          <ManagementCard
            cssPrefix={cssPrefix}
            title={t('rezeption.team.manage.existingTitle')}
            subtitle={t('rezeption.team.manage.existingSubtitle')}
            message={teamBulkOperations.message || teamManagementMessage}
            topControls={
              <>
                <div className={`${cssPrefix}-filters`}>
                  <div className={`${cssPrefix}-filter-group`}>
                    <label>
                      {t('rezeption.team.manage.filters.status')}
                      <select
                        value={teamFilterStatus || ''}
                        onChange={(e) => setTeamFilterStatus(e.target.value as 'active' | 'inactive' | null || null)}
                      >
                        <option value="">{t('common.all')}</option>
                        <option value="active">{t('common.status.active')}</option>
                        <option value="inactive">{t('common.status.inactive')}</option>
                      </select>
                    </label>
                    <label>
                      {t('rezeption.team.manage.filters.name')}
                      <input
                        type="text"
                        value={teamFilterName}
                        onChange={(e) => setTeamFilterName(e.target.value)}
                        placeholder={t('rezeption.team.manage.filters.namePlaceholder')}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                      <input
                        type="checkbox"
                        checked={includeInactiveTeams}
                        onChange={(e) => {
                          setIncludeInactiveTeams(e.target.checked);
                          teamSelection.deselectAll();
                        }}
                      />
                      {t('rezeption.team.manage.filters.includeInactive')}
                    </label>
                  </div>
                </div>
              </>
            }
          >
            <BulkActionsBar
              cssPrefix={cssPrefix}
              hasSelection={hasTeamSelection}
              selectionCount={teamSelection.selectedIds.length}
              onActivate={() => handleTeamBulkStatus(true)}
              onDeactivate={() => handleTeamBulkStatus(false)}
              onDelete={handleTeamBulkDelete}
              activateLabel={t('rezeption.team.manage.activate')}
              deactivateLabel={t('rezeption.team.manage.deactivate')}
              deleteLabel={t('common.actions.delete')}
              selectionCountLabel={(count) => t('rezeption.team.manage.selectedCount', { count })}
              noSelectionLabel={t('rezeption.team.manage.noSelection')}
            />

          {/* Teams table */}
          {(() => {
            const teamColumns: TableColumn<any>[] = [
              {
                key: 'name',
                label: t('rezeption.team.manage.name'),
                render: (team) => (
                  <div className={`${cssPrefix}-table-primary`}>
                    <span className={`${cssPrefix}-table-title`}>
                      {team.name || t('rezeption.team.manage.unnamed')}
                    </span>
                  </div>
                ),
              },
              {
                key: 'createdBy',
                label: t('rezeption.team.manage.createdBy'),
                render: (team) => team.creator_name || 'Unknown',
              },
              {
                key: 'status',
                label: t('rezeption.team.manage.status'),
                render: (team) => (
                  <span className={`${cssPrefix}-status-badge ${team.active ? 'active' : 'inactive'}`}>
                    {team.active ? t('common.status.active') : t('common.status.inactive')}
                  </span>
                ),
              },
            ];

            return (
              <ManagementTable
                items={filteredTeams}
                columns={teamColumns}
                cssPrefix={cssPrefix}
                selectedIds={teamSelection.selectedIds}
                onSelectAll={(checked) =>
                  checked ? teamSelection.selectAll() : teamSelection.deselectAll()
                }
                onSelectItem={(id, checked) => teamSelection.toggle(id, checked)}
                allSelected={allTeamsSelected}
                emptyMessage={t('rezeption.team.manage.noTeams')}
                actionsColumn={{
                  render: (team) => (
                    <>
                      <button
                        className={`${cssPrefix}-action-button`}
                        onClick={() => setEditingTeamId(team.id)}
                        type="button"
                      >
                        {t('common.actions.edit')}
                      </button>
                      <button
                        className={`${cssPrefix}-action-button`}
                        onClick={() => {
                          setTeamConfirmDialog({
                            visible: true,
                            teamId: team.id,
                            action: 'toggleActive',
                            teamName: team.name || t('rezeption.team.manage.unnamed'),
                          });
                        }}
                        type="button"
                      >
                        {team.active
                          ? t('rezeption.team.manage.deactivate')
                          : t('rezeption.team.manage.activate')}
                      </button>
                      <button
                        className={`${cssPrefix}-action-button`}
                        onClick={() => {
                          setTeamConfirmDialog({
                            visible: true,
                            teamId: team.id,
                            action: 'delete',
                            teamName: team.name || t('rezeption.team.manage.unnamed'),
                          });
                        }}
                        type="button"
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
        </>
      )}

      {/* Team Add Users Modal */}
      {showTeamAddUsersModal && editingTeamId && (
        <UserSelectionModal
          isOpen={showTeamAddUsersModal}
          onClose={() => setShowTeamAddUsersModal(false)}
          onAdd={(userIds) => {
            addTeamMembersMutation.mutate({ teamId: editingTeamId, userIds });
          }}
          excludeUserIds={teamMembersData?.map((m: any) => m.user_id) || []}
          title={t('rezeption.team.manage.edit.addMembers')}
          addButtonLabel={t('rezeption.team.manage.edit.add')}
        />
      )}

      {/* Team Remove Users Modal */}
      {showTeamRemoveUsersModal && editingTeamId && teamMembersForRemove && (
        <UserSelectionModal
          isOpen={showTeamRemoveUsersModal}
          onClose={() => setShowTeamRemoveUsersModal(false)}
          onAdd={(userIds) => {
            removeTeamMembersMutation.mutate({ teamId: editingTeamId, userIds });
          }}
          includeOnlyUserIds={teamMembersForRemove.map((m: any) => m.user_id)}
          title={t('rezeption.team.manage.edit.removeMembers')}
          addButtonLabel={t('rezeption.team.manage.edit.remove')}
        />
      )}

      {/* Team Join QR Modal */}
      {showTeamJoinQrModal && teamJoinQrToken && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setShowTeamJoinQrModal(false)}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>{t('rezeption.team.manage.edit.joinQrTitle')}</h3>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => setShowTeamJoinQrModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <QRCode value={teamJoinQrToken} size={256} />
              <p>{t('rezeption.team.manage.edit.joinQrDescription')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration QR Modal */}
      {showTeamRegistrationQrModal && teamRegistrationQrData && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setShowTeamRegistrationQrModal(false)}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>{t('rezeption.team.manage.edit.registrationQrTitle')}</h3>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => setShowTeamRegistrationQrModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <QRCode value={teamRegistrationQrData.url} size={256} />
              <p>{t('rezeption.team.manage.edit.registrationQrDescription')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Confirm Dialog */}
      {teamConfirmDialog.visible && (teamConfirmDialog.teamId || teamConfirmDialog.action === 'delete') && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' })}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>
                {teamConfirmDialog.action === 'delete'
                  ? t('rezeption.team.manage.deleteConfirm.title')
                  : t('rezeption.team.manage.toggleConfirm.title')}
              </h3>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <p>
                {teamConfirmDialog.action === 'delete'
                  ? t('rezeption.team.manage.deleteConfirm.description', { name: teamConfirmDialog.teamName })
                  : t('rezeption.team.manage.toggleConfirm.description', { name: teamConfirmDialog.teamName })}
              </p>
            </div>
            <div className={`${cssPrefix}-modal-footer`}>
              <button
                className={`${cssPrefix}-button`}
                onClick={() => setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' })}
              >
                {t('common.actions.cancel')}
              </button>
              <button
                className={`${cssPrefix}-button`}
                onClick={async () => {
                  if (teamConfirmDialog.action === 'delete') {
                    if (teamConfirmDialog.teamId) {
                      // Single team delete
                      deleteTeamMutation.mutate(teamConfirmDialog.teamId);
                    } else {
                      // Bulk delete
                      const bulkIds = bulkDeleteIdsRef.current;
                      if (bulkIds.length > 0) {
                        try {
                          await api.bulkDeleteTeams(bulkIds);
                          teamBulkOperations.setMessage({
                            type: 'success',
                            text: t('rezeption.team.manage.bulkDeleteSuccess'),
                          });
                          teamSelection.deselectAll();
                          bulkDeleteIdsRef.current = [];
                          await refetchTeams();
                        } catch (error: any) {
                          teamBulkOperations.setMessage({
                            type: 'error',
                            text: error?.response?.data?.error || t('rezeption.team.manage.bulkDeleteError'),
                          });
                        }
                      }
                    }
                    setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' });
                  } else if (teamConfirmDialog.action === 'toggleActive') {
                    const team = teamsList.find((t) => t.id === teamConfirmDialog.teamId);
                    if (team) {
                      toggleTeamActiveMutation.mutate({ teamId: teamConfirmDialog.teamId!, active: !team.active });
                    }
                    setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' });
                  }
                }}
              >
                {teamConfirmDialog.action === 'delete'
                  ? t('common.actions.delete')
                  : t('common.actions.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
