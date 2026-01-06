import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import jsQR from 'jsqr';
import { RewardRedemptionDisplay } from './RewardRedemptionDisplay';
import '../../pages/Admin/QrScannerPage.css';
import '../../pages/Admin/AdminPage.css';

type RewardScannerProps = {
  onClose?: () => void;
  onSuccess?: () => void;
};

export function RewardScanner({ onClose, onSuccess }: RewardScannerProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scannedReward, setScannedReward] = useState<any | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const startScanning = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Check if it's a security issue (HTTP from non-localhost)
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isHttp && !isLocalhost) {
            setError(t('rewards.scanner.cameraRequiresHttps') || 'Camera access requires HTTPS when accessing from another device. Please use HTTPS or access from localhost.');
          } else {
            setError(t('rewards.scanner.cameraNotSupported') || 'Camera access is not supported in this browser. Please use a modern browser with camera support.');
          }
          setIsScanning(false);
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsScanning(true);
          setError(null);
        }

        const scan = () => {
          if (videoRef.current && canvasRef.current && !scannedReward) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);

              if (code && code.data) {
                handleQrCodeDetected(code.data);
              }
            }
          }
          animationFrameId = requestAnimationFrame(scan);
        };

        scan();
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setError(err.message || t('rewards.scanner.cameraError') || 'Failed to access camera');
        setIsScanning(false);
      }
    };

    if (!scannedReward) {
      startScanning();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [t, scannedReward]);

  const handleQrCodeDetected = async (qrData: string) => {
    if (lastScanned === qrData || isRedeeming || scannedReward) {
      return;
    }

    setLastScanned(qrData);
    setIsRedeeming(true);

    try {
      // First, get reward information from QR code (without redeeming)
      const result = await api.getRewardInfoFromQr(qrData);
      if (result && result.success && result.redemption) {
        // Show the reward information
        setScannedReward({
          qrToken: qrData,
          redemption: result.redemption,
        });
        setIsRedeeming(false);
      } else {
        throw new Error(result?.error || 'Invalid QR code');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('rewards.scanner.invalidQr') || 'Invalid QR code';
      showToast({
        type: 'error',
        title: t('rewards.scanner.errorTitle') || 'Error',
        message: errorMessage,
      });
      // Clear lastScanned on error to allow retry
      setTimeout(() => {
        setLastScanned(null);
        setIsRedeeming(false);
      }, 2000);
    }
  };

  const handleRedeem = async () => {
    if (!scannedReward || isRedeeming) {
      return;
    }

    setIsRedeeming(true);

    try {
      const result = await api.redeemRewardQrCode(scannedReward.qrToken);
      if (result && result.success) {
        showToast({
          type: 'success',
          title: t('rewards.scanner.redeemSuccess') || 'Belohnung eingelöst',
          message: t('rewards.scanner.redeemMessage', {
            reward: scannedReward.redemption.rewardTitle,
            guest: scannedReward.redemption.userName || scannedReward.redemption.userEmail,
          }) || `Belohnung "${scannedReward.redemption.rewardTitle}" wurde für ${scannedReward.redemption.userName || scannedReward.redemption.userEmail} eingelöst.`,
        });
        // Call onSuccess safely
        try {
          onSuccess?.();
        } catch (callbackError) {
          console.warn('Error in onSuccess callback:', callbackError);
        }
        // Close scanner after successful redemption
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error(result?.error || 'Failed to redeem reward');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('rewards.scanner.redeemError') || 'Failed to redeem reward';
      showToast({
        type: 'error',
        title: t('rewards.scanner.errorTitle') || 'Error',
        message: errorMessage,
      });
      setIsRedeeming(false);
    }
  };

  // If reward is scanned, show the redemption display
  if (scannedReward) {
    return (
      <RewardRedemptionDisplay
        redemption={scannedReward.redemption}
        onRedeem={handleRedeem}
        onCancel={() => {
          setScannedReward(null);
          setLastScanned(null);
        }}
        isRedeeming={isRedeeming}
      />
    );
  }

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-header">
        <div className="qr-scanner-header-content">
          <h1 className="qr-scanner-title">{t('rewards.scanner.title') || 'Belohnung von Gast einlösen'}</h1>
          <p className="qr-scanner-subtitle">{t('rewards.scanner.subtitle') || 'Scannen Sie den QR-Code der Belohnung'}</p>
        </div>
        {onClose && (
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            title={t('common.actions.close') || 'Close'}
          >
            <svg
              className="admin-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="sr-only">{t('common.actions.close') || 'Close'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="qr-scanner-error">
          <p>{error}</p>
          <p className="qr-scanner-error-hint">{t('rewards.scanner.cameraHint') || 'Please allow camera access to scan QR codes'}</p>
        </div>
      )}

      <div className="qr-scanner-container">
        <video
          ref={videoRef}
          className="qr-scanner-video"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="qr-scanner-canvas" />
        {isScanning && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-frame" />
            <p className="qr-scanner-instruction">{t('rewards.scanner.instruction') || 'Point your camera at the QR code'}</p>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="qr-scanner-status">
          <div className="qr-scanner-status-indicator active" />
          <span>{t('rewards.scanner.scanning') || 'Scanning...'}</span>
        </div>
      )}

      {isRedeeming && (
        <div className="qr-scanner-status" style={{ backgroundColor: 'var(--color-primary, #3b82f6)', color: 'white' }}>
          <div className="qr-scanner-status-indicator active" />
          <span>{t('rewards.scanner.verifying') || 'Verifying...'}</span>
        </div>
      )}
    </div>
  );
}

