import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { pushToast } from '../../components/Toaster/Toaster';
import { QrVerificationSuccessModal } from '../../components/Rewards/QrVerificationSuccessModal';
import './QrScannerPage.css';

type QrScannerPageProps = {
  onBack?: () => void;
};

function QrScannerPage({ onBack }: QrScannerPageProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    userName?: string;
    rewardTitle?: string;
  }>({ isOpen: false });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    let jsQR: any = null;
    const streamRef = { current: stream };

    const startScanning = async () => {
      try {
        // Dynamically import jsQR
        const jsQRModule = await import('jsqr');
        jsQR = jsQRModule.default;

        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isHttp && !isLocalhost) {
            setError(t('admin.qrScanner.cameraRequiresHttps') || 'Camera access requires HTTPS when accessing from another device. Please use HTTPS or access from localhost.');
          } else {
            setError(t('admin.qrScanner.cameraNotSupported') || 'Camera access is not supported in this browser. Please use a modern browser with camera support.');
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
                console.error('[QrScannerPage] Error playing video after metadata:', err);
                setError(t('admin.qrScanner.cameraError') || 'Failed to start camera');
              });
            };
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            // Try to play immediately
            video.play().catch((err) => {
              console.log('[QrScannerPage] Initial play() failed (expected on some browsers), will retry on loadedmetadata:', err);
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

        // Start scanning loop
        const scan = () => {
          if (videoRef.current && canvasRef.current && jsQR) {
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
                // Found a QR code
                handleQrCodeDetected(code.data);
              }
            }
          }
          animationFrameId = requestAnimationFrame(scan);
        };

        scan();
      } catch (err: any) {
        console.error('[QrScannerPage] Error accessing camera:', err);
        setIsScanning(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(t('admin.qrScanner.cameraPermissionDenied') || 'Camera access was denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError(t('admin.qrScanner.cameraNotFound') || 'No camera found. Please ensure a camera is connected.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError(t('admin.qrScanner.cameraInUse') || 'Camera is already in use by another application. Please close other applications using the camera.');
        } else {
          setError(err.message || t('admin.qrScanner.cameraError') || 'Failed to access camera');
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
    // Prevent duplicate scans
    if (lastScanned === qrData) {
      return;
    }

    setLastScanned(qrData);

    try {
      const result = await api.verifyQrCode(qrData);
      if (result.success) {
        // Show success modal
        setSuccessModal({
          isOpen: true,
          userName: result.user?.name || result.user?.id || 'User',
          rewardTitle: result.reward?.title || result.rewardTitle,
        });
        // Clear lastScanned after a delay to allow re-scanning
        setTimeout(() => {
          setLastScanned(null);
        }, 3000);
      }
    } catch (error: any) {
      pushToast({
        type: 'error',
        message: error?.response?.data?.error || error?.message || t('admin.qrScanner.verificationError'),
      });
      // Clear lastScanned on error to allow retry
      setTimeout(() => {
        setLastScanned(null);
      }, 2000);
    }
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-header">
        <div className="qr-scanner-header-content">
          <h1 className="qr-scanner-title">{t('admin.qrScanner.title')}</h1>
          <p className="qr-scanner-subtitle">{t('admin.qrScanner.subtitle')}</p>
        </div>
        {onBack && (
          <button
            type="button"
            className="admin-icon-button"
            onClick={onBack}
            title={t('admin.qrScanner.backToMain')}
          >
            <svg
              className="admin-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="sr-only">{t('admin.qrScanner.backToMain')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="qr-scanner-error">
          <p>{error}</p>
          <p className="qr-scanner-error-hint">{t('admin.qrScanner.cameraHint')}</p>
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
                console.error('[QrScannerPage] Error playing video after metadata:', err);
              });
            }
          }}
          onError={(e) => {
            console.error('[QrScannerPage] Video error:', e);
            setError(t('admin.qrScanner.cameraError') || 'Failed to start camera');
          }}
        />
        <canvas ref={canvasRef} className="qr-scanner-canvas" />
        {isScanning && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-frame" />
            <p className="qr-scanner-instruction">{t('admin.qrScanner.instruction')}</p>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="qr-scanner-status">
          <div className="qr-scanner-status-indicator active" />
          <span>{t('admin.qrScanner.scanning')}</span>
        </div>
      )}

      <QrVerificationSuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false })}
        userName={successModal.userName}
        rewardTitle={successModal.rewardTitle}
        isAdmin={true}
      />
    </div>
  );
}

export default QrScannerPage;

