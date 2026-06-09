import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SwipeToRedeem } from './SwipeToRedeem';
import './RewardCard.css';

type Reward = {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  rewardType?: 'discount' | 'benefit' | 'team_event' | string;
  voucherCode?: string | null;
  active?: boolean;
  thumbnail_url?: string;
  location?: {
    id: string;
    name: string;
    category?: string | null;
    category_description?: string | null;
  } | null;
};

type RedemptionState = {
  qrToken: string;
  qrCodeValue?: string;
  voucherCode?: string | null;
  status?: 'pending' | 'used' | 'expired';
  redemptionId: string;
};

type RewardCardProps = {
  reward: Reward;
  /** Eigenes Punktekonto */
  userPoints: number;
  /** Team-Summe; null wenn keine Team-Mitgliedschaft */
  teamTotalPoints: number | null;
  canAfford: boolean;
  onRedeem: (
    id: string,
    cost: number,
    useTeamPoints: boolean
  ) => Promise<{ redemption: { id: string; qrToken: string; qrCodeValue?: string; voucherCode?: string | null; status?: 'pending' | 'used' | 'expired' } }>;
  onRedemptionCreated?: (redemption: RedemptionState & { rewardTitle: string }) => void;
  hasActiveRedemption?: boolean;
};

export function RewardCard({
  reward,
  userPoints,
  teamTotalPoints,
  canAfford,
  onRedeem,
  onRedemptionCreated,
  hasActiveRedemption = false,
}: RewardCardProps) {
  const { t } = useTranslation();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const cost = reward.pointsCost;
  const canRedeemPersonal = userPoints >= cost;
  const canRedeemTeam = teamTotalPoints !== null && teamTotalPoints >= cost;
  const showRedeemButtons = canAfford && (canRedeemPersonal || canRedeemTeam);

  const badgeClass =
    reward.rewardType === 'discount'
      ? 'reward-type-badge--discount'
      : reward.rewardType === 'benefit'
        ? 'reward-type-badge--benefit'
        : reward.rewardType === 'team_event'
          ? 'reward-type-badge--team_event'
          : 'reward-type-badge--default';

  const handleRedeem = async (useTeamPoints: boolean) => {
    if (isRedeeming || hasActiveRedemption) return;
    if (useTeamPoints && !canRedeemTeam) return;
    if (!useTeamPoints && !canRedeemPersonal) return;

    setIsRedeeming(true);
    try {
      const res = await onRedeem(reward.id, cost, useTeamPoints);
      const redemptionData = res?.redemption;

      if (redemptionData?.qrToken) {
        onRedemptionCreated?.({
          qrToken: redemptionData.qrToken,
          qrCodeValue: redemptionData.qrCodeValue,
          voucherCode: redemptionData.voucherCode ?? null,
          status: redemptionData.status,
          redemptionId: redemptionData.id,
          rewardTitle: reward.title,
        });
      } else {
        throw new Error('No QR token received');
      }
    } catch (error: unknown) {
      console.error('Failed to redeem reward:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div
      className="reward-card"
      style={{
        opacity: canAfford ? 1 : 0.75,
        position: 'relative',
      }}
    >
      <>
        <div className="reward-icon" aria-hidden>
          {reward.thumbnail_url ? (
            <img src={reward.thumbnail_url} alt={reward.title} className="reward-icon-image" />
          ) : reward.rewardType === 'discount' ? (
            '🏷️'
          ) : reward.rewardType === 'benefit' ? (
            '✨'
          ) : reward.rewardType === 'team_event' ? (
            '🤝'
          ) : (
            '🎁'
          )}
        </div>
        <div className="reward-title-row">
          <h3 className="reward-title">{reward.title}</h3>
          {reward.rewardType && (
            <span className={`reward-type-badge ${badgeClass}`}>
              {reward.rewardType}
            </span>
          )}
        </div>
        {reward.description && <p className="reward-description">{reward.description}</p>}
        {reward.location?.category && (
          <span className="reward-location-tag">
            {reward.location.category === 'online' && '🌐 Online'}
            {reward.location.category === 'hotel_reception' && '🏨 Hotel Reception'}
            {reward.location.category === 'hotel_restaurant' && '🍽️ Hotel Restaurant'}
            {reward.location.category === 'external' && '📍 External'}
            {reward.location.category === 'physical' && '📍 Physical Location'}
            {reward.location.category_description && ` - ${reward.location.category_description}`}
          </span>
        )}
        {showRedeemButtons ? (
          <div className={`reward-footer reward-footer--buttons`}>
            <div className="reward-redeem-buttons">
              {canRedeemPersonal && !hasActiveRedemption && (
                <SwipeToRedeem
                  rewardTitle={reward.title}
                  pointsCost={cost}
                  inline
                  compact
                  label={t('rewards.card.swipeRedeemPersonal', { count: cost })}
                  onConfirm={() => handleRedeem(false)}
                />
              )}
              {canRedeemTeam && !hasActiveRedemption && (
                <SwipeToRedeem
                  rewardTitle={reward.title}
                  pointsCost={cost}
                  inline
                  compact
                  label={t('rewards.card.swipeRedeemTeam', { count: cost })}
                  onConfirm={() => handleRedeem(true)}
                />
              )}
              {hasActiveRedemption && (
                <p className="reward-redeem-blocked">{t('rewards.card.singleQrOpen')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="reward-footer">
            <span className="reward-cost">{t('rewards.card.cost', { count: cost })}</span>
          </div>
        )}
      </>
    </div>
  );
}
