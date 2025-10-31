import React from 'react';

type Reward = {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  rewardType?: 'discount' | 'benefit' | 'team_event' | string;
  voucherCode?: string | null;
  active?: boolean;
};

type RewardCardProps = {
  reward: Reward;
  canAfford: boolean;
  onRedeem: (id: string, cost: number) => void;
};

export function RewardCard({ reward, canAfford, onRedeem }: RewardCardProps) {
  const badgeColor =
    reward.rewardType === 'discount'
      ? '#0ea5e9'
      : reward.rewardType === 'benefit'
      ? '#10b981'
      : reward.rewardType === 'team_event'
      ? '#f59e0b'
      : '#9ca3af';

  return (
    <div className="reward-card" style={{ opacity: canAfford ? 1 : 0.75 }}>
      <div className="reward-icon" aria-hidden>
        {reward.rewardType === 'discount' ? '🏷️' : reward.rewardType === 'benefit' ? '✨' : reward.rewardType === 'team_event' ? '🤝' : '🎁'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="reward-title" style={{ marginRight: 8 }}>{reward.title}</h3>
        {reward.rewardType && (
          <span
            className="reward-type-badge"
            style={{
              background: badgeColor,
              color: 'white',
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: 12,
            }}
          >
            {reward.rewardType}
          </span>
        )}
      </div>
      {reward.description && (
        <p className="reward-description">{reward.description}</p>
      )}
      <div className="reward-footer">
        <span className="reward-cost">{reward.pointsCost} points</span>
        <button
          className="reward-button"
          onClick={() => onRedeem(reward.id, reward.pointsCost)}
          disabled={!canAfford}
        >
          {canAfford ? 'Redeem' : 'Insufficient'}
        </button>
      </div>
    </div>
  );
}


