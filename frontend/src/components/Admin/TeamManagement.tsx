import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TeamCreator } from '../Teams/TeamCreator';
import { UserSelectionModal } from './UserSelectionModal';
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
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
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
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:68',message:'getAllTeams called',data:{includeInactive:includeInactiveTeams,enabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return api.getAllTeams({ includeInactive: includeInactiveTeams }).then((data) => {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:72',message:'getAllTeams success',data:{teamsCount:data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return data;
      }).catch((error) => {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:76',message:'getAllTeams error',data:{error:error?.message,status:error?.response?.status,responseData:error?.response?.data,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
          message: t('rezeption.team.manage.toggleSuccess', 'Team-Status erfolgreich geändert'),
        });
        setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.manage.toggleError', 'Fehler beim Ändern des Team-Status'),
        });
      },
    }
  );

  // Team delete mutation
  const deleteTeamMutation = useMutation(
    (teamId: string) => api.dissolveTeam(teamId),
    {
      onSuccess: async (response, teamId) => {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:235',message:'deleteTeamMutation onSuccess called',data:{teamId,response,includeInactiveTeams,queryKey:['adminTeams',includeInactiveTeams]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:237',message:'before invalidateQueries',data:{queryKey:['adminTeams'],allQueryKeys:queryClient.getQueryCache().getAll().map(q=>q.queryKey),currentTeams:adminTeams?.map(t=>t.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Update cache directly by removing the deleted team
        queryClient.setQueriesData(['adminTeams'], (oldData: any[] | undefined) => {
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:241',message:'setQueriesData callback',data:{oldDataLength:oldData?.length,teamIdToRemove:teamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          if (!oldData) return oldData;
          const filtered = oldData.filter((team) => team.id !== teamId);
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:245',message:'setQueriesData filtered',data:{oldLength:oldData.length,newLength:filtered.length,removedTeamId:teamId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          return filtered;
        });
        // Invalidate and refetch to ensure consistency
        await queryClient.invalidateQueries(['adminTeams'], { exact: false });
        await refetchTeams();
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:252',message:'after refetchTeams',data:{teamsListLength:teamsList.length,adminTeamsLength:adminTeams?.length,filteredTeamsLength:filteredTeams.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        showToast({
          type: 'success',
          message: t('rezeption.team.manage.deleteSuccess', 'Team erfolgreich gelöscht'),
        });
        setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' });
      },
      onError: (error: any, teamId) => {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:252',message:'deleteTeamMutation onError',data:{teamId,error:error?.message,status:error?.response?.status,responseData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.team.manage.deleteError', 'Fehler beim Löschen des Teams'),
        });
      },
    }
  );

  // Bulk operations
  const toggleTeamSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) => {
      if (checked) {
        return [...prev, teamId];
      } else {
        return prev.filter((id) => id !== teamId);
      }
    });
  };

  const handleTeamBulkStatus = async (active: boolean) => {
    if (!selectedTeamIds.length) return;
    try {
      setTeamManagementMessage(null);
      await api.bulkUpdateTeamsStatus(selectedTeamIds, active);
      setTeamManagementMessage({
        type: 'success',
        text: active 
          ? t('rezeption.team.manage.bulkActivateSuccess', 'Ausgewählte Teams wurden aktiviert')
          : t('rezeption.team.manage.bulkDeactivateSuccess', 'Ausgewählte Teams wurden deaktiviert'),
      });
      setSelectedTeamIds([]);
      await refetchTeams();
    } catch (error: any) {
      setTeamManagementMessage({
        type: 'error',
        text: error?.response?.data?.error || t('rezeption.team.manage.bulkStatusError', 'Fehler beim Ändern des Status'),
      });
    }
  };

  const handleTeamBulkDelete = async () => {
    if (!selectedTeamIds.length) return;
    setTeamConfirmDialog({
      visible: true,
      teamId: null,
      action: 'delete',
      teamName: `${selectedTeamIds.length} ${t('rezeption.team.manage.teams', 'Teams')}`,
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TeamManagement.tsx:264',message:'TeamManagement render',data:{cssPrefix,enabled,teamsListLength:teamsList.length,adminTeamsLength:adminTeams?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }, [cssPrefix, enabled, teamsList.length, adminTeams?.length]);
  // #endregion

  return (
    <section className={`${cssPrefix}-section`}>
      <header className={`${cssPrefix}-section-header`}>
        <div>
          <h2>{t('rezeption.team.manage.title', 'Teams verwalten')}</h2>
          <p>{t('rezeption.team.manage.subtitle', 'Verwalten Sie alle Teams')}</p>
        </div>
        <div className={`${cssPrefix}-actions`}>
          {!editingTeamId && !isCreatingTeam && (
            <>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={() => setIsCreatingTeam(true)}
                type="button"
              >
                {t('rezeption.team.manage.createNew', 'Neues Team erstellen')}
              </button>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => refetchTeams()}
                title={t('rezeption.team.manage.refresh', 'Aktualisieren')}
              >
                <Icon name="refresh" />
                <span className="sr-only">{t('rezeption.team.manage.refresh', 'Aktualisieren')}</span>
              </button>
            </>
          )}
          <button
            className={`${cssPrefix}-icon-button`}
            onClick={handleBack}
            title={t('common.actions.back', 'Zurück')}
          >
            <Icon name="back" />
            <span className="sr-only">{t('common.actions.back', 'Zurück')}</span>
          </button>
        </div>
      </header>

      {teamsLoading && <p>{t('rezeption.team.manage.loading', 'Lade Teams...')}</p>}
      {Boolean(teamsError) && <p className={`${cssPrefix}-error`}>{t('rezeption.team.manage.loadError', 'Fehler beim Laden der Teams')}</p>}

      {teamManagementMessage && (
        <div className={`${cssPrefix}-message ${cssPrefix}-message-${teamManagementMessage.type}`}>
          {teamManagementMessage.text}
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
                text: t('rezeption.team.manage.createSuccess', 'Team erfolgreich erstellt'),
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
              <h3>{t('rezeption.team.manage.edit.title', 'Team bearbeiten')}</h3>
              <div className={`${cssPrefix}-field`}>
                <label>
                  {t('rezeption.team.manage.edit.name', 'Team-Name')}
                  <input
                    type="text"
                    value={editingTeam.name || ''}
                    onChange={async (e) => {
                      try {
                        await api.updateTeam(editingTeamId, { name: e.target.value || null });
                        await refetchTeams();
                        setTeamManagementMessage({
                          type: 'success',
                          text: t('rezeption.team.manage.edit.nameUpdated', 'Team-Name aktualisiert'),
                        });
                      } catch (err: any) {
                        setTeamManagementMessage({
                          type: 'error',
                          text: err?.response?.data?.error || err?.message || t('rezeption.team.manage.edit.nameUpdateError', 'Fehler beim Aktualisieren'),
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
                  {t('rezeption.team.manage.edit.addMembers', 'Mitglieder hinzufügen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setShowTeamRemoveUsersModal(true)}
                >
                  {t('rezeption.team.manage.edit.removeMembers', 'Mitglieder entfernen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => generateTeamJoinQrMutation.mutate(editingTeamId)}
                >
                  {t('rezeption.team.manage.edit.showJoinQr', 'Join-QR-Code anzeigen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => generateTeamRegistrationQrMutation.mutate(editingTeamId)}
                >
                  {t('rezeption.team.manage.edit.showRegistrationQr', 'Registrierungs-QR-Code anzeigen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setEditingTeamId(null)}
                >
                  {t('common.actions.back', 'Fertig')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {!editingTeamId && !isCreatingTeam && (
        <>
          <div className={`${cssPrefix}-filters`}>
            <div className={`${cssPrefix}-filter-group`}>
              <label>
                {t('rezeption.team.manage.filters.status', 'Status')}
                <select
                  value={teamFilterStatus || ''}
                  onChange={(e) => setTeamFilterStatus(e.target.value as 'active' | 'inactive' | null || null)}
                >
                  <option value="">{t('common.all', 'Alle')}</option>
                  <option value="active">{t('common.status.active', 'Aktiv')}</option>
                  <option value="inactive">{t('common.status.inactive', 'Inaktiv')}</option>
                </select>
              </label>
              <label>
                {t('rezeption.team.manage.filters.name', 'Name')}
                <input
                  type="text"
                  value={teamFilterName}
                  onChange={(e) => setTeamFilterName(e.target.value)}
                  placeholder={t('rezeption.team.manage.filters.namePlaceholder', 'Nach Name suchen...')}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                <input
                  type="checkbox"
                  checked={includeInactiveTeams}
                  onChange={(e) => setIncludeInactiveTeams(e.target.checked)}
                />
                {t('rezeption.team.manage.filters.includeInactive', 'Inaktive anzeigen')}
              </label>
            </div>
          </div>

          {/* Bulk action buttons */}
          <div className={`${cssPrefix}-management-actions`}>
            <span className={`${cssPrefix}-selection-count`}>
              {selectedTeamIds.length > 0
                ? t('rezeption.team.manage.selectedCount', '{{count}} ausgewählt', { count: selectedTeamIds.length })
                : t('rezeption.team.manage.noSelection', 'Keine Auswahl')}
            </span>
            <div className={`${cssPrefix}-bulk-buttons`}>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={() => handleTeamBulkStatus(true)}
                disabled={selectedTeamIds.length === 0}
                type="button"
              >
                {t('rezeption.team.manage.activate', 'Aktivieren')}
              </button>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={() => handleTeamBulkStatus(false)}
                disabled={selectedTeamIds.length === 0}
                type="button"
              >
                {t('rezeption.team.manage.deactivate', 'Deaktivieren')}
              </button>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={handleTeamBulkDelete}
                disabled={selectedTeamIds.length === 0}
                type="button"
              >
                {t('common.actions.delete', 'Löschen')}
              </button>
            </div>
          </div>

          {/* Teams table */}
          <div className={`${cssPrefix}-table-wrapper`}>
            <table className={`${cssPrefix}-table`}>
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}>
                    <input
                      type="checkbox"
                      className={`${cssPrefix}-checkbox`}
                      checked={filteredTeams.length > 0 && selectedTeamIds.length === filteredTeams.length}
                      disabled={filteredTeams.length === 0}
                      onChange={(event) =>
                        setSelectedTeamIds(
                          event.target.checked
                            ? filteredTeams.map((team) => team.id)
                            : []
                        )
                      }
                      aria-label={t('rezeption.team.manage.selectAll', 'Alle auswählen')}
                    />
                  </th>
                  <th>{t('rezeption.team.manage.name', 'Name')}</th>
                  <th>{t('rezeption.team.manage.createdBy', 'Erstellt von')}</th>
                  <th>{t('rezeption.team.manage.status', 'Status')}</th>
                  <th>{t('common.actions.title', 'Aktionen')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`${cssPrefix}-table-empty`}>
                      {t('rezeption.team.manage.noTeams', 'Keine Teams gefunden')}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    return (
                      <tr key={team.id}>
                        <td>
                          <input
                            type="checkbox"
                            className={`${cssPrefix}-checkbox`}
                            checked={isSelected}
                            onChange={(event) =>
                              toggleTeamSelection(team.id, event.target.checked)
                            }
                            aria-label={`${t('rezeption.team.manage.selectTeam', 'Team auswählen')} ${team.name || t('rezeption.team.manage.unnamed', 'Unbenanntes Team')}`}
                          />
                        </td>
                        <td data-label={t('rezeption.team.manage.name', 'Name')}>
                          <div className={`${cssPrefix}-table-primary`}>
                            <span className={`${cssPrefix}-table-title`}>
                              {team.name || t('rezeption.team.manage.unnamed', 'Unbenanntes Team')}
                            </span>
                          </div>
                        </td>
                        <td data-label={t('rezeption.team.manage.createdBy', 'Erstellt von')}>
                          {team.creator_name || 'Unknown'}
                        </td>
                        <td data-label={t('rezeption.team.manage.status', 'Status')}>
                          <span className={`${cssPrefix}-status-badge ${team.active ? 'active' : 'inactive'}`}>
                            {team.active ? t('common.status.active', 'Aktiv') : t('common.status.inactive', 'Inaktiv')}
                          </span>
                        </td>
                        <td data-label={t('common.actions.title', 'Aktionen')}>
                          <div className={`${cssPrefix}-bulk-buttons`}>
                            <button
                              className={`${cssPrefix}-action-button`}
                              onClick={() => setEditingTeamId(team.id)}
                              type="button"
                            >
                              {t('common.actions.edit', 'Bearbeiten')}
                            </button>
                            <button
                              className={`${cssPrefix}-action-button`}
                              onClick={() => {
                                setTeamConfirmDialog({
                                  visible: true,
                                  teamId: team.id,
                                  action: 'toggleActive',
                                  teamName: team.name || t('rezeption.team.manage.unnamed', 'Unbenanntes Team'),
                                });
                              }}
                              type="button"
                            >
                              {team.active
                                ? t('rezeption.team.manage.deactivate', 'Deaktivieren')
                                : t('rezeption.team.manage.activate', 'Aktivieren')}
                            </button>
                            <button
                              className={`${cssPrefix}-action-button`}
                              onClick={() => {
                                setTeamConfirmDialog({
                                  visible: true,
                                  teamId: team.id,
                                  action: 'delete',
                                  teamName: team.name || t('rezeption.team.manage.unnamed', 'Unbenanntes Team'),
                                });
                              }}
                              type="button"
                            >
                              {t('common.actions.delete', 'Löschen')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
          title={t('rezeption.team.manage.edit.addMembers', 'Mitglieder hinzufügen')}
          addButtonLabel={t('rezeption.team.manage.edit.add', 'Hinzufügen')}
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
          title={t('rezeption.team.manage.edit.removeMembers', 'Mitglieder entfernen')}
          addButtonLabel={t('rezeption.team.manage.edit.remove', 'Entfernen')}
        />
      )}

      {/* Team Join QR Modal */}
      {showTeamJoinQrModal && teamJoinQrToken && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setShowTeamJoinQrModal(false)}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>{t('rezeption.team.manage.edit.joinQrTitle', 'Join-QR-Code')}</h3>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => setShowTeamJoinQrModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <QRCode value={teamJoinQrToken} size={256} />
              <p>{t('rezeption.team.manage.edit.joinQrDescription', 'Bestehende Benutzer können diesen QR-Code scannen, um dem Team beizutreten')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Registration QR Modal */}
      {showTeamRegistrationQrModal && teamRegistrationQrData && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setShowTeamRegistrationQrModal(false)}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>{t('rezeption.team.manage.edit.registrationQrTitle', 'Registrierungs-QR-Code')}</h3>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => setShowTeamRegistrationQrModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <QRCode value={teamRegistrationQrData.url} size={256} />
              <p>{t('rezeption.team.manage.edit.registrationQrDescription', 'Neue Benutzer können diesen QR-Code scannen, um sich zu registrieren und automatisch dem Team beizutreten')}</p>
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
                  ? t('rezeption.team.manage.deleteConfirm.title', 'Team löschen')
                  : t('rezeption.team.manage.toggleConfirm.title', 'Team-Status ändern')}
              </h3>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <p>
                {teamConfirmDialog.action === 'delete'
                  ? t('rezeption.team.manage.deleteConfirm.description', 'Möchten Sie das Team "{{name}}" wirklich löschen?', { name: teamConfirmDialog.teamName })
                  : t('rezeption.team.manage.toggleConfirm.description', 'Möchten Sie den Status des Teams "{{name}}" wirklich ändern?', { name: teamConfirmDialog.teamName })}
              </p>
            </div>
            <div className={`${cssPrefix}-modal-footer`}>
              <button
                className={`${cssPrefix}-button`}
                onClick={() => setTeamConfirmDialog({ visible: false, teamId: null, action: null, teamName: '' })}
              >
                {t('common.actions.cancel', 'Abbrechen')}
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
                      try {
                        setTeamManagementMessage(null);
                        await api.bulkDeleteTeams(selectedTeamIds);
                        setTeamManagementMessage({
                          type: 'success',
                          text: t('rezeption.team.manage.bulkDeleteSuccess', 'Ausgewählte Teams wurden gelöscht'),
                        });
                        setSelectedTeamIds([]);
                        await refetchTeams();
                      } catch (error: any) {
                        setTeamManagementMessage({
                          type: 'error',
                          text: error?.response?.data?.error || t('rezeption.team.manage.bulkDeleteError', 'Fehler beim Löschen der Teams'),
                        });
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
                  ? t('common.actions.delete', 'Löschen')
                  : t('common.actions.save', 'Bestätigen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
