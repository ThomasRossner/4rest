import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import './ContestCreator.css';

function integerDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

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

  const isEmployee = user?.role === 'rezeption' || user?.role === 'administrator';

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
        
        // If onlyEmployeeParticipants is true, filter out guests
        if (onlyEmployeeParticipants && data?.users) {
          const filtered = {
            ...data,
            users: data.users.filter((u: any) => 
              u.role === 'rezeption' || u.role === 'administrator'
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
        title: t('contests.create.errorTitle'),
        message: t('contests.create.missingFields'),
      });
      return;
    }

    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle'),
        message: t('contests.create.invalidDateTime'),
      });
      return;
    }

    if (startDateTime >= endDateTime) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle'),
        message: t('contests.create.startAfterEnd'),
      });
      return;
    }

    if (endDateTime <= new Date()) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle'),
        message: t('contests.create.invalidEndDate'),
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
        title: t('contests.create.success'),
        message: t('contests.create.successMessage'),
      });

      onSuccess?.(contest.id);
      onClose?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('contests.create.error');
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle'),
        message: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="contest-creator-form">
      <div className="contest-creator-header">
        <h2>{t('contests.create.title')}</h2>
        {onClose && (
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            title={t('common.actions.close')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="contest-form-field">
        <label>
          {t('contests.create.contestName')} (optional)
          <input
            type="text"
            value={contestName}
            onChange={(e) => setContestName(e.target.value)}
            placeholder={t('contests.create.contestNamePlaceholder')}
          />
        </label>
        <p className="contest-form-hint">{t('contests.create.nameHint')}</p>
      </div>

      <div className="contest-form-field">
        <label>
          {t('contests.create.startDate')} *
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
          {t('contests.create.endDate')} *
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
          <h3>{t('contests.create.rewardsTitle')}</h3>
          <div className="contest-form-field">
            <label>
              {t('contests.create.rewardFirst')}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={rewardFirst}
                onChange={(e) => setRewardFirst(integerDigitsOnly(e.target.value))}
                placeholder="0"
              />
            </label>
          </div>
          <div className="contest-form-field">
            <label>
              {t('contests.create.rewardSecond')}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={rewardSecond}
                onChange={(e) => setRewardSecond(integerDigitsOnly(e.target.value))}
                placeholder="0"
              />
            </label>
          </div>
          <div className="contest-form-field">
            <label>
              {t('contests.create.rewardThird')}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={rewardThird}
                onChange={(e) => setRewardThird(integerDigitsOnly(e.target.value))}
                placeholder="0"
              />
            </label>
          </div>
        </>
      )}

      {isEmployee && (
        <>
          <h3>{t('contests.create.participantsTitle')}</h3>
          <div className="contest-form-field">
            <label>
              {t('contests.create.filterByRole')}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="contest-role-filter"
              >
                <option value="all">{t('contests.create.allRoles')}</option>
                <option value="guest">{t('contests.create.roleGuest')}</option>
                <option value="rezeption">{t('contests.create.roleRezeption')}</option>
                <option value="redaktion">{t('contests.create.roleRedaktion')}</option>
                <option value="administrator">{t('contests.create.roleAdministrator')}</option>
              </select>
            </label>
          </div>
          <div className="contest-participants-list">
            {usersLoading ? (
              <p>{t('contests.create.loadingUsers')}</p>
            ) : usersError ? (
              <div style={{ color: 'red', padding: 'var(--spacing-md)', border: '1px solid red', borderRadius: 'var(--border-radius-sm)' }}>
                <p><strong>{t('contests.create.errorLoadingUsers')}</strong></p>
                <p style={{ fontSize: '0.9rem' }}>{usersError?.response?.data?.error || usersError?.message || 'Unknown error'}</p>
                {usersError?.response?.status && (
                  <p style={{ fontSize: '0.85rem', marginTop: 'var(--spacing-xs)' }}>
                    HTTP Status: {usersError.response.status}
                  </p>
                )}
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: 'var(--spacing-md)' }}>
                <p>{t('contests.create.noUsers')}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: 'var(--spacing-xs)' }}>
                  {t('contests.create.filter')} {roleFilter === 'all' ? t('contests.create.filterAllRoles') : roleFilter}
                  {onlyEmployeeParticipants && ` ${t('contests.create.onlyRezeption')}`}
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
                      {userItem.name} ({userItem.email || t('contests.create.noEmail')}) - {t(`admin.users.roles.${userItem.role}`)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedParticipants.size > 0 && (
            <p className="contest-form-hint">
              {t('contests.create.selectedParticipants', { count: selectedParticipants.size })}
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
          {t('common.actions.cancel')}
        </button>
        <button
          type="button"
          onClick={handleCreateContest}
          disabled={isCreating || !startDate || !startTime || !endDate || !endTime}
        >
          {isCreating ? (t('contests.create.creating')) : (t('contests.create.createButton'))}
        </button>
      </div>
    </div>
  );
}
