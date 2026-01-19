import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import jsQR from 'jsqr';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import './TaskComponents.css';

interface QRCodeTaskProps {
  taskId: string;
  qrCode: string;
  onComplete?: () => void;
}

export function QRCodeTask({ taskId, qrCode, onComplete }: QRCodeTaskProps) {
  const [scannedCode, setScannedCode] = useState('');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);

  const { data: task, isLoading } = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    () => api.completeTask(taskId, {}),
    {
      onSuccess: async () => {
        // Invalidate task and progress queries
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        
        // Invalidate team-related queries to update team points and forest
        if (userId) {
          await Promise.all([
            queryClient.invalidateQueries(['userActiveTeam', userId]),
            queryClient.invalidateQueries(['userTeams', userId]),
          ]);
        }
        queryClient.invalidateQueries(['userActiveTeam']);
        queryClient.invalidateQueries(['userTeams']);
        
        // Refresh user data to update points
        try {
          await api.refreshMe();
        } catch (userError) {
          console.debug('Failed to refresh user data:', userError);
        }
        
        showToast({
          type: 'success',
          title: t('tasks.toast.completedTitle'),
          message: t('tasks.toast.completedMessage', { points: task?.points ?? 0, trees: TREES_PER_TASK }),
        });
        onComplete?.();
      },
    }
  );

  // Check if device has camera (for real QR scanning)
  const [hasCamera, setHasCamera] = useState(false);
  const [canDecode, setCanDecode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isHttp && !isLocalhost) {
            setCameraError(t('tasksComponents.qr.cameraRequiresHttps', 'Kamera-Zugriff erfordert HTTPS, wenn von einem anderen Gerät zugegriffen wird. Bitte verwenden Sie HTTPS oder greifen Sie von localhost zu.'));
          } else {
            setCameraError(t('tasksComponents.qr.cameraNotSupported', 'Kamera-Zugriff wird in diesem Browser nicht unterstützt. Bitte verwenden Sie einen modernen Browser mit Kamera-Unterstützung.'));
          }
          setHasCamera(false);
          return;
        }
        // Prefer environment camera when available (mobile), fallback to user
        const constraints: MediaStreamConstraints = {
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        setHasCamera(true);
        setCameraError(null);
        // Attach to video element if present
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Some browsers require play() after metadata
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.error('Error playing video:', err);
              setCameraError(t('tasksComponents.qr.cameraPlayError', 'Kamera konnte nicht gestartet werden'));
            });
          };
        }
        // Check decoding capability (BarcodeDetector API)
        const supported = (window as any).BarcodeDetector &&
          typeof (window as any).BarcodeDetector.getSupportedFormats === 'function'
          ? await (window as any).BarcodeDetector.getSupportedFormats()
              .then((formats: string[]) => formats.includes('qr_code'))
          : false;
        setCanDecode(!!supported);
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setHasCamera(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(t('tasksComponents.qr.cameraPermissionDenied', 'Kamera-Zugriff wurde verweigert. Bitte erlauben Sie den Kamera-Zugriff in den Browser-Einstellungen.'));
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError(t('tasksComponents.qr.cameraNotFound', 'Keine Kamera gefunden. Bitte stellen Sie sicher, dass eine Kamera angeschlossen ist.'));
        } else {
          setCameraError(err.message || t('tasksComponents.qr.cameraError', 'Kamera-Zugriff fehlgeschlagen'));
        }
      }
    })();

    return () => {
      // Stop camera when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Real-time QR decoding using BarcodeDetector (if available) or jsQR as fallback
  useEffect(() => {
    let detector: any = null;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let isProcessing = false;
    let frameCount = 0;

    if (!hasCamera || !videoRef.current) {
      console.log('QR Decoding: Waiting for camera...', { hasCamera, hasVideo: !!videoRef.current });
      return;
    }

    const startDecoding = async () => {
      try {
        console.log('QR Decoding: Starting decoder initialization...');
        
        // Try BarcodeDetector first (Chrome/Edge)
        const BD = (window as any).BarcodeDetector;
        if (BD && canDecode) {
          try {
            detector = new BD({ formats: ['qr_code'] });
            console.log('QR Decoding: Using BarcodeDetector API');
          } catch (e) {
            console.log('QR Decoding: BarcodeDetector initialization failed, using jsQR fallback', e);
            detector = null;
          }
        } else {
          console.log('QR Decoding: BarcodeDetector not available, using jsQR');
        }

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setDecodeError('Canvas context not available');
          return;
        }
        setDecodeError(null);

        const loop = () => {
          if (!videoRef.current || !ctx || !canvas) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }
          const v = videoRef.current;
          
          // Check if video is ready
          if (v.readyState < 2 || !v.videoWidth || !v.videoHeight) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          // Only process every 3rd frame to reduce CPU usage
          frameCount++;
          if (frameCount % 3 !== 0) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          if (isProcessing) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

          isProcessing = true;

          const processFrame = async () => {
            try {
              let decodedValue: string | null = null;

              // Try BarcodeDetector first
              if (detector) {
                try {
                  const barcodes = await detector.detect(canvas);
                  if (barcodes && barcodes.length > 0) {
                    decodedValue = barcodes[0].rawValue || '';
                    console.log('QR Decoding: BarcodeDetector found:', decodedValue);
                  }
                } catch (err) {
                  // BarcodeDetector failed, try jsQR
                  console.log('QR Decoding: BarcodeDetector error, trying jsQR', err);
                }
              }

              // Fallback to jsQR if BarcodeDetector didn't find anything
              if (!decodedValue && ctx && canvas) {
                try {
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                  });
                  if (code) {
                    decodedValue = code.data;
                    console.log('QR Decoding: jsQR found:', decodedValue);
                  }
                } catch (err) {
                  console.log('QR Decoding: jsQR error', err);
                }
              }

              if (decodedValue) {
                console.log('✅ QR Code detected:', decodedValue);
                setScannedCode(decodedValue);
                // Auto-complete when QR code matches expected code
                if (qrCode && decodedValue === qrCode && !completeMutation.isLoading && !completeMutation.isSuccess) {
                  console.log('✅ QR Code matches! Completing task...');
                  completeMutation.mutate();
                }
              }
            } catch (err: any) {
              // Ignore intermittent errors but log them
              console.error('QR Decoding: Frame processing error', err);
            } finally {
              isProcessing = false;
            }
          };

          processFrame();
          rafRef.current = requestAnimationFrame(loop);
        };
        
        console.log('QR Decoding: Starting decode loop');
        rafRef.current = requestAnimationFrame(loop);
      } catch (err: any) {
        console.error('QR Decoding: Failed to start QR decoding:', err);
        setDecodeError(err?.message || 'Failed to initialize QR decoder');
      }
    };

    // Wait for video to be ready
    const checkVideoReady = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        console.log('QR Decoding: Video is ready', {
          readyState: videoRef.current.readyState,
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });
        startDecoding();
      } else {
        console.log('QR Decoding: Video not ready yet, retrying...', {
          hasVideo: !!videoRef.current,
          readyState: videoRef.current?.readyState,
        });
        setTimeout(checkVideoReady, 200);
      }
    };

    // Start checking after a short delay
    const timeout = setTimeout(checkVideoReady, 300);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      detector = null;
      canvas = null;
      ctx = null;
      isProcessing = false;
      frameCount = 0;
    };
  }, [hasCamera, canDecode, qrCode, completeMutation.isLoading, completeMutation.isSuccess]);

  if (isLoading) return <div>{t('tasksComponents.loading')}</div>;
  if (!task) return <div>{t('tasksComponents.notFound')}</div>;

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">
          {t('tasksComponents.points', { points: task.points })}
        </span>
      </div>
      {task.description && (
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-light)' }}>
          {task.description}
        </p>
      )}

      <div className="qr-container">
        <div className="qr-scanner-area">
          {/* Manual input field - always shown */}
          <div className="qr-manual" style={{ width: '100%', maxWidth: '400px', marginBottom: hasCamera ? 'var(--spacing-lg)' : '0' }}>
            {cameraError && !hasCamera && (
              <div style={{ 
                padding: 'var(--spacing-md)', 
                background: '#fee2e2', 
                color: '#991b1b', 
                borderRadius: 'var(--border-radius)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <strong>{t('tasksComponents.qr.cameraErrorTitle', 'Kamera-Fehler')}</strong>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0' }}>{cameraError}</p>
              </div>
            )}
            <p>{t('tasksComponents.qr.manualPrompt', 'Bitte geben Sie den QR-Code manuell ein:')}</p>
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              placeholder={t('tasksComponents.qr.manualPlaceholder', 'QR-Code eingeben')}
              className="qr-input"
            />
            <button
              onClick={() => {
                if (scannedCode === qrCode) {
                  completeMutation.mutate();
                } else {
                  alert(t('tasksComponents.qr.invalid', 'Ungültiger QR-Code'));
                }
              }}
              disabled={!scannedCode || completeMutation.isLoading}
              className="verify-button"
            >
              {t('tasksComponents.qr.verify', 'Verifizieren')}
            </button>
          </div>

          {/* Camera preview - shown if camera is available */}
          {hasCamera && (
            <div className="qr-scanner">
              {/* Camera preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="scanner-overlay">
                <div className="scanner-frame"></div>
              </div>
              {scannedCode && (
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: 12 }}>
                  {t('tasksComponents.qr.scanned', { value: scannedCode })}
                </div>
              )}
              {decodeError && (
                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(255,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: 12 }}>
                  {decodeError}
                </div>
              )}
              {completeMutation.isLoading && (
                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: 12, textAlign: 'center' }}>
                  {t('tasksComponents.qr.completing')}
                </div>
              )}
            </div>
          )}
        </div>

        {completeMutation.isSuccess && (
          <div className="task-success">
            <span className="success-icon">✅</span>
            <p>{t('tasksComponents.qr.success')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
