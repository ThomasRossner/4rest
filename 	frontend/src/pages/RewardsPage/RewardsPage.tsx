import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
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

  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (user && user.points >= cost) {
      try {
        const res = await api.redeemReward(rewardId, cost);
        const receipt = res?.data || res;
        setLastReceipt(receipt || null);
        if (import.meta.env.VITE_UI_POLISH) {
          pushToast({ type: 'success', message: 'Reward redeemed successfully' });
        } else {
          alert('Reward redeemed successfully!');
        }
      } catch (error) {
        if (import.meta.env.VITE_UI_POLISH) {
          pushToast({ type: 'error', message: 'Failed to redeem reward' });
        } else {
          alert('Failed to redeem reward');
        }
      }
    } else {
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'info', message: 'Not enough points' });
      } else {
        alert('Not enough points!');
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
      <h1 className="rewards-title">Rewards Marketplace</h1>
      <div className="rewards-balance">
        <span className="rewards-balance-label">Your Points:</span>
        <span className="rewards-balance-value">{points}</span>
      </div>
      {uiPolish && (
        <div style={{ display: 'flex', gap: 8, margin: '0 0 16px' }}>
          {(['all', 'discount', 'benefit', 'team_event'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`reward-filter-btn ${typeFilter === t ? 'active' : ''}`}
              aria-pressed={typeFilter === t}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      )}

      {isLoading && <LoadingSkeleton lines={6} />}
      {!isLoading && !isError && filteredRewards.length === 0 && (
        <EmptyState title="No rewards available" description="Please check back later or change the filter." />
      )}

      {uiPolish && lastReceipt && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-sm)',
          padding: '12px 14px',
          margin: '0 0 16px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Redemption receipt</div>
          {lastReceipt.voucherCode && (
            <div style={{ marginBottom: 4 }}>Code: <code>{String(lastReceipt.voucherCode)}</code></div>
          )}
          {lastReceipt.expiresAt && (
            <div style={{ marginBottom: 4 }}>Expires: {new Date(lastReceipt.expiresAt).toLocaleString()}</div>
          )}
          {lastReceipt.title && (
            <div style={{ color: '#666' }}>{lastReceipt.title}</div>
          )}
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
                <span className="reward-cost">{reward.pointsCost} points</span>
                <button
                  className="reward-button"
                  onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                  disabled={!user || user.points < reward.pointsCost}
                >
                  Redeem
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
