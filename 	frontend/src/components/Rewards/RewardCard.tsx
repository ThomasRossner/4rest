import { useTranslation } from 'react-i18next';

type Reward = {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  rewardType?: 'discount' | 'benefit' | 'team_event' | string;
  voucherCode?: string | null;
  active?: boolean;
  location?: {
    id: string;
    name: string;
    category?: string | null;
    category_description?: string | null;
  } | null;
};

type RewardCardProps = {
  reward: Reward;
  canAfford: boolean;
  onRedeem: (id: string, cost: number) => void;
};

export function RewardCard({ reward, canAfford, onRedeem }: RewardCardProps) {
  const { t } = useTranslation();
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
      {reward.location?.category && (
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            {reward.location.category === 'online' && '🌐 Online'}
            {reward.location.category === 'hotel_reception' && '🏨 Hotel Reception'}
            {reward.location.category === 'hotel_restaurant' && '🍽️ Hotel Restaurant'}
            {reward.location.category === 'external' && '📍 External'}
            {reward.location.category === 'physical' && '📍 Physical Location'}
            {reward.location.category_description && ` - ${reward.location.category_description}`}
          </span>
        </div>
      )}
      <div className="reward-footer">
        <span className="reward-cost">{t('rewards.card.cost', { count: reward.pointsCost })}</span>
        <button
          className="reward-button"
          onClick={() => onRedeem(reward.id, reward.pointsCost)}
          disabled={!canAfford}
        >
          {canAfford ? t('rewards.card.redeem') : t('rewards.card.insufficient')}
        </button>
      </div>
    </div>
  );
}


