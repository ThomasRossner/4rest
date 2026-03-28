import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../../stores/authStore';
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
  redemptionId: string;
  status: 'pending' | 'used' | 'expired';
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
  ) => Promise<{ redemption: { id: string; qrToken: string } }>;
};

export function RewardCard({
  reward,
  userPoints,
  teamTotalPoints,
  canAfford,
  onRedeem,
}: RewardCardProps) {
  const { t } = useTranslation();
  const [redemption, setRedemption] = useState<RedemptionState | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const cost = reward.pointsCost;
  const canRedeemPersonal = userPoints >= cost;
  const canRedeemTeam = teamTotalPoints !== null && teamTotalPoints >= cost;
  const showRedeemButtons =
    !redemption && canAfford && (canRedeemPersonal || canRedeemTeam);

  const badgeColor =
    reward.rewardType === 'discount'
      ? '#0ea5e9'
      : reward.rewardType === 'benefit'
        ? '#10b981'
        : reward.rewardType === 'team_event'
          ? '#f59e0b'
          : '#9ca3af';

  // WebSocket connection for redemption status updates
  useEffect(() => {
    if (!redemption) return;

    const wsUrl = (() => {
      const explicit = import.meta.env.VITE_WS_URL as string | undefined;
      if (explicit) return explicit;
      const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
      if (apiUrl) {
        try {
          const url = new URL(apiUrl, window.location.origin);
          url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
          url.pathname = '/ws';
          return url.toString();
        } catch {
          // fallback
        }
      }
      const fallbackApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_WS_URL;
      if (fallbackApiUrl) {
        try {
          const url = new URL(fallbackApiUrl);
          url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
          url.pathname = '/ws';
          return url.toString();
        } catch {
          // fallback
        }
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = import.meta.env.VITE_BACKEND_PORT || '5001';
      return `${protocol}//${host}:${port}/ws`;
    })();

    let reconnectTimer: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      if (!redemption || redemption.status !== 'pending') return;

      try {
        const { api } = await import('../../services/api');
        const status = await api.getRedemptionStatus(redemption.qrToken);
        if (status && status.status !== redemption.status) {
          setRedemption((prev) => {
            if (!prev) return null;
            return { ...prev, status: status.status };
          });
          if (status.status === 'used' && status.points !== undefined) {
            const store = useAuthStore.getState();
            const currentUser = store.user;
            if (currentUser) {
              store.setUser({ ...currentUser, points: status.points });
            }
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {};

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.type === 'reward:redemption:update' && data.redemptionId === redemption.redemptionId) {
              setRedemption((prev) => {
                if (!prev) return null;
                return { ...prev, status: data.status };
              });
              if (data.status === 'used' && data.points !== undefined) {
                const store = useAuthStore.getState();
                const currentUser = store.user;
                if (currentUser) {
                  store.setUser({ ...currentUser, points: data.points });
                }
              }
            }
          } catch {
            // Ignore parsing errors
          }
        };

        ws.onerror = () => {};

        ws.onclose = () => {
          wsRef.current = null;
          if (redemption && redemption.status === 'pending') {
            reconnectTimer = setTimeout(() => {
              connect();
            }, 5000);
          }
        };
      } catch {
        reconnectTimer = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    connect();

    pollingInterval = setInterval(() => {
      if (redemption && redemption.status === 'pending') {
        checkStatus();
      }
    }, 3000);

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [redemption?.redemptionId, redemption?.qrToken, redemption?.status]);

  const handleRedeem = async (useTeamPoints: boolean) => {
    if (isRedeeming || redemption) return;
    if (useTeamPoints && !canRedeemTeam) return;
    if (!useTeamPoints && !canRedeemPersonal) return;

    setIsRedeeming(true);
    try {
      const res = await onRedeem(reward.id, cost, useTeamPoints);
      const redemptionData = res?.redemption;

      if (redemptionData?.qrToken) {
        setRedemption({
          qrToken: redemptionData.qrToken,
          redemptionId: redemptionData.id,
          status: 'pending',
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

  const isRedeemed = redemption?.status === 'used';
  const showQrCode = redemption && redemption.status === 'pending';

  return (
    <div
      className="reward-card"
      style={{
        opacity: isRedeemed ? 0.5 : canAfford ? 1 : 0.75,
        position: 'relative',
      }}
    >
      {showQrCode ? (
        <div className="reward-qr-container">
          <h3 className="reward-title">{reward.title}</h3>
          <div className="reward-qr-code">
            <QRCodeSVG value={redemption.qrToken} size={200} level="M" includeMargin />
          </div>
          <p className="reward-qr-status">
            {t('rewards.qr.status', { status: t(`rewards.qr.statuses.${redemption.status}`) })}
          </p>
        </div>
      ) : (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="reward-title" style={{ marginRight: 8 }}>
              {reward.title}
            </h3>
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
          {reward.description && <p className="reward-description">{reward.description}</p>}
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
          <div
            className={`reward-footer ${showRedeemButtons ? 'reward-footer--buttons' : ''}`}
          >
            {!showRedeemButtons && (
              <span className="reward-cost">{t('rewards.card.cost', { count: cost })}</span>
            )}
            {showRedeemButtons ? (
              <div className="reward-redeem-buttons">
                {canRedeemPersonal && (
                  <button
                    type="button"
                    className="reward-redeem-btn"
                    disabled={isRedeeming}
                    onClick={() => handleRedeem(false)}
                  >
                    {isRedeeming ? t('rewards.card.redeeming') : t('rewards.card.redeemPersonal', { count: cost })}
                  </button>
                )}
                {canRedeemTeam && (
                  <button
                    type="button"
                    className="reward-redeem-btn reward-redeem-btn--team"
                    disabled={isRedeeming}
                    onClick={() => handleRedeem(true)}
                  >
                    {isRedeeming ? t('rewards.card.redeeming') : t('rewards.card.redeemTeam', { count: cost })}
                  </button>
                )}
              </div>
            ) : (
              <button
                className="reward-button"
                type="button"
                disabled={!canAfford}
                style={{ opacity: canAfford ? 1 : 0.5 }}
              >
                {canAfford ? t('rewards.card.redeem') : t('rewards.card.insufficient')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
