import { useEffect, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import './QrVerificationSuccessModal.css';

type QrVerificationSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  rewardTitle?: string;
  isAdmin?: boolean;
};

export function QrVerificationSuccessModal({
  isOpen,
  onClose,
  userName,
  rewardTitle,
  isAdmin = false,
}: QrVerificationSuccessModalProps) {
  const { t } = useTranslation();

  // Debug: Log when modal opens (to verify new code is running)
  useEffect(() => {
    if (isOpen) {
      console.log('[QR Success Modal] Modal opened - new code version loaded');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Prevent closing on overlay click - only close via OK button
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    // Don't close on overlay click - only via OK button
    e.stopPropagation();
  };

  return (
    <div className="qr-success-modal-overlay" onClick={handleOverlayClick}>
      <div className="qr-success-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-success-modal-icon">✓</div>
        <h2 className="qr-success-modal-title">
          {isAdmin
            ? t('admin.qrScanner.successModal.title')
            : t('rewards.qr.successModal.title')}
        </h2>
        <p className="qr-success-modal-message">
          {isAdmin
            ? t('admin.qrScanner.successModal.message', { userName: userName || 'User' })
            : t('rewards.qr.successModal.message', { title: rewardTitle || 'Reward' })}
        </p>
        {isAdmin && rewardTitle && (
          <p className="qr-success-modal-details">
            {t('admin.qrScanner.successModal.reward', { title: rewardTitle })}
          </p>
        )}
        <button className="qr-success-modal-button" onClick={onClose}>
          {t('common.ok') || 'OK'}
        </button>
      </div>
    </div>
  );
}

