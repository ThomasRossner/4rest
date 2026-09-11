import React, { useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, MapPin, Star } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { RewardCard } from '../../components/Rewards/RewardCard';
import { QrCodeDisplay } from '../../components/Rewards/QrCodeDisplay';
import { RewardScanner } from '../../components/Rewards/RewardScanner';
import { pushToast } from '../../components/Toaster/Toaster';
import { UserLocationMap } from '../../components/LocationMap/UserLocationMap';
import { BackArrowIcon } from '../../components/Tasks/BackArrowIcon';
import {
  getOnlineRewards,
  getUniqueRewardPlaces,
  HUB_SCROLL_LIMIT,
  isPhysicalPlaceReward,
  isRewardOnline,
  parseRewardLocation,
  type RewardWithLocation,
} from '../../utils/rewardHubUtils';
import './RewardsPage.css';

type HubReward = {
  id: string;
  title?: string;
  pointsCost?: number;
  rewardType?: string;
  thumbnail_url?: string;
};

function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const points = useAuthStore((s) => s.user?.points || 0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const placeParam = searchParams.get('place');
  const onlineParam = searchParams.get('online') === 'true';
  const mapParam = searchParams.get('map') === 'true';
  const { data: rewards, isLoading, isError } = useQuery('rewards', () => api.getRewards());

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

  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 }
  );

  const [activeRedemption, setActiveRedemption] = useState<{
    qrToken: string;
    qrCodeValue?: string;
    voucherCode?: string | null;
    status?: 'pending' | 'used' | 'expired';
    redemptionId: string;
    rewardTitle: string;
  } | null>(null);
  const [showRewardScanner, setShowRewardScanner] = useState(false);
  const warningShownRef = useRef<string | null>(null);

  const teamTotalPoints = activeTeam?.totalPoints ?? 0;

  const canAffordReward = (reward: { pointsCost: number }) =>
    !!user && (user.points >= reward.pointsCost || (activeTeam && teamTotalPoints >= reward.pointsCost));

  const handleRedeemClick = async (rewardId: string, cost: number, useTeamPoints: boolean = false) => {
    if (!user) {
      throw new Error('User not found');
    }

    const shouldUseTeamPoints = useTeamPoints && activeTeam !== null && activeTeam !== undefined;
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

    if (exceedsPersonalPoints && warningShownRef.current !== rewardId) {
      warningShownRef.current = rewardId;
      const warningMessage = t('rewards.messages.exceedsPersonalPoints', { points: user.points });
      if (!window.confirm(warningMessage)) {
        warningShownRef.current = null;
        throw new Error('Redemption cancelled by user');
      }
    }

    try {
      const res = await api.redeemReward(rewardId, cost, shouldUseTeamPoints);
      if (warningShownRef.current === rewardId) {
        warningShownRef.current = null;
      }
      return res;
    } catch (error: unknown) {
      if (warningShownRef.current === rewardId) {
        warningShownRef.current = null;
      }
      const errorMessage = (error as { message?: string })?.message || t('rewards.messages.redeemError');
      if (import.meta.env.VITE_UI_POLISH) {
        pushToast({ type: 'error', message: errorMessage });
      } else {
        alert(errorMessage);
      }
      throw error;
    }
  };

  const handleQrStatusUpdate = (_status: 'pending' | 'used' | 'expired') => {
    // Status update handled by QrCodeDisplay component
  };

  const hubPlaces = useMemo(() => getUniqueRewardPlaces(rewards as RewardWithLocation[]), [rewards]);

  const hubOnlineRewards = useMemo(() => {
    if (!rewards || !user) return [];
    const online = getOnlineRewards(rewards as RewardWithLocation[]);
    return online
      .filter((r) => user.points >= r.pointsCost || (activeTeam && teamTotalPoints >= r.pointsCost))
      .slice(0, HUB_SCROLL_LIMIT);
  }, [rewards, user, activeTeam, teamTotalPoints]);

  const isMapView = mapParam;

  const isHubView =
    !viewParam && !placeParam && !onlineParam && !mapParam && !activeRedemption;

  const isFilteredListView =
    viewParam === 'places' || !!placeParam || onlineParam;

  const filteredRewards = useMemo(() => {
    if (!rewards) {
      return [];
    }
    let filtered = [...rewards];

    if (placeParam) {
      filtered = filtered.filter((r: RewardWithLocation) => {
        const loc = parseRewardLocation(r);
        return loc?.id === placeParam || r.location_id === placeParam;
      });
    } else if (viewParam === 'places') {
      filtered = filtered.filter((r: RewardWithLocation) => isPhysicalPlaceReward(r));
    }

    if (onlineParam) {
      filtered = filtered.filter((r: RewardWithLocation) => isRewardOnline(r));
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((r: { rewardType?: string }) => r.rewardType === typeFilter);
    }

    return filtered;
  }, [rewards, typeFilter, placeParam, viewParam, onlineParam]);

  const redeemableRewards = useMemo(() => {
    if (!filteredRewards || !user) {
      return [];
    }
    return filteredRewards.filter((r: { pointsCost: number }) => canAffordReward(r));
  }, [filteredRewards, user, activeTeam, teamTotalPoints]);

  const globalLocationRewards = useMemo(() => {
    if (!rewards) return [];
    return rewards.filter((r: RewardWithLocation) => {
      const loc = parseRewardLocation(r);
      if (!loc || loc.is_online) return false;
      return loc.latitude != null && loc.longitude != null;
    });
  }, [rewards]);

  const uiPolish = !!import.meta.env.VITE_UI_POLISH;

  const renderRewardTile = (reward: HubReward) => (
    <Link
      key={reward.id}
      to="/rewards?online=true"
      className="glass-task-tile"
    >
      <span className="glass-task-tile__thumb">
        {reward.thumbnail_url ? (
          <img src={reward.thumbnail_url} alt="" />
        ) : reward.rewardType === 'discount' ? (
          '🏷️'
        ) : reward.rewardType === 'benefit' ? (
          '✨'
        ) : reward.rewardType === 'team_event' ? (
          '🤝'
        ) : (
          '🎁'
        )}
      </span>
      <span className="glass-task-tile__title">{reward.title}</span>
      <span className="glass-points-badge">
        <Star size={10} strokeWidth={2} aria-hidden />
        {t('rewards.card.cost', { count: Number(reward.pointsCost ?? 0) })}
      </span>
    </Link>
  );

  const renderPlaceTile = (place: { id: string; name: string; taskCount: number }) => (
    <Link
      key={place.id}
      to={`/rewards?place=${encodeURIComponent(place.id)}`}
      className="glass-task-tile"
    >
      <span className="glass-task-tile__thumb">
        <MapPin size={22} strokeWidth={2} aria-hidden />
      </span>
      <span className="glass-task-tile__title">{place.name}</span>
      <span className="glass-points-badge">
        {t('rewards.hub.placeRewardCount', { count: place.taskCount })}
      </span>
    </Link>
  );

  const balanceBlock = (
    <div className="rewards-balance rewards-balance--compact">
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
  );

  if (isMapView) {
    const mapRewards = placeParam || viewParam || onlineParam ? redeemableRewards : globalLocationRewards;
    return (
      <div className="rewards-page">
        <div className="rewards-map-header">
          <button
            type="button"
            className="rewards-map-back"
            onClick={() => navigate('/rewards')}
            title={t('common.actions.back')}
          >
            ← {t('common.actions.back')}
          </button>
        </div>
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <UserLocationMap
            variant="rewards"
            height="calc(100vh - 200px)"
            rewards={mapRewards}
            onRewardClick={async (rewardId) => {
              navigate('/rewards');
              if (activeRedemption) {
                pushToast({ type: 'info', message: t('rewards.card.singleQrOpen') });
                return;
              }
              const reward = mapRewards.find((r: { id: string }) => r.id === rewardId);
              if (!reward) return;
              if (canAffordReward(reward)) {
                const useTeamPoints = activeTeam !== null && activeTeam !== undefined;
                const res = await handleRedeemClick(reward.id, reward.pointsCost, useTeamPoints);
                if (res?.redemption?.qrToken) {
                  setActiveRedemption({
                    qrToken: res.redemption.qrToken,
                    qrCodeValue: res.redemption.qrCodeValue,
                    voucherCode: res.redemption.voucherCode ?? null,
                    status: res.redemption.status,
                    redemptionId: res.redemption.id,
                    rewardTitle: reward.title,
                  });
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (activeRedemption) {
    return (
      <div className="rewards-page rewards-page--list">
        <div className="rewards-scroll">
          <QrCodeDisplay
            qrToken={activeRedemption.qrToken}
            qrValue={activeRedemption.qrCodeValue}
            voucherCode={activeRedemption.voucherCode ?? null}
            initialStatus={activeRedemption.status}
            redemptionId={activeRedemption.redemptionId}
            rewardTitle={activeRedemption.rewardTitle}
            onStatusUpdate={handleQrStatusUpdate}
            onClose={() => {
              setActiveRedemption(null);
              queryClient.invalidateQueries(['rewards']);
            }}
          />
        </div>
      </div>
    );
  }

  if (isHubView) {
    const visiblePlaces = hubPlaces.slice(0, HUB_SCROLL_LIMIT);

    return (
      <div className="rewards-page rewards-page--hub rewards-page--hub-sections">
        <div className="rewards-hub-balance">{balanceBlock}</div>

        {user && user.role === 'rezeption' && (
          <button type="button" className="rewards-scan-button rewards-scan-button--hub" onClick={() => setShowRewardScanner(true)}>
            {t('rewards.scanner.button')}
          </button>
        )}

        {isLoading && <LoadingSkeleton lines={4} />}

        {!isLoading && !isError && visiblePlaces.length > 0 && (
          <section className="glass-section rewards-hub-section" aria-labelledby="rewards-hub-places-title">
            <h2 id="rewards-hub-places-title" className="glass-section__title">
              {t('rewards.hub.sections.places')}
            </h2>
            <div className="glass-scroll-row rewards-hub-scroll-row">
              {visiblePlaces.map(renderPlaceTile)}
              <Link to="/rewards?view=places" className="glass-task-tile glass-task-tile--all">
                <MapPin size={22} strokeWidth={2} aria-hidden />
                <span className="glass-task-tile__title">{t('rewards.hub.all')}</span>
              </Link>
            </div>
          </section>
        )}

        {!isLoading && !isError && hubOnlineRewards.length > 0 && (
          <section className="glass-section rewards-hub-section" aria-labelledby="rewards-hub-online-title">
            <h2 id="rewards-hub-online-title" className="glass-section__title">
              {t('rewards.hub.sections.online')}
            </h2>
            <div className="glass-scroll-row rewards-hub-scroll-row">
              {hubOnlineRewards.map(renderRewardTile)}
              <Link to="/rewards?online=true" className="glass-task-tile glass-task-tile--all">
                <Globe size={22} strokeWidth={2} aria-hidden />
                <span className="glass-task-tile__title">{t('rewards.hub.all')}</span>
              </Link>
            </div>
          </section>
        )}

        {!isLoading && !isError && visiblePlaces.length === 0 && hubOnlineRewards.length === 0 && (
          <EmptyState title={t('rewards.empty.title')} description={t('rewards.empty.description')} />
        )}

        {showRewardScanner && (
          <RewardScanner
            onClose={() => setShowRewardScanner(false)}
            onSuccess={() => setShowRewardScanner(false)}
          />
        )}
      </div>
    );
  }

  if (!isFilteredListView) {
    return null;
  }

  const listViewTitle = (() => {
    if (placeParam) {
      const place = hubPlaces.find((p) => p.id === placeParam);
      return place?.name ?? t('rewards.hub.sections.places');
    }
    if (viewParam === 'places') return t('rewards.hub.sections.places');
    if (onlineParam) return t('rewards.hub.sections.online');
    return t('rewards.title');
  })();

  const backToHubLabel = t('rewards.hub.backToHub');

  return (
    <div className="rewards-page rewards-page--list">
      <div className="rewards-sticky">
        <div className="rewards-list-header">
          <button
            type="button"
            className="rewards-icon-back"
            onClick={() => navigate('/rewards')}
            title={backToHubLabel}
            aria-label={backToHubLabel}
          >
            <BackArrowIcon className="rewards-icon-back-svg" />
          </button>
          <h2 className="rewards-list-title">{listViewTitle}</h2>
          <div className="rewards-list-header-actions">
            <button
              type="button"
              className="location-button"
              onClick={() => navigate('/rewards?map=true')}
              title={t('rewards.showLocation')}
            >
              {t('rewards.locationButton')}
            </button>
          </div>
        </div>

        <div className="rewards-toolbar-row">
          {balanceBlock}
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
          {!isLoading &&
            !isError &&
            filteredRewards.map((reward: HubReward & { pointsCost: number }) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={user?.points ?? 0}
                teamTotalPoints={activeTeam != null ? activeTeam.totalPoints ?? 0 : null}
                canAfford={canAffordReward(reward)}
                onRedeem={(id, cost, useTeamPoints) => handleRedeemClick(id, cost, useTeamPoints)}
                hasActiveRedemption={Boolean(activeRedemption)}
                onRedemptionCreated={(redemption) =>
                  setActiveRedemption({
                    qrToken: redemption.qrToken,
                    qrCodeValue: redemption.qrCodeValue,
                    voucherCode: redemption.voucherCode ?? null,
                    status: redemption.status,
                    redemptionId: redemption.redemptionId,
                    rewardTitle: redemption.rewardTitle,
                  })
                }
              />
            ))}
        </div>
      </div>

      {showRewardScanner && (
        <RewardScanner
          onClose={() => setShowRewardScanner(false)}
          onSuccess={() => setShowRewardScanner(false)}
        />
      )}
    </div>
  );
}

export default RewardsPage;
