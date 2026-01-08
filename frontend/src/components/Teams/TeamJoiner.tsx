import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import jsQR from 'jsqr';
import '../../pages/Admin/QrScannerPage.css';

type TeamJoinerProps = {
  onSuccess?: () => void;
  onClose?: () => void;
};

export function TeamJoiner({ onSuccess, onClose }: TeamJoinerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const showToast = useToastStore((s) => s.showToast);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const startScanning = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isHttp && !isLocalhost) {
            setError(t('teams.join.cameraRequiresHttps') || 'Camera access requires HTTPS');
          } else {
            setError(t('teams.join.cameraNotSupported') || 'Camera not supported');
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
          if (videoRef.current && canvasRef.current && !isJoining) {
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
        setError(err.message || t('teams.join.cameraError') || 'Failed to access camera');
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
  }, [t, isJoining]);

  const handleQrCodeDetected = async (qrData: string) => {
    if (lastScanned === qrData || isJoining) {
      return;
    }

    setLastScanned(qrData);
    setIsJoining(true);

    try {
      await api.joinTeam(qrData);
      
      // Invalidate all relevant queries to immediately update UI
      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries(['userActiveTeam', userId]),
          queryClient.invalidateQueries(['userTeams', userId]),
          queryClient.invalidateQueries(['userProgress', userId]),
        ]);
      }
      
      // Also invalidate queries without userId (for components that don't use userId in key)
      queryClient.invalidateQueries(['userActiveTeam']);
      queryClient.invalidateQueries(['userTeams']);
      
      // Refetch user data to update points
      try {
        await api.refreshMe();
      } catch (userError) {
        // Silently fail - user data will be updated on next navigation
        console.debug('Failed to refresh user data:', userError);
      }
      
      showToast({
        type: 'success',
        title: t('teams.join.success') || 'Team joined',
        message: t('teams.join.successMessage') || 'Successfully joined team',
      });

      onSuccess?.();
      onClose?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('teams.join.error') || 'Failed to join team';
      showToast({
        type: 'error',
        title: t('teams.join.errorTitle') || 'Error',
        message: errorMessage,
      });
      setTimeout(() => {
        setLastScanned(null);
        setIsJoining(false);
      }, 2000);
    }
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-header">
        <h1 className="qr-scanner-title">{t('teams.join.title') || 'Join Team'}</h1>
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
      <p className="qr-scanner-subtitle">{t('teams.join.subtitle') || 'Scan a team QR code to join'}</p>
      
      {error && <div className="qr-scanner-error">{error}</div>}
      
      <div className="qr-scanner-video-container">
        <video ref={videoRef} className="qr-scanner-video" playsInline muted />
        <canvas ref={canvasRef} className="qr-scanner-canvas" />
      </div>
      
      {isJoining && (
        <div className="qr-scanner-loading">
          {t('teams.join.joining') || 'Joining team...'}
        </div>
      )}
    </div>
  );
}

