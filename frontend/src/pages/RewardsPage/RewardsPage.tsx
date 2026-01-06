import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { RewardCard } from '../../components/Rewards/RewardCard';
import { QrCodeDisplay } from '../../components/Rewards/QrCodeDisplay';
import { PointsBonusScanner } from '../../components/Rewards/PointsBonusScanner';
import { RewardScanner } from '../../components/Rewards/RewardScanner';
import { pushToast } from '../../components/Toaster/Toaster';
import { UserLocationMap } from '../../components/LocationMap/UserLocationMap';
import './RewardsPage.css';

function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const points = useAuthStore((s) => s.user?.points || 0);
  const { data: rewards, isLoading, isError } = useQuery('rewards', () => api.getRewards());
  const [typeFilter, setTypeFilter] = useState<'all' | 'discount' | 'benefit' | 'team_event'>('all');
  const { t } = useTranslation();

  // Keep activeRedemption for backward compatibility (if needed elsewhere)
  const [activeRedemption, setActiveRedemption] = useState<{
    qrToken: string;
    redemptionId: string;
    rewardTitle: string;
  } | null>(null);
  const [showPointsBonusScanner, setShowPointsBonusScanner] = useState(false);
  const [showRewardScanner, setShowRewardScanner] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);

  const handleRedeemClick = async (rewardId: string, cost: number) => {
    if (!user || user.points < cost) {
      const infoMessage = t('rewards.messages.notEnoughPoints');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'info', message: infoMessage });
      } else {
        alert(infoMessage);
      }
      throw new Error('Insufficient points');
    }

    try {
      const res = await api.redeemReward(rewardId, cost);
      return res;
    } catch (error: any) {
      const errorMessage = error?.message || t('rewards.messages.redeemError');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'error', message: errorMessage });
      } else {
        alert(errorMessage);
      }
      throw error;
    }
  };

  const handleQrStatusUpdate = (status: 'pending' | 'used' | 'expired') => {
    // Status update handled by QrCodeDisplay component
    // Don't auto-clear - let user close the modal manually
  };

  const filteredRewards = useMemo(() => {
    if (!rewards) {
      return [];
    }
    let filtered = [...rewards];
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.rewardType === typeFilter);
    }
    
    return filtered;
  }, [rewards, typeFilter]);

  // Filter rewards that are redeemable (user has enough points)
  const redeemableRewards = useMemo(() => {
    if (!filteredRewards || !user) {
      return [];
    }
    return filteredRewards.filter((r: any) => {
      return user.points >= r.pointsCost;
    });
  }, [filteredRewards, user]);

  const uiPolish = !!import.meta.env.VITE_UI_POLISH;

  // Show map view if button was clicked
  if (showLocationMap) {
    return (
      <div className="rewards-page">
        <div className="rewards-header">
          <h1 className="rewards-title">{t('rewards.title')}</h1>
          <button
            className="location-button"
            onClick={() => setShowLocationMap(false)}
            title={t('rewards.backToList') || 'Zurück zur Liste'}
          >
            {t('rewards.backToList') || 'Zurück zur Liste'}
          </button>
        </div>
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <UserLocationMap
            height="calc(100vh - 200px)"
            rewards={redeemableRewards}
            onRewardClick={(rewardId) => {
              setShowLocationMap(false);
              // Find the reward and trigger redeem if user can afford it
              const reward = redeemableRewards.find((r: any) => r.id === rewardId);
              if (reward && user && user.points >= reward.pointsCost) {
                handleRedeemClick(reward.id, reward.title, reward.pointsCost);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-page">
      <div className="rewards-header">
        <h1 className="rewards-title">{t('rewards.title')}</h1>
        <button
          className="location-button"
          onClick={() => setShowLocationMap(true)}
          title={t('rewards.showLocation') || 'Hier'}
        >
          {t('rewards.locationButton') || 'Hier'}
        </button>
      </div>
      <div className="rewards-balance">
        <span className="rewards-balance-label">{t('rewards.balanceLabel')}:</span>
        <span className="rewards-balance-value">{points}</span>
      </div>
      {/* Show reward scanner button for employees */}
      {user && user.role === 'employee' && (
        <button
          className="rewards-scan-button"
          onClick={() => setShowRewardScanner(true)}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--color-primary, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          {t('rewards.scanner.button') || 'Belohnung von Gast einlösen'}
        </button>
      )}
      {/* Only show scanner button for guests (not employees or administrators) */}
      {user && (user.role === 'guest' || user.role === 'stakeholder') && (
        <button
          className="rewards-scan-button"
          onClick={() => setShowPointsBonusScanner(true)}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--color-primary, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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

      {/* Keep QrCodeDisplay for backward compatibility if needed */}
      {activeRedemption && (
        <QrCodeDisplay
          qrToken={activeRedemption.qrToken}
          redemptionId={activeRedemption.redemptionId}
          rewardTitle={activeRedemption.rewardTitle}
          onStatusUpdate={handleQrStatusUpdate}
          onClose={() => setActiveRedemption(null)}
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

      {showRewardScanner && (
        <RewardScanner
          onClose={() => setShowRewardScanner(false)}
          onSuccess={() => {
            setShowRewardScanner(false);
          }}
        />
      )}

      <div className="rewards-grid">
        {!isLoading && !isError && filteredRewards.map((reward: any) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            canAfford={!!user && user.points >= reward.pointsCost}
            onRedeem={handleRedeemClick}
          />
        ))}
      </div>
    </div>
  );
}

export default RewardsPage;
