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

    const startScanning = async () => {
      try {
        // Dynamically import jsQR
        const jsQRModule = await import('jsqr');
        jsQR = jsQRModule.default;

        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Use back camera on mobile
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsScanning(true);
          setError(null);
        }

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
        console.error('Error accessing camera:', err);
        setError(err.message || t('admin.qrScanner.cameraError'));
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
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
            className="qr-scanner-back-button"
            onClick={onBack}
            title={t('admin.qrScanner.backToMain')}
          >
            ← {t('admin.qrScanner.backToMain')}
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

