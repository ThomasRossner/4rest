import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { RewardCard } from '../../components/Rewards/RewardCard';
import { pushToast } from '../../components/Toaster/Toaster';
import './RewardsPage.css';

function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const points = useAuthStore((s) => s.user?.points || 0);
  const { data: rewards, isLoading, isError } = useQuery('rewards', () => api.getRewards());
  const [typeFilter, setTypeFilter] = useState<'all' | 'discount' | 'benefit' | 'team_event'>('all');
  const { t } = useTranslation();

  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (user && user.points >= cost) {
      try {
        const res = await api.redeemReward(rewardId, cost);
        const receipt = res?.data || res;
        setLastReceipt(receipt || null);
        const successMessage = t('rewards.messages.redeemSuccess');
        if (import.meta.env.VITE_UI_POLISH) {
          pushToast({ type: 'success', message: successMessage });
        } else {
          alert(successMessage);
        }
      } catch (error) {
        const errorMessage = t('rewards.messages.redeemError');
        if (import.meta.env.VITE_UI_POLISH) {
          pushToast({ type: 'error', message: errorMessage });
        } else {
          alert(errorMessage);
        }
      }
    } else {
      const infoMessage = t('rewards.messages.notEnoughPoints');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'info', message: infoMessage });
      } else {
        alert(infoMessage);
      }
    }
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

      {uiPolish && lastReceipt && (
        <div className="rewards-receipt">
          <div className="rewards-receipt-header">
            <span className="rewards-receipt-icon">🎫</span>
            <span className="rewards-receipt-title">{t('rewards.receipt.title')}</span>
          </div>
          <div className="rewards-receipt-content">
            {lastReceipt.voucherCode && (
              <div className="rewards-receipt-field">
                <span className="rewards-receipt-label">{t('rewards.receipt.voucherCode')}:</span>
                <code className="rewards-receipt-code">{String(lastReceipt.voucherCode)}</code>
              </div>
            )}
            {lastReceipt.expiresAt && (
              <div className="rewards-receipt-field">
                <span className="rewards-receipt-label">{t('rewards.receipt.expires')}:</span>
                <span className="rewards-receipt-value">{new Date(lastReceipt.expiresAt).toLocaleString()}</span>
              </div>
            )}
            {lastReceipt.title && (
              <div className="rewards-receipt-field">
                <span className="rewards-receipt-label">{t('rewards.receipt.reward')}:</span>
                <span className="rewards-receipt-value">{lastReceipt.title}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rewards-grid">
        {!isLoading && !isError && filteredRewards.map((reward: any) => (
          uiPolish ? (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={!!user && user.points >= reward.pointsCost}
              onRedeem={handleRedeem}
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
                  onClick={() => handleRedeem(reward.id, reward.pointsCost)}
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
