import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import jsQR from 'jsqr';
import '../../pages/Admin/QrScannerPage.css';
import '../../pages/Admin/AdminPage.css';

type PointsBonusScannerProps = {
  onClose?: () => void;
  onSuccess?: (pointsAwarded: number, newBalance: number) => void;
};

export function PointsBonusScanner({ onClose, onSuccess }: PointsBonusScannerProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    const streamRef = { current: stream };

    const startScanning = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isHttp && !isLocalhost) {
            setError(t('rewards.pointsBonus.cameraRequiresHttps') || 'Camera access requires HTTPS when accessing from another device. Please use HTTPS or access from localhost.');
          } else {
            setError(t('rewards.pointsBonus.cameraNotSupported') || 'Camera access is not supported in this browser. Please use a modern browser with camera support.');
          }
          setIsScanning(false);
          return;
        }

        // Prefer environment camera when available (mobile), fallback to user
        const constraints: MediaStreamConstraints = {
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        // Attach stream to video element
        const attachStream = () => {
          if (videoRef.current && streamRef.current) {
            const video = videoRef.current;
            video.srcObject = streamRef.current;
            
            // Set playsInline for iOS compatibility (both attributes)
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            
            // Handle video ready events
            const handleLoadedMetadata = () => {
              video.play().catch((err) => {
                console.error('[PointsBonusScanner] Error playing video after metadata:', err);
                setError(t('rewards.pointsBonus.cameraError') || 'Failed to start camera');
              });
            };
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            // Try to play immediately
            video.play().catch((err) => {
              console.log('[PointsBonusScanner] Initial play() failed (expected on some browsers), will retry on loadedmetadata:', err);
            });
          }
        };
        
        // Wait for video element to be rendered, then attach
        const waitForVideoElement = () => {
          if (videoRef.current) {
            attachStream();
            setIsScanning(true);
            setError(null);
          } else {
            setTimeout(waitForVideoElement, 100);
          }
        };
        
        // Start attaching after a short delay
        setTimeout(waitForVideoElement, 100);

        const scan = () => {
          if (videoRef.current && canvasRef.current) {
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
        console.error('[PointsBonusScanner] Error accessing camera:', err);
        setIsScanning(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(t('rewards.pointsBonus.cameraPermissionDenied') || 'Camera access was denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError(t('rewards.pointsBonus.cameraNotFound') || 'No camera found. Please ensure a camera is connected.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError(t('rewards.pointsBonus.cameraInUse') || 'Camera is already in use by another application. Please close other applications using the camera.');
        } else {
          setError(err.message || t('rewards.pointsBonus.cameraError') || 'Failed to access camera');
        }
      }
    };

    startScanning();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [t]);

  const handleQrCodeDetected = async (qrData: string) => {
    if (lastScanned === qrData || isRedeeming) {
      return;
    }

    setLastScanned(qrData);
    setIsRedeeming(true);

    try {
      const result = await api.redeemPointsBonusQr(qrData);
      if (result && result.success) {
        showToast({
          type: 'success',
          title: t('rewards.pointsBonus.toast.title'),
          message: t('rewards.pointsBonus.toast.message', {
            points: result.pointsAwarded || 0,
            balance: result.newPointsBalance || 0,
          }),
        });
        // Call onSuccess safely
        try {
          onSuccess?.(result.pointsAwarded || 0, result.newPointsBalance || 0);
        } catch (callbackError) {
          console.warn('Error in onSuccess callback:', callbackError);
        }
        // Close scanner after successful redemption
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        // If result doesn't have success flag, treat as error
        throw new Error(result?.error || 'Invalid response from server');
      }
    } catch (error: any) {
      // Only show error toast if it's not already handled
      const errorMessage = error?.response?.data?.error || error?.message || t('rewards.pointsBonus.redeemError') || 'Failed to redeem QR code';
      showToast({
        type: 'error',
        title: t('rewards.pointsBonus.toast.errorTitle'),
        message: errorMessage,
      });
      // Clear lastScanned on error to allow retry
      setTimeout(() => {
        setLastScanned(null);
        setIsRedeeming(false);
      }, 2000);
    }
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-header">
        <div className="qr-scanner-header-content">
          <h1 className="qr-scanner-title">{t('rewards.pointsBonus.scanTitle') || 'Scan Points Bonus QR Code'}</h1>
          <p className="qr-scanner-subtitle">{t('rewards.pointsBonus.scanSubtitle') || 'Scan a QR code to receive bonus points'}</p>
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
          <p className="qr-scanner-error-hint">{t('rewards.pointsBonus.cameraHint') || 'Please allow camera access to scan QR codes'}</p>
        </div>
      )}

      <div className="qr-scanner-container">
        <video
          ref={videoRef}
          className="qr-scanner-video"
          playsInline
          muted
          autoPlay
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch((err) => {
                console.error('[PointsBonusScanner] Error playing video after metadata:', err);
              });
            }
          }}
          onError={(e) => {
            console.error('[PointsBonusScanner] Video error:', e);
            setError(t('rewards.pointsBonus.cameraError') || 'Failed to start camera');
          }}
        />
        <canvas ref={canvasRef} className="qr-scanner-canvas" />
        {isScanning && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-frame" />
            <p className="qr-scanner-instruction">{t('rewards.pointsBonus.scanInstruction') || 'Point your camera at the QR code'}</p>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="qr-scanner-status">
          <div className="qr-scanner-status-indicator active" />
          <span>{t('rewards.pointsBonus.scanning') || 'Scanning...'}</span>
        </div>
      )}

      {isRedeeming && (
        <div className="qr-scanner-status" style={{ backgroundColor: 'var(--color-primary, #3b82f6)', color: 'white' }}>
          <div className="qr-scanner-status-indicator active" />
          <span>{t('rewards.pointsBonus.redeeming') || 'Redeeming...'}</span>
        </div>
      )}
    </div>
  );
}

