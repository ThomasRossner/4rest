import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { RewardCard } from '../../components/Rewards/RewardCard';
import { SwipeToRedeem } from '../../components/Rewards/SwipeToRedeem';
import { QrCodeDisplay } from '../../components/Rewards/QrCodeDisplay';
import { PointsBonusScanner } from '../../components/Rewards/PointsBonusScanner';
import { pushToast } from '../../components/Toaster/Toaster';
import './RewardsPage.css';

function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const points = useAuthStore((s) => s.user?.points || 0);
  const { data: rewards, isLoading, isError } = useQuery('rewards', () => api.getRewards());
  const [typeFilter, setTypeFilter] = useState<'all' | 'discount' | 'benefit' | 'team_event'>('all');
  const { t } = useTranslation();

  const [swipeModal, setSwipeModal] = useState<{
    rewardId: string;
    rewardTitle: string;
    pointsCost: number;
  } | null>(null);
  const [activeRedemption, setActiveRedemption] = useState<{
    qrToken: string;
    redemptionId: string;
    rewardTitle: string;
  } | null>(null);
  const [showPointsBonusScanner, setShowPointsBonusScanner] = useState(false);

  const handleRedeemClick = (rewardId: string, rewardTitle: string, cost: number) => {
    if (user && user.points >= cost) {
      setSwipeModal({
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
    if (!swipeModal) return;

    try {
      const res = await api.redeemReward(swipeModal.rewardId, swipeModal.pointsCost);
      const redemption = res?.redemption || res?.data?.redemption;
      
      if (redemption?.qrToken) {
        setActiveRedemption({
          qrToken: redemption.qrToken,
          redemptionId: redemption.id,
          rewardTitle: swipeModal.rewardTitle,
        });
        setSwipeModal(null);
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
      setSwipeModal(null);
    }
  };

  const handleCancelRedeem = () => {
    setSwipeModal(null);
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
      {/* Only show scanner button for guests (not employees or administrators) */}
      {user && (user.role === 'guest' || user.role === 'stakeholder') && (
        <button
          className="rewards-scan-bonus-button"
          onClick={() => setShowPointsBonusScanner(true)}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {t('rewards.scanPointsBonus') || '📷 Scan Points Bonus QR Code'}
        </button>
      )}
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

      {swipeModal && (
        <SwipeToRedeem
          rewardTitle={swipeModal.rewardTitle}
          pointsCost={swipeModal.pointsCost}
          onConfirm={handleConfirmRedeem}
          onCancel={handleCancelRedeem}
        />
      )}

      {showPointsBonusScanner && (
        <PointsBonusScanner
          onClose={() => setShowPointsBonusScanner(false)}
          onSuccess={(pointsAwarded, newBalance) => {
            // Points are already updated via API call
            setShowPointsBonusScanner(false);
          }}
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
