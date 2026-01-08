import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { QrVerificationSuccessModal } from './QrVerificationSuccessModal';
import './QrCodeDisplay.css';

type QrCodeDisplayProps = {
  qrToken: string;
  redemptionId: string;
  rewardTitle: string;
  onStatusUpdate?: (status: 'pending' | 'used' | 'expired') => void;
  onClose?: () => void;
};

export function QrCodeDisplay({ qrToken, redemptionId, rewardTitle, onStatusUpdate, onClose }: QrCodeDisplayProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'pending' | 'used' | 'expired'>('pending');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Listen for WebSocket updates
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'reward:redemption:update' && data.redemptionId === redemptionId) {
          setStatus(data.status);
          if (data.status === 'used') {
            setIsConfirmed(true);
            setShowSuccessModal(true);
            if (data.points !== undefined) {
              const store = useAuthStore.getState();
              const currentUser = store.user;
              if (currentUser) {
                store.setUser({ ...currentUser, points: data.points });
              }
            }
            onStatusUpdate?.(data.status);
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    // Create WebSocket connection for redemption updates
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
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_WS_URL;
      if (apiUrl) {
        try {
          const url = new URL(apiUrl);
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

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let wsConnected = false;

    const checkStatus = async () => {
      if (status !== 'pending') return;
      
      try {
        const { api } = await import('../../services/api');
        const redemptionStatus = await api.getRedemptionStatus(qrToken);
        if (redemptionStatus && redemptionStatus.status !== status) {
          setStatus(redemptionStatus.status);
          if (redemptionStatus.status === 'used') {
            setIsConfirmed(true);
            setShowSuccessModal(true);
            if (redemptionStatus.points !== undefined) {
              const store = useAuthStore.getState();
              const currentUser = store.user;
              if (currentUser) {
                store.setUser({ ...currentUser, points: redemptionStatus.points });
              }
            }
            onStatusUpdate?.(redemptionStatus.status);
          }
        }
      } catch (error) {
        // Ignore polling errors
      }
    };

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          wsConnected = true;
        };
        ws.onmessage = handleMessage;
        ws.onerror = () => {
          wsConnected = false;
          // Error handled by onclose
        };
        ws.onclose = () => {
          ws = null;
          wsConnected = false;
          // Attempt to reconnect after a delay
          reconnectTimer = setTimeout(() => {
            connect();
          }, 5000);
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
      if (status === 'pending') {
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
      if (ws) {
        ws.close();
      }
    };
  }, [redemptionId, qrToken, status, onStatusUpdate]);

  return (
    <>
      {isConfirmed ? (
        <div className="qr-code-display confirmed">
          <div className="qr-code-confirmed-icon">✓</div>
          <h3 className="qr-code-confirmed-title">{t('rewards.qr.confirmed')}</h3>
          <p className="qr-code-confirmed-message">{t('rewards.qr.confirmedMessage')}</p>
        </div>
      ) : (
        <div className="qr-code-display">
          <h3 className="qr-code-title">{t('rewards.qr.title', { title: rewardTitle })}</h3>
          <p className="qr-code-instruction">{t('rewards.qr.instruction')}</p>
          <div className="qr-code-container">
            <QRCodeSVG value={qrToken} size={256} level="M" includeMargin />
          </div>
          <p className="qr-code-status">{t('rewards.qr.status', { status: t(`rewards.qr.statuses.${status}`) })}</p>
          <p className="qr-code-warning">{t('rewards.qr.warning')}</p>
        </div>
      )}

      <QrVerificationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Close the entire QR code display after user acknowledges
          if (onClose) {
            setTimeout(() => {
              onClose();
            }, 300);
          }
        }}
        rewardTitle={rewardTitle}
        isAdmin={false}
      />
    </>
  );
}

