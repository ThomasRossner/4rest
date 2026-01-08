import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import jsQR from 'jsqr';
import '../../pages/Admin/QrScannerPage.css';

type ContestCreatorProps = {
  onSuccess?: (contestId: string) => void;
  onClose?: () => void;
};

export function ContestCreator({ onSuccess, onClose }: ContestCreatorProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState('');
  const [rewardFirst, setRewardFirst] = useState('');
  const [rewardSecond, setRewardSecond] = useState('');
  const [rewardThird, setRewardThird] = useState('');

  const isEmployee = user?.role === 'employee' || user?.role === 'administrator';

  useEffect(() => {
    if (showForm) return; // Don't start scanning if form is shown

    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const startScanning = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isHttp && !isLocalhost) {
            setError(t('contests.scanner.cameraRequiresHttps') || 'Camera access requires HTTPS');
          } else {
            setError(t('contests.scanner.cameraNotSupported') || 'Camera not supported');
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
          if (videoRef.current && canvasRef.current && !isCreating) {
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
        setError(err.message || t('contests.scanner.cameraError') || 'Failed to access camera');
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
  }, [t, isCreating, showForm]);

  const handleQrCodeDetected = async (qrData: string) => {
    if (lastScanned === qrData || isCreating) {
      return;
    }

    setLastScanned(qrData);

    try {
      // Scan the QR code to get the user ID
      const scanResult = await api.scanUserQrCode(qrData);
      if (!scanResult.userId) {
        throw new Error('Invalid QR code');
      }

      setScannedUserId(scanResult.userId);
      setShowForm(true);
      setIsScanning(false);
      
      // Stop camera
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('contests.scan.error') || 'Failed to scan QR code';
      showToast({
        type: 'error',
        title: t('contests.scan.errorTitle') || 'Error',
        message: errorMessage,
      });
      setTimeout(() => {
        setLastScanned(null);
      }, 2000);
    }
  };

  const handleCreateContest = async () => {
    if (!scannedUserId || !endDate) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.missingFields') || 'Please fill in all required fields',
      });
      return;
    }

    const endDateObj = new Date(endDate);
    if (endDateObj <= new Date()) {
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: t('contests.create.invalidEndDate') || 'End date must be in the future',
      });
      return;
    }

    setIsCreating(true);

    try {
      const rewards = isEmployee && (rewardFirst || rewardSecond || rewardThird)
        ? {
            reward_first_place: rewardFirst ? parseInt(rewardFirst, 10) : undefined,
            reward_second_place: rewardSecond ? parseInt(rewardSecond, 10) : undefined,
            reward_third_place: rewardThird ? parseInt(rewardThird, 10) : undefined,
          }
        : undefined;

      const contest = await api.createContest(scannedUserId, endDate, rewards);
      
      showToast({
        type: 'success',
        title: t('contests.create.success') || 'Contest created',
        message: t('contests.create.successMessage') || 'Contest created successfully',
      });

      onSuccess?.(contest.id);
      onClose?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('contests.create.error') || 'Failed to create contest';
      showToast({
        type: 'error',
        title: t('contests.create.errorTitle') || 'Error',
        message: errorMessage,
      });
      setIsCreating(false);
    }
  };

  if (showForm) {
    // Calculate minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
      <div className="contest-creator-form">
        <div className="contest-creator-header">
          <h2>{t('contests.create.formTitle') || 'Contest Details'}</h2>
          {onClose && (
            <button
              type="button"
              className="admin-icon-button"
              onClick={onClose}
              title={t('common.actions.close') || 'Close'}
            >
              ✕
            </button>
          )}
        </div>

        <div className="contest-form-field">
          <label>
            {t('contests.create.endDate') || 'End Date'} *
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minDate}
              required
            />
          </label>
        </div>

        {isEmployee && (
          <>
            <h3>{t('contests.create.rewardsTitle') || 'Rewards (Optional)'}</h3>
            <div className="contest-form-field">
              <label>
                {t('contests.create.rewardFirst') || 'Points for 1st Place'}
                <input
                  type="number"
                  value={rewardFirst}
                  onChange={(e) => setRewardFirst(e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </label>
            </div>
            <div className="contest-form-field">
              <label>
                {t('contests.create.rewardSecond') || 'Points for 2nd Place'}
                <input
                  type="number"
                  value={rewardSecond}
                  onChange={(e) => setRewardSecond(e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </label>
            </div>
            <div className="contest-form-field">
              <label>
                {t('contests.create.rewardThird') || 'Points for 3rd Place'}
                <input
                  type="number"
                  value={rewardThird}
                  onChange={(e) => setRewardThird(e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </label>
            </div>
          </>
        )}

        <div className="contest-form-actions">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setScannedUserId(null);
              setEndDate('');
              setRewardFirst('');
              setRewardSecond('');
              setRewardThird('');
            }}
            disabled={isCreating}
          >
            {t('common.actions.back') || 'Back'}
          </button>
          <button
            type="button"
            onClick={handleCreateContest}
            disabled={isCreating || !endDate}
          >
            {isCreating ? (t('contests.create.creating') || 'Creating...') : (t('contests.create.createButton') || 'Create Contest')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-header">
        <h1 className="qr-scanner-title">{t('contests.create.title') || 'Create Contest'}</h1>
        {onClose && (
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            title={t('common.actions.close') || 'Close'}
          >
            ✕
          </button>
        )}
      </div>
      <p className="qr-scanner-subtitle">{t('contests.create.subtitle') || 'Scan another user\'s QR code to create a contest'}</p>
      
      {error && <div className="qr-scanner-error">{error}</div>}
      
      <div className="qr-scanner-video-container">
        <video ref={videoRef} className="qr-scanner-video" playsInline muted />
        <canvas ref={canvasRef} className="qr-scanner-canvas" />
      </div>
    </div>
  );
}

