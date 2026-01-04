import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { RewardCard } from '../../components/Rewards/RewardCard';
import { RedemptionConfirmationModal } from '../../components/Rewards/RedemptionConfirmationModal';
import { QrCodeDisplay } from '../../components/Rewards/QrCodeDisplay';
import { pushToast } from '../../components/Toaster/Toaster';
import './RewardsPage.css';

function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const points = useAuthStore((s) => s.user?.points || 0);
  const { data: rewards, isLoading, isError } = useQuery('rewards', () => api.getRewards());
  const [typeFilter, setTypeFilter] = useState<'all' | 'discount' | 'benefit' | 'team_event'>('all');
  const { t } = useTranslation();

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    rewardId: string;
    rewardTitle: string;
    pointsCost: number;
  } | null>(null);
  const [activeRedemption, setActiveRedemption] = useState<{
    qrToken: string;
    redemptionId: string;
    rewardTitle: string;
  } | null>(null);

  const handleRedeemClick = (rewardId: string, rewardTitle: string, cost: number) => {
    if (user && user.points >= cost) {
      setConfirmationModal({
        isOpen: true,
        rewardId,
        rewardTitle,
        pointsCost: cost,
      });
    } else {
      const infoMessage = t('rewards.messages.notEnoughPoints');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'info', message: infoMessage });
      } else {
        alert(infoMessage);
      }
    }
  };

  const handleConfirmRedeem = async () => {
    if (!confirmationModal) return;

    try {
      const res = await api.redeemReward(confirmationModal.rewardId, confirmationModal.pointsCost);
      const redemption = res?.redemption || res?.data?.redemption;
      
      if (redemption?.qrToken) {
        setActiveRedemption({
          qrToken: redemption.qrToken,
          redemptionId: redemption.id,
          rewardTitle: confirmationModal.rewardTitle,
        });
        setConfirmationModal(null);
      } else {
        throw new Error('No QR token received');
      }
    } catch (error: any) {
      const errorMessage = error?.message || t('rewards.messages.redeemError');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'error', message: errorMessage });
      } else {
        alert(errorMessage);
      }
      setConfirmationModal(null);
    }
  };

  const handleCancelRedeem = () => {
    setConfirmationModal(null);
  };

  const handleQrStatusUpdate = (status: 'pending' | 'used' | 'expired') => {
    // Status update handled by QrCodeDisplay component
    // Don't auto-clear - let user close the modal manually
  };

  const filteredRewards = useMemo(() => {
    if (!rewards) return [];
    if (typeFilter === 'all') return rewards;
    return rewards.filter((r: any) => r.rewardType === typeFilter);
  }, [rewards, typeFilter]);

  const uiPolish = !!import.meta.env.VITE_UI_POLISH;

  return (
    <div className="rewards-page">
      <h1 className="rewards-title">{t('rewards.title')}</h1>
      <div className="rewards-balance">
        <span className="rewards-balance-label">{t('rewards.balanceLabel')}:</span>
        <span className="rewards-balance-value">{points}</span>
      </div>
      {uiPolish && (
        <div className="rewards-filter-container">
          {(['all', 'discount', 'benefit', 'team_event'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`reward-filter-btn ${typeFilter === filter ? 'active' : ''}`}
              aria-pressed={typeFilter === filter}
            >
              {t(`rewards.filters.${filter}`)}
            </button>
          ))}
        </div>
      )}

      {isLoading && <LoadingSkeleton lines={6} />}
      {!isLoading && !isError && filteredRewards.length === 0 && (
        <EmptyState title={t('rewards.empty.title')} description={t('rewards.empty.description')} />
      )}

      {activeRedemption && (
        <QrCodeDisplay
          qrToken={activeRedemption.qrToken}
          redemptionId={activeRedemption.redemptionId}
          rewardTitle={activeRedemption.rewardTitle}
          onStatusUpdate={handleQrStatusUpdate}
          onClose={() => setActiveRedemption(null)}
        />
            )}

      {confirmationModal && (
        <RedemptionConfirmationModal
          isOpen={confirmationModal.isOpen}
          rewardTitle={confirmationModal.rewardTitle}
          pointsCost={confirmationModal.pointsCost}
          onConfirm={handleConfirmRedeem}
          onCancel={handleCancelRedeem}
        />
      )}

      <div className="rewards-grid">
        {!isLoading && !isError && filteredRewards.map((reward: any) => (
          uiPolish ? (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={!!user && user.points >= reward.pointsCost}
              onRedeem={(id, cost) => handleRedeemClick(id, reward.title, cost)}
            />
          ) : (
            <div key={reward.id} className="reward-card">
              <div className="reward-icon">{reward.icon || '🎁'}</div>
              <h3 className="reward-title">{reward.title}</h3>
              <p className="reward-description">{reward.description}</p>
              <div className="reward-footer">
                <span className="reward-cost">
                  {t('rewards.card.cost', { count: reward.pointsCost })}
                </span>
                <button
                  className="reward-button"
                  onClick={() => handleRedeemClick(reward.id, reward.title, reward.pointsCost)}
                  disabled={!user || user.points < reward.pointsCost}
                >
                  {t('rewards.card.redeem')}
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default RewardsPage;
