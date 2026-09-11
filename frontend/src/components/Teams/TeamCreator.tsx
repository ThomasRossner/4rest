import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import './TeamCreator.css';

type TeamCreatorProps = {
  onSuccess?: (teamId: string) => void;
  onClose?: () => void;
};

export function TeamCreator({ onSuccess, onClose }: TeamCreatorProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const team = await api.createTeam(teamName || undefined);
      
      showToast({
        type: 'success',
        title: t('teams.create.success'),
        message: t('teams.create.successMessage'),
      });

      onSuccess?.(team.id);
      onClose?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('teams.create.error');
      showToast({
        type: 'error',
        title: t('teams.create.errorTitle'),
        message: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="team-creator-form">
      <div className="team-creator-header">
        <h2>{t('teams.create.title')}</h2>
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

      <div className="team-form-field">
        <label>
          {t('teams.create.teamName')} (optional)
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t('teams.create.teamNamePlaceholder')}
          />
        </label>
        <p className="team-form-hint">{t('teams.create.hint')}</p>
      </div>

      <div className="team-form-actions">
        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
        >
          {t('common.actions.cancel')}
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (t('teams.create.creating')) : (t('teams.create.createButton'))}
        </button>
      </div>
    </div>
  );
}
