import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { ContestCreator } from '../Contests/ContestCreator';
import { UserSelectionModal } from './UserSelectionModal';
import QRCode from 'qrcode.react';

type ContestManagementProps = {
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

export function ContestManagement({ cssPrefix = 'rezeption', onBack, enabled = true }: ContestManagementProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLTableElement>(null);

  // Contest management state
  const [isCreatingContest, setIsCreatingContest] = useState(false);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [includeInactiveContests, setIncludeInactiveContests] = useState(false);
  const [contestFilterStatus, setContestFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [contestFilterName, setContestFilterName] = useState('');
  const [contestFilterCreator, setContestFilterCreator] = useState<string | null>(null);
  const [contestFilterEndDate, setContestFilterEndDate] = useState('');
  const [selectedContestIds, setSelectedContestIds] = useState<string[]>([]);
  const [contestManagementMessage, setContestManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [showContestAddUsersModal, setShowContestAddUsersModal] = useState(false);
  const [showContestRemoveUsersModal, setShowContestRemoveUsersModal] = useState(false);
  const [showContestJoinQrModal, setShowContestJoinQrModal] = useState(false);
  const [showContestRegistrationQrModal, setShowContestRegistrationQrModal] = useState(false);
  const [contestJoinQrToken, setContestJoinQrToken] = useState<string | null>(null);
  const [contestRegistrationQrData, setContestRegistrationQrData] = useState<{ token: string; url: string } | null>(null);
  const [contestConfirmDialog, setContestConfirmDialog] = useState<{
    visible: boolean;
    contestId: string | null;
    action: 'delete' | 'toggleActive' | null;
    contestName: string;
  }>({
    visible: false,
    contestId: null,
    action: null,
    contestName: '',
  });

  // Contests query
  const {
    data: adminContests,
    isLoading: contestsLoading,
    error: contestsError,
    refetch: refetchContests,
  } = useQuery<any[]>(
    ['adminContests', includeInactiveContests],
    () => api.getAllContests({ includeInactive: includeInactiveContests }),
    {
      enabled,
    }
  );

  // Contest participants query
  const {
    data: contestParticipantsData,
    isLoading: contestParticipantsLoading,
    refetch: refetchContestParticipants,
  } = useQuery<any[]>(
    ['contestParticipants', editingContestId],
    () => api.getContestParticipants(editingContestId!),
    {
      enabled: !!editingContestId,
    }
  );

  // Contests filter logic
  const contestsList = adminContests ?? [];
  const filteredContests = useMemo(() => {
    let filtered = contestsList;
    
    if (contestFilterStatus) {
      filtered = filtered.filter((contest) => 
        contestFilterStatus === 'active' ? contest.active : !contest.active
      );
    }
    
    if (contestFilterName.trim()) {
      const searchTerm = contestFilterName.toLowerCase().trim();
      filtered = filtered.filter((contest) => 
        contest.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (contestFilterCreator) {
      filtered = filtered.filter((contest) => 
        contest.creator_name === contestFilterCreator
      );
    }
    
    if (contestFilterEndDate.trim()) {
      const filterDate = new Date(contestFilterEndDate);
      filtered = filtered.filter((contest) => {
        const contestEndDate = new Date(contest.end_date);
        return contestEndDate.toDateString() === filterDate.toDateString();
      });
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
  }, [contestsList, contestFilterStatus, contestFilterName, contestFilterCreator, contestFilterEndDate]);

  // Measure table column widths after render
  useEffect(() => {
  }, [filteredContests.length, cssPrefix]);

  // Contest QR code generation
  const generateContestJoinQrMutation = useMutation(
    (contestId: string) => api.getContestQrCode(contestId),
    {
      onSuccess: (data) => {
        setContestJoinQrToken(data.qrToken);
        setShowContestJoinQrModal(true);
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.contest.qrError'),
        });
      },
    }
  );

  const generateContestRegistrationQrMutation = useMutation(
    (contestId: string) => api.getContestRegistrationQrCode(contestId),
    {
      onSuccess: (data) => {
        setContestRegistrationQrData({ token: data.token, url: data.registrationUrl });
        setShowContestRegistrationQrModal(true);
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.contest.registrationQrError'),
        });
      },
    }
  );

  // Contest participant management
  const addContestParticipantsMutation = useMutation(
    ({ contestId, userIds }: { contestId: string; userIds: string[] }) => api.addContestParticipants(contestId, userIds),
    {
      onSuccess: async () => {
        await refetchContestParticipants();
        await refetchContests();
        setShowContestAddUsersModal(false);
        showToast({
          type: 'success',
          message: t('rezeption.contest.participantsAdded'),
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.contest.addParticipantsError'),
        });
      },
    }
  );

  const removeContestParticipantsMutation = useMutation(
    ({ contestId, userIds }: { contestId: string; userIds: string[] }) => api.removeContestParticipants(contestId, userIds),
    {
      onSuccess: async () => {
        await refetchContestParticipants();
        await refetchContests();
        setShowContestRemoveUsersModal(false);
        showToast({
          type: 'success',
          message: t('rezeption.contest.participantsRemoved'),
        });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.contest.removeParticipantsError'),
        });
      },
    }
  );

  // Get contest participants for remove modal
  const { data: contestParticipantsForRemove } = useQuery<any[]>(
    ['contestParticipantsAdmin', editingContestId],
    () => api.getContestParticipants(editingContestId!),
    {
      enabled: !!editingContestId && showContestRemoveUsersModal,
    }
  );

  // Contest toggle active mutation
  const toggleContestActiveMutation = useMutation(
    ({ contestId, active }: { contestId: string; active: boolean }) => api.updateContest(contestId, { active }),
    {
      onSuccess: async () => {
        // Invalidate and refetch contests queries
        await queryClient.invalidateQueries(['adminContests']);
        await refetchContests();
        showToast({
          type: 'success',
          message: t('rezeption.contest.manage.toggleSuccess', 'Wettbewerbs-Status erfolgreich geändert'),
        });
        setContestConfirmDialog({ visible: false, contestId: null, action: null, contestName: '' });
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.contest.manage.toggleError', 'Fehler beim Ändern des Wettbewerbs-Status'),
        });
      },
    }
  );

  // Contest delete mutation
  const deleteContestMutation = useMutation(
    (contestId: string) => api.dissolveContest(contestId),
    {
      onSuccess: async (response, contestId) => {
        // Update cache directly by removing the deleted contest
        queryClient.setQueriesData(['adminContests'], (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          const filtered = oldData.filter((contest) => contest.id !== contestId);
          return filtered;
        });
        // Invalidate and refetch to ensure consistency
        await queryClient.invalidateQueries(['adminContests'], { exact: false });
        await refetchContests();
        showToast({
          type: 'success',
          message: t('rezeption.contest.manage.deleteSuccess', 'Wettbewerb erfolgreich gelöscht'),
        });
        setContestConfirmDialog({ visible: false, contestId: null, action: null, contestName: '' });
      },
      onError: (error: any, contestId) => {
        showToast({
          type: 'error',
          message: error?.response?.data?.error || t('rezeption.contest.manage.deleteError', 'Fehler beim Löschen des Wettbewerbs'),
        });
      },
    }
  );

  // Bulk operations
  const toggleContestSelection = (contestId: string, checked: boolean) => {
    setSelectedContestIds((prev) => {
      if (checked) {
        return [...prev, contestId];
      } else {
        return prev.filter((id) => id !== contestId);
      }
    });
  };

  const handleContestBulkStatus = async (active: boolean) => {
    if (!selectedContestIds.length) return;
    try {
      setContestManagementMessage(null);
      await api.bulkUpdateContestsStatus(selectedContestIds, active);
      setContestManagementMessage({
        type: 'success',
        text: active 
          ? t('rezeption.contest.manage.bulkActivateSuccess', 'Ausgewählte Wettbewerbe wurden aktiviert')
          : t('rezeption.contest.manage.bulkDeactivateSuccess', 'Ausgewählte Wettbewerbe wurden deaktiviert'),
      });
      setSelectedContestIds([]);
      await refetchContests();
    } catch (error: any) {
      setContestManagementMessage({
        type: 'error',
        text: error?.response?.data?.error || t('rezeption.contest.manage.bulkStatusError', 'Fehler beim Ändern des Status'),
      });
    }
  };

  const handleContestBulkDelete = async () => {
    if (!selectedContestIds.length) return;
    setContestConfirmDialog({
      visible: true,
      contestId: null,
      action: 'delete',
      contestName: `${selectedContestIds.length} ${t('rezeption.contest.manage.contests', 'Wettbewerbe')}`,
    });
  };

  const handleBack = () => {
    if (editingContestId) {
      setEditingContestId(null);
    } else if (isCreatingContest) {
      setIsCreatingContest(false);
    } else if (onBack) {
      onBack();
    }
  };


  return (
    <section className={`${cssPrefix}-section`}>
      <header className={`${cssPrefix}-section-header`}>
        <div>
          <h2>{t('rezeption.contest.manage.title', 'Wettbewerbe verwalten')}</h2>
          <p>{t('rezeption.contest.manage.subtitle', 'Verwalten Sie alle Wettbewerbe')}</p>
        </div>
        <div className={`${cssPrefix}-actions`}>
          {!editingContestId && !isCreatingContest && (
            <>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={() => setIsCreatingContest(true)}
                type="button"
                ref={(el) => {
                  if (el) {
                  }
                }}
              >
                {t('rezeption.contest.manage.createNew', 'Neuen Wettbewerb erstellen')}
              </button>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => refetchContests()}
                title={t('rezeption.contest.manage.refresh', 'Aktualisieren')}
              >
                <Icon name="refresh" />
                <span className="sr-only">{t('rezeption.contest.manage.refresh', 'Aktualisieren')}</span>
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

      {contestsLoading && <p>{t('rezeption.contest.manage.loading', 'Lade Wettbewerbe...')}</p>}
      {Boolean(contestsError) && <p className={`${cssPrefix}-error`}>{t('rezeption.contest.manage.loadError', 'Fehler beim Laden der Wettbewerbe')}</p>}

      {contestManagementMessage && (
        <div className={`${cssPrefix}-message ${cssPrefix}-message-${contestManagementMessage.type}`}>
          {contestManagementMessage.text}
        </div>
      )}

      {isCreatingContest && (
        <div className={`${cssPrefix}-form-card`}>
          <ContestCreator
            onSuccess={async (contestId) => {
              setIsCreatingContest(false);
              await refetchContests();
              setContestManagementMessage({
                type: 'success',
                text: t('rezeption.contest.manage.createSuccess', 'Wettbewerb erfolgreich erstellt'),
              });
            }}
            onClose={() => setIsCreatingContest(false)}
            onlyEmployeeParticipants={false}
          />
        </div>
      )}

      {editingContestId && (() => {
        const editingContest = contestsList.find((c) => c.id === editingContestId);
        if (!editingContest) {
          setEditingContestId(null);
          return null;
        }
        return (
          <div className={`${cssPrefix}-form-card`}>
            <div className={`${cssPrefix}-form-section`}>
              <h3>{t('rezeption.contest.manage.edit.title', 'Wettbewerb bearbeiten')}</h3>
              <div className={`${cssPrefix}-field`}>
                <label>
                  {t('rezeption.contest.manage.edit.name', 'Wettbewerbs-Name')}
                  <input
                    type="text"
                    value={editingContest.name || ''}
                    onChange={async (e) => {
                      try {
                        await api.updateContest(editingContestId, { name: e.target.value || null });
                        await refetchContests();
                        setContestManagementMessage({
                          type: 'success',
                          text: t('rezeption.contest.manage.edit.nameUpdated', 'Wettbewerbs-Name aktualisiert'),
                        });
                      } catch (err: any) {
                        setContestManagementMessage({
                          type: 'error',
                          text: err?.response?.data?.error || err?.message || t('rezeption.contest.manage.edit.nameUpdateError', 'Fehler beim Aktualisieren'),
                        });
                      }
                    }}
                  />
                </label>
              </div>
              <div className={`${cssPrefix}-form-actions`}>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setShowContestAddUsersModal(true)}
                >
                  {t('rezeption.contest.manage.edit.addParticipants', 'Teilnehmer hinzufügen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setShowContestRemoveUsersModal(true)}
                >
                  {t('rezeption.contest.manage.edit.removeParticipants', 'Teilnehmer entfernen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => generateContestJoinQrMutation.mutate(editingContestId)}
                >
                  {t('rezeption.contest.manage.edit.showJoinQr', 'Join-QR-Code anzeigen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => generateContestRegistrationQrMutation.mutate(editingContestId)}
                >
                  {t('rezeption.contest.manage.edit.showRegistrationQr', 'Registrierungs-QR-Code anzeigen')}
                </button>
                <button
                  className={`${cssPrefix}-button`}
                  onClick={() => setEditingContestId(null)}
                >
                  {t('common.actions.back', 'Fertig')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {!editingContestId && !isCreatingContest && (
        <>
          <div className={`${cssPrefix}-filters`}>
            <div className={`${cssPrefix}-filter-group`}>
              <label>
                {t('rezeption.contest.manage.filters.status', 'Status')}
                <select
                  value={contestFilterStatus || ''}
                  onChange={(e) => setContestFilterStatus(e.target.value as 'active' | 'inactive' | null || null)}
                >
                  <option value="">{t('common.all', 'Alle')}</option>
                  <option value="active">{t('common.status.active', 'Aktiv')}</option>
                  <option value="inactive">{t('common.status.inactive', 'Inaktiv')}</option>
                </select>
              </label>
              <label>
                {t('rezeption.contest.manage.filters.name', 'Name')}
                <input
                  type="text"
                  value={contestFilterName}
                  onChange={(e) => setContestFilterName(e.target.value)}
                  placeholder={t('rezeption.contest.manage.filters.namePlaceholder', 'Nach Name suchen...')}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                <input
                  type="checkbox"
                  checked={includeInactiveContests}
                  onChange={(e) => setIncludeInactiveContests(e.target.checked)}
                />
                {t('rezeption.contest.manage.filters.includeInactive', 'Inaktive anzeigen')}
              </label>
            </div>
          </div>

          {/* Bulk action buttons */}
          <div className={`${cssPrefix}-management-actions`}>
            <span className={`${cssPrefix}-selection-count`}>
              {selectedContestIds.length > 0
                ? t('rezeption.contest.manage.selectedCount', '{{count}} ausgewählt', { count: selectedContestIds.length })
                : t('rezeption.contest.manage.noSelection', 'Keine Auswahl')}
            </span>
            <div className={`${cssPrefix}-bulk-buttons`}>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={() => handleContestBulkStatus(true)}
                disabled={selectedContestIds.length === 0}
                type="button"
              >
                {t('rezeption.contest.manage.activate', 'Aktivieren')}
              </button>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={() => handleContestBulkStatus(false)}
                disabled={selectedContestIds.length === 0}
                type="button"
              >
                {t('rezeption.contest.manage.deactivate', 'Deaktivieren')}
              </button>
              <button
                className={`${cssPrefix}-action-button`}
                onClick={handleContestBulkDelete}
                disabled={selectedContestIds.length === 0}
                type="button"
              >
                {t('common.actions.delete', 'Löschen')}
              </button>
            </div>
          </div>

          {/* Contests table */}
          <div className={`${cssPrefix}-table-wrapper`}>
            <table className={`${cssPrefix}-table contest-team-table`} ref={tableRef}>
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}>
                    <input
                      type="checkbox"
                      className={`${cssPrefix}-checkbox`}
                      checked={filteredContests.length > 0 && selectedContestIds.length === filteredContests.length}
                      disabled={filteredContests.length === 0}
                      onChange={(event) =>
                        setSelectedContestIds(
                          event.target.checked
                            ? filteredContests.map((contest) => contest.id)
                            : []
                        )
                      }
                      aria-label={t('rezeption.contest.manage.selectAll', 'Alle auswählen')}
                    />
                  </th>
                  <th>{t('rezeption.contest.manage.name', 'Name')}</th>
                  <th>{t('rezeption.contest.manage.createdBy', 'Erstellt von')}</th>
                  <th>{t('rezeption.contest.manage.status', 'Status')}</th>
                  <th>{t('common.actions.title', 'Aktionen')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredContests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`${cssPrefix}-table-empty`}>
                      {t('rezeption.contest.manage.noContests', 'Keine Wettbewerbe gefunden')}
                    </td>
                  </tr>
                ) : (
                  filteredContests.map((contest) => {
                    const isSelected = selectedContestIds.includes(contest.id);
                    return (
                      <tr key={contest.id}>
                        <td>
                          <input
                            type="checkbox"
                            className={`${cssPrefix}-checkbox`}
                            checked={isSelected}
                            onChange={(event) =>
                              toggleContestSelection(contest.id, event.target.checked)
                            }
                            aria-label={`${t('rezeption.contest.manage.selectContest', 'Wettbewerb auswählen')} ${contest.name || t('rezeption.contest.manage.unnamed', 'Unbenannter Wettbewerb')}`}
                          />
                        </td>
                        <td data-label={t('rezeption.contest.manage.name', 'Name')}>
                          <div className={`${cssPrefix}-table-primary`}>
                            <span className={`${cssPrefix}-table-title`}>
                              {contest.name || t('rezeption.contest.manage.unnamed', 'Unbenannter Wettbewerb')}
                            </span>
                          </div>
                        </td>
                        <td data-label={t('rezeption.contest.manage.createdBy', 'Erstellt von')}>
                          {contest.creator_name || 'Unknown'}
                        </td>
                        <td data-label={t('rezeption.contest.manage.status', 'Status')}>
                          <span className={`${cssPrefix}-status-badge ${contest.active ? 'active' : 'inactive'}`}>
                            {contest.active ? t('common.status.active', 'Aktiv') : t('common.status.inactive', 'Inaktiv')}
                          </span>
                        </td>
                        <td data-label={t('common.actions.title', 'Aktionen')}>
                          <div className={`${cssPrefix}-bulk-buttons`}>
                            <button
                              className={`${cssPrefix}-action-button`}
                              onClick={() => setEditingContestId(contest.id)}
                              type="button"
                            >
                              {t('common.actions.edit', 'Bearbeiten')}
                            </button>
                            <button
                              className={`${cssPrefix}-action-button`}
                              onClick={() => {
                                setContestConfirmDialog({
                                  visible: true,
                                  contestId: contest.id,
                                  action: 'toggleActive',
                                  contestName: contest.name || t('rezeption.contest.manage.unnamed', 'Unbenannter Wettbewerb'),
                                });
                              }}
                              type="button"
                            >
                              {contest.active
                                ? t('rezeption.contest.manage.deactivate', 'Deaktivieren')
                                : t('rezeption.contest.manage.activate', 'Aktivieren')}
                            </button>
                            <button
                              className={`${cssPrefix}-action-button`}
                              onClick={() => {
                                setContestConfirmDialog({
                                  visible: true,
                                  contestId: contest.id,
                                  action: 'delete',
                                  contestName: contest.name || t('rezeption.contest.manage.unnamed', 'Unbenannter Wettbewerb'),
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

      {/* Contest Add Participants Modal */}
      {showContestAddUsersModal && editingContestId && (
        <UserSelectionModal
          isOpen={showContestAddUsersModal}
          onClose={() => setShowContestAddUsersModal(false)}
          onAdd={(userIds) => {
            addContestParticipantsMutation.mutate({ contestId: editingContestId, userIds });
          }}
          excludeUserIds={contestParticipantsData?.map((p: any) => p.user_id) || []}
          title={t('rezeption.contest.manage.edit.addParticipants', 'Teilnehmer hinzufügen')}
          addButtonLabel={t('rezeption.contest.manage.edit.add', 'Hinzufügen')}
        />
      )}

      {/* Contest Remove Participants Modal */}
      {showContestRemoveUsersModal && editingContestId && contestParticipantsForRemove && (
        <UserSelectionModal
          isOpen={showContestRemoveUsersModal}
          onClose={() => setShowContestRemoveUsersModal(false)}
          onAdd={(userIds) => {
            removeContestParticipantsMutation.mutate({ contestId: editingContestId, userIds });
          }}
          includeOnlyUserIds={contestParticipantsForRemove.map((p: any) => p.user_id)}
          title={t('rezeption.contest.manage.edit.removeParticipants', 'Teilnehmer entfernen')}
          addButtonLabel={t('rezeption.contest.manage.edit.remove', 'Entfernen')}
        />
      )}

      {/* Contest Join QR Modal */}
      {showContestJoinQrModal && contestJoinQrToken && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setShowContestJoinQrModal(false)}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>{t('rezeption.contest.manage.edit.joinQrTitle', 'Join-QR-Code')}</h3>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => setShowContestJoinQrModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <QRCode value={contestJoinQrToken} size={256} />
              <p>{t('rezeption.contest.manage.edit.joinQrDescription', 'Bestehende Benutzer können diesen QR-Code scannen, um am Wettbewerb teilzunehmen')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contest Registration QR Modal */}
      {showContestRegistrationQrModal && contestRegistrationQrData && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setShowContestRegistrationQrModal(false)}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>{t('rezeption.contest.manage.edit.registrationQrTitle', 'Registrierungs-QR-Code')}</h3>
              <button
                className={`${cssPrefix}-icon-button`}
                onClick={() => setShowContestRegistrationQrModal(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <QRCode value={contestRegistrationQrData.url} size={256} />
              <p>{t('rezeption.contest.manage.edit.registrationQrDescription', 'Neue Benutzer können diesen QR-Code scannen, um sich zu registrieren und automatisch am Wettbewerb teilzunehmen')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contest Confirm Dialog */}
      {contestConfirmDialog.visible && (contestConfirmDialog.contestId || contestConfirmDialog.action === 'delete') && (
        <div className={`${cssPrefix}-modal-overlay`} onClick={() => setContestConfirmDialog({ visible: false, contestId: null, action: null, contestName: '' })}>
          <div className={`${cssPrefix}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${cssPrefix}-modal-header`}>
              <h3>
                {contestConfirmDialog.action === 'delete'
                  ? t('rezeption.contest.manage.deleteConfirm.title', 'Wettbewerb löschen')
                  : t('rezeption.contest.manage.toggleConfirm.title', 'Wettbewerbs-Status ändern')}
              </h3>
            </div>
            <div className={`${cssPrefix}-modal-content`}>
              <p>
                {contestConfirmDialog.action === 'delete'
                  ? t('rezeption.contest.manage.deleteConfirm.description', 'Möchten Sie den Wettbewerb "{{name}}" wirklich löschen?', { name: contestConfirmDialog.contestName })
                  : t('rezeption.contest.manage.toggleConfirm.description', 'Möchten Sie den Status des Wettbewerbs "{{name}}" wirklich ändern?', { name: contestConfirmDialog.contestName })}
              </p>
            </div>
            <div className={`${cssPrefix}-modal-footer`}>
              <button
                className={`${cssPrefix}-button`}
                onClick={() => setContestConfirmDialog({ visible: false, contestId: null, action: null, contestName: '' })}
              >
                {t('common.actions.cancel', 'Abbrechen')}
              </button>
              <button
                className={`${cssPrefix}-button`}
                onClick={async () => {
                  if (contestConfirmDialog.action === 'delete') {
                    if (contestConfirmDialog.contestId) {
                      // Single contest delete
                      deleteContestMutation.mutate(contestConfirmDialog.contestId);
                    } else {
                      // Bulk delete
                      try {
                        setContestManagementMessage(null);
                        await api.bulkDeleteContests(selectedContestIds);
                        setContestManagementMessage({
                          type: 'success',
                          text: t('rezeption.contest.manage.bulkDeleteSuccess', 'Ausgewählte Wettbewerbe wurden gelöscht'),
                        });
                        setSelectedContestIds([]);
                        await refetchContests();
                      } catch (error: any) {
                        setContestManagementMessage({
                          type: 'error',
                          text: error?.response?.data?.error || t('rezeption.contest.manage.bulkDeleteError', 'Fehler beim Löschen der Wettbewerbe'),
                        });
                      }
                    }
                    setContestConfirmDialog({ visible: false, contestId: null, action: null, contestName: '' });
                  } else if (contestConfirmDialog.action === 'toggleActive') {
                    const contest = contestsList.find((c) => c.id === contestConfirmDialog.contestId);
                    if (contest) {
                      toggleContestActiveMutation.mutate({ contestId: contestConfirmDialog.contestId!, active: !contest.active });
                    }
                    setContestConfirmDialog({ visible: false, contestId: null, action: null, contestName: '' });
                  }
                }}
              >
                {contestConfirmDialog.action === 'delete'
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
