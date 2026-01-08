import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import './ContestCreator.css';

type ContestCreatorProps = {
  onSuccess?: (contestId: string) => void;
  onClose?: () => void;
};

export function ContestCreator({ onSuccess, onClose }: ContestCreatorProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const [contestName, setContestName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rewardFirst, setRewardFirst] = useState('');
  const [rewardSecond, setRewardSecond] = useState('');
  const [rewardThird, setRewardThird] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isEmployee = user?.role === 'employee' || user?.role === 'administrator';

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleCreateContest = async () => {
    if (!endDate) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.missingFields') || 'Please fill in all required fields',
      });
      return;
    }

    const endDateObj = new Date(endDate);
    if (endDateObj <= new Date()) {
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

      const contest = await api.createContest(endDate, contestName || undefined, rewards);
      
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
          {t('contests.create.endDate') || 'End Date'} *
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={minDate}
          required
        />
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
          disabled={isCreating || !endDate}
        >
          {isCreating ? (t('contests.create.creating') || 'Creating...') : (t('contests.create.createButton') || 'Create Contest')}
        </button>
      </div>
    </div>
  );
}
