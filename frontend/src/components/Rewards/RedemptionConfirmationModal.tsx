import { useTranslation } from 'react-i18next';
import './RedemptionConfirmationModal.css';

type RedemptionConfirmationModalProps = {
  isOpen: boolean;
  rewardTitle: string;
  pointsCost: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function RedemptionConfirmationModal({
  isOpen,
  rewardTitle,
  pointsCost,
  onConfirm,
  onCancel,
}: RedemptionConfirmationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="redemption-modal-overlay" onClick={onCancel}>
      <div className="redemption-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="redemption-modal-title">{t('rewards.confirm.title')}</h2>
        <p className="redemption-modal-message">
          {t('rewards.confirm.message', { title: rewardTitle, cost: pointsCost })}
        </p>
        <p className="redemption-modal-warning">{t('rewards.confirm.warning')}</p>
        <div className="redemption-modal-actions">
          <button className="redemption-modal-button cancel" onClick={onCancel}>
            {t('rewards.confirm.no')}
          </button>
          <button className="redemption-modal-button confirm" onClick={onConfirm}>
            {t('rewards.confirm.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}

