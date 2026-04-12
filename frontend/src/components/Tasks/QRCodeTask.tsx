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
  variant?: 'default' | 'public';
}

export function QRCodeTask({ taskId, qrCode, onComplete, variant = 'default' }: QRCodeTaskProps) {
  const [scannedCode, setScannedCode] = useState('');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t, i18n } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const publicLang = i18n.language?.startsWith('en') ? 'en' : 'de';

  const { data: task, isLoading } = useQuery(
    variant === 'public' ? ['publicTask', taskId, publicLang] : ['task', taskId],
    () =>
      variant === 'public' ? api.getPublicTask(taskId, publicLang) : api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    () => (variant === 'public' ? api.completePublicTask(taskId, {}) : api.completeTask(taskId, {})),
    {
      onSuccess: async () => {
        if (variant === 'public') {
          showToast({
            type: 'success',
            title: t('publicTask.toast.title'),
            message: t('publicTask.toast.body', { points: task?.points ?? 0 }),
          });
          onComplete?.();
          return;
        }
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);

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
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Poll video ready state periodically
  useEffect(() => {
    if (!hasCamera || !videoRef.current) {
      return;
    }
    
    const checkVideoReady = () => {
      const video = videoRef.current;
      if (video && video.srcObject && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('[QRCodeTask] Video is ready (polling check)', {
          readyState: video.readyState,
          dimensions: `${video.videoWidth}x${video.videoHeight}`
        });
        setIsVideoReady(true);
      }
    };
    
    // Check immediately
    checkVideoReady();
    
    // Poll every 100ms until ready
    const interval = setInterval(() => {
      if (!isVideoReady) {
        checkVideoReady();
      } else {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [hasCamera, isVideoReady]);
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const initializeCamera = async () => {
      try {
        console.log('[QRCodeTask] Checking camera availability...');
        console.log('[QRCodeTask] Protocol:', window.location.protocol);
        console.log('[QRCodeTask] Hostname:', window.location.hostname);
        console.log('[QRCodeTask] mediaDevices available:', !!navigator.mediaDevices);
        console.log('[QRCodeTask] getUserMedia available:', !!(navigator.mediaDevices?.getUserMedia));
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const isHttp = window.location.protocol === 'http:';
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          console.log('[QRCodeTask] Camera API not available', { isHttp, isLocalhost });
          if (isHttp && !isLocalhost) {
            setCameraError(t('tasksComponents.qr.cameraRequiresHttps'));
          } else {
            setCameraError(t('tasksComponents.qr.cameraNotSupported'));
          }
          setHasCamera(false);
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
        
        console.log('[QRCodeTask] Requesting camera access...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        console.log('[QRCodeTask] Camera access granted, stream:', stream);
        console.log('[QRCodeTask] Video tracks:', stream.getVideoTracks().length);
        
        setHasCamera(true);
        setCameraError(null);
        
        // Attach stream to video element
        const attachStream = () => {
          if (videoRef.current && streamRef.current) {
            console.log('[QRCodeTask] Attaching stream to video element');
            const video = videoRef.current;
            video.srcObject = streamRef.current;
            
            // Set playsInline for iOS compatibility (both attributes)
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            
            // Handle video ready events
            const handleLoadedMetadata = () => {
              console.log('[QRCodeTask] Video metadata loaded, readyState:', video.readyState);
              console.log('[QRCodeTask] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                setIsVideoReady(true);
              }
              video.play().catch((err) => {
                console.error('[QRCodeTask] Error playing video after metadata:', err);
                setCameraError(t('tasksComponents.qr.cameraPlayError'));
              });
            };
            
            const handlePlay = () => {
              console.log('[QRCodeTask] Video is playing');
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                setIsVideoReady(true);
              }
            };
            
            const handleCanPlay = () => {
              console.log('[QRCodeTask] Video can play, readyState:', video.readyState);
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                setIsVideoReady(true);
              }
            };
            
            const handleError = (e: Event) => {
              console.error('[QRCodeTask] Video error event:', e);
              setCameraError(t('tasksComponents.qr.cameraPlayError'));
            };
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('play', handlePlay);
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('error', handleError);
            
            // Check if video is already ready
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              setIsVideoReady(true);
            }
            
            // Try to play immediately
            video.play().catch((err) => {
              console.log('[QRCodeTask] Initial play() failed (expected on some browsers), will retry on loadedmetadata:', err);
            });
          } else {
            console.log('[QRCodeTask] Video element not ready yet', {
              hasVideo: !!videoRef.current,
              hasStream: !!streamRef.current
            });
          }
        };
        
        // Wait for video element to be rendered, then attach
        const waitForVideoElement = () => {
          if (videoRef.current) {
            attachStream();
          } else {
            console.log('[QRCodeTask] Waiting for video element...');
            setTimeout(waitForVideoElement, 100);
          }
        };
        
        // Start attaching after a short delay
        setTimeout(waitForVideoElement, 100);
        
        // Check decoding capability (BarcodeDetector API)
        try {
          const BD = (window as any).BarcodeDetector;
          if (BD && typeof BD.getSupportedFormats === 'function') {
            const formats = await BD.getSupportedFormats();
            const supportsQR = formats.includes('qr_code');
            console.log('[QRCodeTask] BarcodeDetector available:', supportsQR, 'formats:', formats);
            setCanDecode(supportsQR);
          } else {
            console.log('[QRCodeTask] BarcodeDetector not available, using jsQR fallback');
            setCanDecode(false);
          }
        } catch (err) {
          console.log('[QRCodeTask] Error checking BarcodeDetector:', err);
          setCanDecode(false);
        }
      } catch (err: any) {
        console.error('[QRCodeTask] Error accessing camera:', err);
        console.error('[QRCodeTask] Error name:', err.name);
        console.error('[QRCodeTask] Error message:', err.message);
        setHasCamera(false);
        setIsVideoReady(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(t('tasksComponents.qr.cameraPermissionDenied'));
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError(t('tasksComponents.qr.cameraNotFound'));
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError(t('tasksComponents.qr.cameraInUse'));
        } else {
          setCameraError(err.message || t('tasksComponents.qr.cameraError'));
        }
      }
    };

    initializeCamera();

    return () => {
      console.log('[QRCodeTask] Cleaning up camera...');
      // Stop camera when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          console.log('[QRCodeTask] Stopping track:', t.label);
          t.stop();
        });
        streamRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [t]);

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
    <div className="task-container task-container--qr-execution">
      <header className="qr-exec-header">
        <h2 className="qr-exec-title">{task.title}</h2>
        <span className="task-points">
          {t('tasksComponents.points', { points: task.points })}
        </span>
      </header>

      <div className="qr-exec-body">
        {/* Kamera zuerst: passt mit Titel + Eingabe auf eine Bildschirmseite */}
        <div className="qr-scanner qr-scanner--execution">
            {/* Camera preview - always render video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="qr-scanner-video-element"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                backgroundColor: '#000',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                minHeight: '100%',
                minWidth: '100%',
                opacity: isVideoReady ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoadedMetadata={() => {
                console.log('[QRCodeTask] Video metadata loaded, video should be visible now');
                console.log('[QRCodeTask] Video readyState:', videoRef.current?.readyState);
                console.log('[QRCodeTask] Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                const video = videoRef.current;
                if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                  console.log('[QRCodeTask] Setting isVideoReady to true (onLoadedMetadata)');
                  setIsVideoReady(true);
                }
                // Force play on iOS
                if (video) {
                  video.play().catch((err) => {
                    console.error('[QRCodeTask] Error playing video after metadata:', err);
                    setCameraError(t('tasksComponents.qr.cameraPlayError'));
                  });
                }
              }}
              onPlay={() => {
                console.log('[QRCodeTask] Video is playing');
                const video = videoRef.current;
                if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                  console.log('[QRCodeTask] Setting isVideoReady to true (onPlay)');
                  setIsVideoReady(true);
                }
              }}
              onCanPlay={() => {
                console.log('[QRCodeTask] Video can play');
                const video = videoRef.current;
                if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                  console.log('[QRCodeTask] Setting isVideoReady to true (onCanPlay)');
                  setIsVideoReady(true);
                }
              }}
              onPlaying={() => {
                console.log('[QRCodeTask] Video is playing (playing event)');
                const video = videoRef.current;
                if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                  console.log('[QRCodeTask] Setting isVideoReady to true (onPlaying)');
                  setIsVideoReady(true);
                }
              }}
              onError={(e) => {
                console.error('[QRCodeTask] Video error event:', e);
                const video = e.target as HTMLVideoElement;
                console.error('[QRCodeTask] Video error code:', video.error?.code);
                console.error('[QRCodeTask] Video error message:', video.error?.message);
                setCameraError(t('tasksComponents.qr.cameraPlayError'));
              }}
            />
            {/* Loading indicator or error message */}
            {(!hasCamera || !isVideoReady) && (
              <div
                className="qr-exec-video-overlay"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  textAlign: 'center',
                  zIndex: 2,
                  padding: 'var(--spacing-md)',
                  background: 'rgba(0,0,0,0.72)',
                  borderRadius: 'var(--border-radius)',
                  maxWidth: '90%',
                }}
              >
                {cameraError && !hasCamera ? (
                  <span style={{ fontSize: '2rem' }} title={cameraError} aria-hidden>
                    ⚠️
                  </span>
                ) : cameraError && hasCamera ? (
                  <>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
                    <div style={{ fontSize: '0.9rem' }}>{cameraError}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📷</div>
                    <div>{t('tasksComponents.qr.cameraLoading')}</div>
                  </>
                )}
              </div>
            )}
            {/* Scanner overlay - only show if camera is ready */}
            {hasCamera && videoRef.current?.srcObject && isVideoReady && (
              <div className="scanner-overlay">
                <div className="scanner-frame"></div>
              </div>
            )}
            {scannedCode && (
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: 12, zIndex: 3 }}>
                {t('tasksComponents.qr.scanned', { value: scannedCode })}
              </div>
            )}
            {decodeError && (
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(255,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: 12, zIndex: 3 }}>
                {decodeError}
              </div>
            )}
            {completeMutation.isLoading && (
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', borderRadius: '4px', fontSize: 12, textAlign: 'center', zIndex: 3 }}>
                {t('tasksComponents.qr.completing')}
              </div>
            )}
        </div>

        <div className="qr-exec-input-panel">
          {cameraError && !hasCamera && (
            <div className="qr-exec-camera-error" role="alert">
              <strong>{t('tasksComponents.qr.cameraErrorTitle')}</strong>
              <p>{cameraError}</p>
            </div>
          )}
          <p className="qr-exec-prompt">{t('tasksComponents.qr.manualPrompt')}</p>
          <input
            type="text"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            placeholder={t('tasksComponents.qr.manualPlaceholder')}
            className="qr-input qr-input--execution"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !scannedCode || completeMutation.isLoading) return;
              e.preventDefault();
              if (scannedCode === qrCode) {
                completeMutation.mutate();
              } else {
                alert(t('tasksComponents.qr.invalid'));
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (scannedCode === qrCode) {
                completeMutation.mutate();
              } else {
                alert(t('tasksComponents.qr.invalid'));
              }
            }}
            disabled={!scannedCode || completeMutation.isLoading}
            className="verify-button verify-button--execution"
          >
            {t('tasksComponents.qr.verify')}
          </button>
        </div>
      </div>

      {completeMutation.isSuccess && (
        <div className="task-success task-success--qr-execution">
          <span className="success-icon">✅</span>
          <p>{t('tasksComponents.qr.success')}</p>
        </div>
      )}
    </div>
  );
}
