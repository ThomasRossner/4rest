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
  canAfford: boolean;
  onRedeem: (id: string, cost: number) => Promise<{ redemption: { id: string; qrToken: string } }>;
};

export function RewardCard({ reward, canAfford, onRedeem }: RewardCardProps) {
  const { t } = useTranslation();
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [redemption, setRedemption] = useState<RedemptionState | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  const SWIPE_THRESHOLD = 0.8; // 80% of width

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
      // Fallback: try to derive from VITE_API_URL or use environment variable
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
      // Last resort: use window location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = import.meta.env.VITE_BACKEND_PORT || '5001';
      return `${protocol}//${host}:${port}/ws`;
    })();

    let reconnectTimer: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let wsConnected = false;

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
      } catch (error) {
        // Ignore polling errors
      }
    };

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          wsConnected = true;
        };

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
          } catch (error) {
            // Ignore parsing errors
          }
        };

        ws.onerror = () => {
          wsConnected = false;
          // Error handled by onclose
        };

        ws.onclose = () => {
          wsRef.current = null;
          wsConnected = false;
          if (redemption && redemption.status === 'pending') {
            reconnectTimer = setTimeout(() => {
              connect();
            }, 5000);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        wsConnected = false;
        reconnectTimer = setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    connect();

    // Start polling as fallback (every 3 seconds)
    // Polling runs regardless of WebSocket status to ensure status updates
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

  const handleStart = (clientX: number) => {
    if (isConfirmed || isRedeeming || redemption || !canAfford) return;
    setIsSwiping(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isSwiping || isConfirmed || redemption || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const deltaX = clientX - startXRef.current;

    // Only allow swiping to the right (positive deltaX)
    if (deltaX < 0) {
      setSwipeProgress(0);
      return;
    }

    const progress = Math.min(deltaX / containerWidth, 1);
    setSwipeProgress(progress);

    // Auto-confirm if threshold reached
    if (progress >= SWIPE_THRESHOLD) {
      setIsConfirmed(true);
      setIsSwiping(false);
      handleConfirmRedeem();
    }
  };

  const handleEnd = () => {
    if (isConfirmed || redemption) return;

    // If not reached threshold, reset
    if (swipeProgress < SWIPE_THRESHOLD) {
      setSwipeProgress(0);
    }
    setIsSwiping(false);
  };

  const handleConfirmRedeem = async () => {
    if (isRedeeming || redemption) return;

    setIsRedeeming(true);
    try {
      const res = await onRedeem(reward.id, reward.pointsCost);
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
    } catch (error: any) {
      console.error('Failed to redeem reward:', error);
      setIsConfirmed(false);
      setSwipeProgress(0);
    } finally {
      setIsRedeeming(false);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSwiping) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Global mouse events for drag outside component
  useEffect(() => {
    if (isSwiping) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX);
      };
      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isSwiping]);

  const progressPercentage = Math.min(swipeProgress * 100, 100);
  const isRedeemed = redemption?.status === 'used';
  const showQrCode = redemption && redemption.status === 'pending';
  const showSlider = !redemption && canAfford;

  return (
    <div 
      className="reward-card" 
      style={{ 
        opacity: isRedeemed ? 0.5 : (canAfford ? 1 : 0.75),
        position: 'relative',
      }}
    >
      {showQrCode ? (
        // Show QR Code
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
        // Show normal reward card
        <>
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
            {showSlider ? (
              <div
                ref={containerRef}
                className="reward-swipe-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleEnd}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  overflow: 'hidden',
                  cursor: isRedeeming ? 'wait' : 'grab',
                  userSelect: 'none',
                }}
              >
                <div
                  className="reward-swipe-slider"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '48px',
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translateX(${progressPercentage}%)`,
                    transition: isSwiping ? 'none' : 'transform 0.1s ease-out',
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
                    {isConfirmed || isRedeeming ? '✓' : '→'}
                  </span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    transition: isSwiping ? 'none' : 'width 0.1s ease-out',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#1f2937',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    pointerEvents: 'none',
                  }}
                >
                  {isRedeeming
                    ? t('rewards.swipe.redeeming') || 'Wird eingelöst...'
                    : progressPercentage >= SWIPE_THRESHOLD * 100
                    ? t('rewards.swipe.releasing') || 'Loslassen zum Bestätigen'
                    : t('rewards.swipe.swipe') || 'Wischen zum Einlösen'}
                </div>
              </div>
            ) : (
              <button
                className="reward-button"
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
