import React, { useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { RewardCard } from '../../components/Rewards/RewardCard';
import { QrCodeDisplay } from '../../components/Rewards/QrCodeDisplay';
import { RewardScanner } from '../../components/Rewards/RewardScanner';
import { pushToast } from '../../components/Toaster/Toaster';
import { UserLocationMap } from '../../components/LocationMap/UserLocationMap';
import './RewardsPage.css';

function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const points = useAuthStore((s) => s.user?.points || 0);
  const queryClient = useQueryClient();
  const { data: rewards, isLoading, isError } = useQuery('rewards', () => api.getRewards());

  // Listen for WebSocket reward updates
  React.useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'reward:update') {
        queryClient.invalidateQueries(['rewards']);
      }
    };

    window.addEventListener('data:update', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('data:update', handleUpdate as EventListener);
    };
  }, [queryClient]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'discount' | 'benefit' | 'team_event'>('all');
  const { t } = useTranslation();

  // Get active team and total points
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 } // Refetch every 5 seconds to keep team points updated in real-time
  );

  // Keep activeRedemption for backward compatibility (if needed elsewhere)
  const [activeRedemption, setActiveRedemption] = useState<{
    qrToken: string;
    redemptionId: string;
    rewardTitle: string;
  } | null>(null);
  const [showRewardScanner, setShowRewardScanner] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [showOnlineRewards, setShowOnlineRewards] = useState(false);
  const [warningShownForReward, setWarningShownForReward] = useState<string | null>(null);
  const warningShownRef = useRef<string | null>(null);

  const handleRedeemClick = async (rewardId: string, cost: number, useTeamPoints: boolean = false) => {
    if (!user) {
      throw new Error('User not found');
    }

    // Check if using team points
    const shouldUseTeamPoints = useTeamPoints && activeTeam !== null && activeTeam !== undefined;
    const teamTotalPoints = activeTeam?.totalPoints || 0;
    const availablePoints = shouldUseTeamPoints ? teamTotalPoints : user.points;
    const exceedsPersonalPoints = shouldUseTeamPoints && user.points < cost;

    if (availablePoints < cost) {
      const infoMessage = shouldUseTeamPoints 
        ? t('rewards.messages.notEnoughTeamPoints')
        : t('rewards.messages.notEnoughPoints');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'info', message: infoMessage });
      } else {
        alert(infoMessage);
      }
      throw new Error('Insufficient points');
    }

    // Show warning if exceeding personal points (only once per reward)
    // Use ref for synchronous check to prevent duplicate warnings even with parallel calls
    if (exceedsPersonalPoints && warningShownRef.current !== rewardId) {
      warningShownRef.current = rewardId;
      setWarningShownForReward(rewardId);
      const warningMessage = t('rewards.messages.exceedsPersonalPoints', { points: user.points });
      if (!window.confirm(warningMessage)) {
        // Reset flag if user cancels
        warningShownRef.current = null;
        setWarningShownForReward(null);
        throw new Error('Redemption cancelled by user');
      }
    }

    try {
      const res = await api.redeemReward(rewardId, cost, shouldUseTeamPoints);
      // Reset warning flag after successful redemption
      if (warningShownRef.current === rewardId) {
        warningShownRef.current = null;
        setWarningShownForReward(null);
      }
      return res;
    } catch (error: any) {
      // Reset warning flag on error so it can be shown again
      if (warningShownRef.current === rewardId) {
        warningShownRef.current = null;
        setWarningShownForReward(null);
      }
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
    
    // Filter by online status
    if (showOnlineRewards) {
      filtered = filtered.filter((r: any) => {
        if (!r.location) return false;
        const location = typeof r.location === 'string' ? JSON.parse(r.location) : r.location;
        const isOnline = location.is_online === true || location.is_online === 'true' || String(location.is_online).toLowerCase() === 'true';
        return isOnline;
      });
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((r: any) => r.rewardType === typeFilter);
    }
    
    return filtered;
  }, [rewards, typeFilter, showOnlineRewards]);

  // Filter rewards that are redeemable (user has enough points or team has enough)
  const redeemableRewards = useMemo(() => {
    if (!filteredRewards || !user) {
      return [];
    }
    const teamTotalPoints = activeTeam?.totalPoints || 0;
    return filteredRewards.filter((r: any) => {
      // Can redeem if user has enough points OR team has enough points
      return user.points >= r.pointsCost || (activeTeam && teamTotalPoints >= r.pointsCost);
    });
  }, [filteredRewards, user, activeTeam]);

  const uiPolish = !!import.meta.env.VITE_UI_POLISH;

  // Show map view if button was clicked
  if (showLocationMap) {
    return (
      <div className="rewards-page">
        <div className="rewards-map-header">
          <button
            type="button"
            className="rewards-map-back"
            onClick={() => setShowLocationMap(false)}
            title={t('common.actions.back')}
          >
            ← {t('common.actions.back')}
          </button>
        </div>
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <UserLocationMap
            variant="rewards"
            height="calc(100vh - 200px)"
            rewards={redeemableRewards}
            onRewardClick={(rewardId) => {
              setShowLocationMap(false);
              // Find the reward and trigger redeem if user can afford it
              const reward = redeemableRewards.find((r: any) => r.id === rewardId);
              const teamTotalPoints = activeTeam?.totalPoints || 0;
              const canAfford = user && (user.points >= reward.pointsCost || (activeTeam && teamTotalPoints >= reward.pointsCost));
              if (reward && canAfford) {
                // Always use team points if user is in a team
              const useTeamPoints = activeTeam !== null && activeTeam !== undefined;
              handleRedeemClick(reward.id, reward.pointsCost, useTeamPoints);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-page rewards-page--list">
      <div className="rewards-sticky">
        <div className="rewards-balance">
          <span className="rewards-balance-label">{t('rewards.balanceLabel')}:</span>
          <span className="rewards-balance-value">
            {activeTeam?.totalPoints !== undefined ? (
              <>
                {activeTeam.totalPoints} / {points}
              </>
            ) : (
              points
            )}
          </span>
        </div>
        <div className="rewards-header">
          {showOnlineRewards ? (
            <button
              className="location-button"
              onClick={() => {
                setShowLocationMap(false);
                setShowOnlineRewards(false);
              }}
            >
              {t('rewards.prerequisites.clearFilter')}
            </button>
          ) : (
            <div className="rewards-header-location-buttons">
              <button
                className="location-button"
                onClick={() => {
                  setShowLocationMap(true);
                  setShowOnlineRewards(false);
                }}
                title={t('rewards.showLocation')}
              >
                {t('rewards.locationButton')}
              </button>
              <button
                className="location-button"
                onClick={() => {
                  setShowLocationMap(false);
                  setShowOnlineRewards(true);
                }}
                title={t('rewards.showOnline')}
              >
                {t('rewards.onlineButton')}
              </button>
            </div>
          )}
        </div>
        {user && user.role === 'rezeption' && (
          <button type="button" className="rewards-scan-button" onClick={() => setShowRewardScanner(true)}>
            {t('rewards.scanner.button')}
          </button>
        )}
      </div>

      <div className="rewards-scroll">
        {uiPolish && (
          <div className="rewards-filter-container">
            {(['all', 'discount', 'benefit', 'team_event'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
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

        <div className="rewards-grid">
          {!isLoading && !isError && filteredRewards.map((reward: any) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userPoints={user?.points ?? 0}
              teamTotalPoints={activeTeam != null ? activeTeam.totalPoints ?? 0 : null}
              canAfford={!!user && (user.points >= reward.pointsCost || (activeTeam && (activeTeam.totalPoints || 0) >= reward.pointsCost))}
              onRedeem={(id, cost, useTeamPoints) => handleRedeemClick(id, cost, useTeamPoints)}
            />
          ))}
        </div>
      </div>

      {activeRedemption && (
        <QrCodeDisplay
          qrToken={activeRedemption.qrToken}
          redemptionId={activeRedemption.redemptionId}
          rewardTitle={activeRedemption.rewardTitle}
          onStatusUpdate={handleQrStatusUpdate}
          onClose={() => setActiveRedemption(null)}
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
    </div>
  );
}

export default RewardsPage;
