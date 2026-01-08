import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import './ContestCreator.css';

type ContestCreatorProps = {
  onSuccess?: (contestId: string) => void;
  onClose?: () => void;
  onlyEmployeeParticipants?: boolean; // If true, only show employees/administrators as participants
};

export function ContestCreator({ onSuccess, onClose, onlyEmployeeParticipants = false }: ContestCreatorProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const [contestName, setContestName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');
  const [rewardFirst, setRewardFirst] = useState('');
  const [rewardSecond, setRewardSecond] = useState('');
  const [rewardThird, setRewardThird] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const isEmployee = user?.role === 'employee' || user?.role === 'administrator';

  // Load users for employee/admin
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
    ['users', roleFilter, onlyEmployeeParticipants],
    async () => {
      try {
        // Determine role filter for API call
        let roleToFilter: string | undefined = undefined;
        if (roleFilter !== 'all') {
          roleToFilter = roleFilter;
        }
        
        console.log('[ContestCreator] Fetching users with filter:', { roleToFilter, active: true, onlyEmployeeParticipants });
        
        const data = await api.listUsers({ 
          role: roleToFilter, 
          active: true,
          limit: 1000 // Get all users
        });
        
        console.log('[ContestCreator] Received users data:', data);
        
        // If onlyEmployeeParticipants is true, filter out guests and stakeholders
        if (onlyEmployeeParticipants && data?.users) {
          const filtered = {
            ...data,
            users: data.users.filter((u: any) => 
              u.role === 'employee' || u.role === 'administrator'
            )
          };
          console.log('[ContestCreator] Filtered to employees only:', filtered);
          return filtered;
        }
        
        console.log('[ContestCreator] Returning all users:', data);
        return data;
      } catch (error: any) {
        console.error('[ContestCreator] Error loading users:', error);
        console.error('[ContestCreator] Error details:', error?.response?.data || error?.message);
        throw error;
      }
    },
    { 
      enabled: isEmployee,
      retry: 1,
      refetchOnWindowFocus: false
    }
  );

  const users = usersData?.users || [];
  
  console.log('[ContestCreator] Current state:', {
    isEmployee,
    usersLoading,
    usersError: usersError?.message,
    usersCount: users.length,
    usersData: usersData,
    roleFilter,
    onlyEmployeeParticipants
  });

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleCreateContest = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.missingFields') || 'Please fill in all required fields',
      });
      return;
    }

    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.invalidDateTime') || 'Invalid date or time',
      });
      return;
    }

    if (startDateTime >= endDateTime) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.startAfterEnd') || 'Start date must be before end date',
      });
      return;
    }

    if (endDateTime <= new Date()) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.invalidEndDate') || 'End date must be in the future',
      });
      return;
    }

    setIsCreating(true);

    try {
      const rewards = isEmployee && (rewardFirst || rewardSecond || rewardThird)
        ? {
            reward_first_place: rewardFirst ? parseInt(rewardFirst, 10) : undefined,
            reward_second_place: rewardSecond ? parseInt(rewardSecond, 10) : undefined,
            reward_third_place: rewardThird ? parseInt(rewardThird, 10) : undefined,
          }
        : undefined;

      const participantIds = selectedParticipants.size > 0 ? Array.from(selectedParticipants) : undefined;
      const contest = await api.createContest(startDateTime.toISOString(), endDateTime.toISOString(), contestName || undefined, rewards, participantIds);
      
      showToast({
        type: 'success',
        title: t('contests.create.success') || 'Contest created',
        message: t('contests.create.successMessage') || 'Contest created successfully',
      });

      onSuccess?.(contest.id);
      onClose?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('contests.create.error') || 'Failed to create contest';
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="contest-creator-form">
      <div className="contest-creator-header">
        <h2>{t('contests.create.title') || 'Create Contest'}</h2>
        {onClose && (
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            title={t('common.actions.close') || 'Close'}
          >
            ✕
          </button>
        )}
      </div>

      <div className="contest-form-field">
        <label>
          {t('contests.create.contestName') || 'Contest Name'} (optional)
          <input
            type="text"
            value={contestName}
            onChange={(e) => setContestName(e.target.value)}
            placeholder={t('contests.create.contestNamePlaceholder') || 'Enter contest name (optional)'}
          />
        </label>
        <p className="contest-form-hint">{t('contests.create.nameHint') || 'If no name is provided, your name will be used as the contest name.'}</p>
      </div>

      <div className="contest-form-field">
        <label>
          {t('contests.create.startDate') || 'Start Date'} *
        </label>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
            style={{ flex: 1 }}
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div className="contest-form-field">
        <label>
          {t('contests.create.endDate') || 'End Date'} *
        </label>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || minDate}
            required
            style={{ flex: 1 }}
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {isEmployee && (
        <>
          <h3>{t('contests.create.rewardsTitle') || 'Rewards (Optional)'}</h3>
          <div className="contest-form-field">
            <label>
              {t('contests.create.rewardFirst') || 'Points for 1st Place'}
              <input
                type="number"
                value={rewardFirst}
                onChange={(e) => setRewardFirst(e.target.value)}
                min="0"
                placeholder="0"
              />
            </label>
          </div>
          <div className="contest-form-field">
            <label>
              {t('contests.create.rewardSecond') || 'Points for 2nd Place'}
              <input
                type="number"
                value={rewardSecond}
                onChange={(e) => setRewardSecond(e.target.value)}
                min="0"
                placeholder="0"
              />
            </label>
          </div>
          <div className="contest-form-field">
            <label>
              {t('contests.create.rewardThird') || 'Points for 3rd Place'}
              <input
                type="number"
                value={rewardThird}
                onChange={(e) => setRewardThird(e.target.value)}
                min="0"
                placeholder="0"
              />
            </label>
          </div>
        </>
      )}

      {isEmployee && (
        <>
          <h3>{t('contests.create.participantsTitle', 'Teilnehmer hinzufügen')}</h3>
          <div className="contest-form-field">
            <label>
              {t('contests.create.filterByRole', 'Nach Typ filtern')}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="contest-role-filter"
              >
                <option value="all">{t('contests.create.allRoles', 'Alle Typen')}</option>
                <option value="guest">{t('contests.create.roleGuest', 'Gast')}</option>
                <option value="employee">{t('contests.create.roleEmployee', 'Mitarbeiter')}</option>
                <option value="administrator">{t('contests.create.roleAdministrator', 'Administrator')}</option>
              </select>
            </label>
          </div>
          <div className="contest-participants-list">
            {usersLoading ? (
              <p>{t('contests.create.loadingUsers', 'Benutzer werden geladen...')}</p>
            ) : usersError ? (
              <div style={{ color: 'red', padding: 'var(--spacing-md)', border: '1px solid red', borderRadius: 'var(--border-radius-sm)' }}>
                <p><strong>{t('contests.create.errorLoadingUsers', 'Fehler beim Laden der Benutzer')}</strong></p>
                <p style={{ fontSize: '0.9rem' }}>{usersError?.response?.data?.error || usersError?.message || 'Unknown error'}</p>
                {usersError?.response?.status && (
                  <p style={{ fontSize: '0.85rem', marginTop: 'var(--spacing-xs)' }}>
                    HTTP Status: {usersError.response.status}
                  </p>
                )}
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: 'var(--spacing-md)' }}>
                <p>{t('contests.create.noUsers', 'Keine Benutzer gefunden')}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: 'var(--spacing-xs)' }}>
                  Filter: {roleFilter === 'all' ? 'Alle Rollen' : roleFilter}
                  {onlyEmployeeParticipants && ' (nur Mitarbeitende)'}
                </p>
              </div>
            ) : (
              <div className="contest-participants-checkboxes">
                {users.map((userItem: any) => (
                  <label key={userItem.id} className="contest-participant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(userItem.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedParticipants);
                        if (e.target.checked) {
                          newSet.add(userItem.id);
                        } else {
                          newSet.delete(userItem.id);
                        }
                        setSelectedParticipants(newSet);
                      }}
                    />
                    <span>
                      {userItem.name} ({userItem.email || t('contests.create.noEmail', 'keine E-Mail')}) - {t(`admin.users.roles.${userItem.role}`, userItem.role)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedParticipants.size > 0 && (
            <p className="contest-form-hint">
              {t('contests.create.selectedParticipants', { count: selectedParticipants.size }, `${selectedParticipants.size} Teilnehmer ausgewählt`)}
            </p>
          )}
        </>
      )}

      <div className="contest-form-actions">
        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
        >
          {t('common.actions.cancel', 'Abbrechen')}
        </button>
        <button
          type="button"
          onClick={handleCreateContest}
          disabled={isCreating || !startDate || !startTime || !endDate || !endTime}
        >
          {isCreating ? (t('contests.create.creating') || 'Creating...') : (t('contests.create.createButton') || 'Create Contest')}
        </button>
      </div>
    </div>
  );
}
