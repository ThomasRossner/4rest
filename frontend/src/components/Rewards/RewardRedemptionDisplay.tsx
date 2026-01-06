import { useTranslation } from 'react-i18next';
import '../../pages/Admin/AdminPage.css';
import './RewardRedemptionDisplay.css';

type RewardRedemptionDisplayProps = {
  redemption: {
    rewardTitle: string;
    rewardDescription?: string;
    userName?: string;
    userEmail?: string;
    pointsCost: number;
  };
  onRedeem: () => void;
  onCancel: () => void;
  isRedeeming: boolean;
};

export function RewardRedemptionDisplay({
  redemption,
  onRedeem,
  onCancel,
  isRedeeming,
}: RewardRedemptionDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="reward-redemption-display">
      <div className="reward-redemption-content">
        <h2 className="reward-redemption-title">
          {t('rewards.redemption.title') || 'Belohnung gefunden'}
        </h2>
        
        <div className="reward-redemption-info">
          <div className="reward-redemption-section">
            <h3 className="reward-redemption-section-title">
              {t('rewards.redemption.reward') || 'Belohnung'}
            </h3>
            <p className="reward-redemption-reward-title">{redemption.rewardTitle}</p>
            {redemption.rewardDescription && (
              <p className="reward-redemption-reward-description">
                {redemption.rewardDescription}
              </p>
            )}
            <p className="reward-redemption-points">
              {t('rewards.redemption.pointsCost', { count: redemption.pointsCost }) || `${redemption.pointsCost} Punkte`}
            </p>
          </div>

          <div className="reward-redemption-section">
            <h3 className="reward-redemption-section-title">
              {t('rewards.redemption.guest') || 'Gast'}
            </h3>
            <p className="reward-redemption-guest-name">
              {redemption.userName || redemption.userEmail || t('rewards.redemption.unknownGuest') || 'Unbekannter Gast'}
            </p>
            {redemption.userEmail && redemption.userName && (
              <p className="reward-redemption-guest-email">{redemption.userEmail}</p>
            )}
          </div>
        </div>

        <div className="reward-redemption-actions">
          <button
            type="button"
            className="reward-redemption-button reward-redemption-button-cancel"
            onClick={onCancel}
            disabled={isRedeeming}
          >
            {t('common.actions.cancel') || 'Abbrechen'}
          </button>
          <button
            type="button"
            className="reward-redemption-button reward-redemption-button-redeem"
            onClick={onRedeem}
            disabled={isRedeeming}
          >
            {isRedeeming
              ? (t('rewards.redemption.redeeming') || 'Wird eingelöst...')
              : (t('rewards.redemption.redeem') || 'Belohnung eingelöst')}
          </button>
        </div>
      </div>
    </div>
  );
}

