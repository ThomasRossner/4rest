import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SwipeToRedeem.css';

type SwipeToRedeemProps = {
  rewardTitle: string;
  pointsCost: number;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  inline?: boolean;
  compact?: boolean;
  label?: string;
};

export function SwipeToRedeem({
  rewardTitle,
  pointsCost,
  onConfirm,
  onCancel,
  inline = false,
  compact = false,
  label,
}: SwipeToRedeemProps) {
  const { t } = useTranslation();
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);

  const SWIPE_THRESHOLD = 0.8; // 80% of width

  const handleStart = (clientX: number) => {
    if (isConfirmed) return;
    setIsSwiping(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isSwiping || isConfirmed || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const deltaX = clientX - startXRef.current;

    // Only allow swiping to the right (positive deltaX)
    if (deltaX < 0) {
      setSwipeProgress(0);
      return;
    }

    currentXRef.current = clientX;
    const progress = Math.min(deltaX / containerWidth, 1);
    setSwipeProgress(progress);

    // Auto-confirm if threshold reached
    if (progress >= SWIPE_THRESHOLD) {
      setIsConfirmed(true);
      setIsSwiping(false);
      Promise.resolve(onConfirm()).catch(() => {
        setIsConfirmed(false);
        setSwipeProgress(0);
      });
    }
  };

  const handleEnd = () => {
    if (isConfirmed) return;

    // If not reached threshold, reset
    if (swipeProgress < SWIPE_THRESHOLD) {
      setSwipeProgress(0);
    }
    setIsSwiping(false);
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

  const body = (
    <div className={`swipe-to-redeem-content ${inline ? 'swipe-to-redeem-content--inline' : ''} ${compact ? 'swipe-to-redeem-content--compact' : ''}`}>
      {!compact && (
        <h2 className="swipe-to-redeem-title">
          {t('rewards.swipe.title') || 'Redeem Reward'}
        </h2>
      )}
      {label && <p className="swipe-to-redeem-inline-label">{label}</p>}
      {!compact && (
        <div className="swipe-to-redeem-info">
          <p className="swipe-to-redeem-reward">{rewardTitle}</p>
          <p className="swipe-to-redeem-cost">
            {t('rewards.swipe.cost', { count: pointsCost }) || `${pointsCost} points`}
          </p>
        </div>
      )}
      {!compact && (
        <p className="swipe-to-redeem-instruction">
          {t('rewards.swipe.instruction') || 'Swipe right to confirm redemption'}
        </p>
      )}

      {!compact && (
        <div className="swipe-to-redeem-warning">
          <span className="swipe-to-redeem-warning-icon">⚠️</span>
          <span className="swipe-to-redeem-warning-text">
            {t('rewards.swipe.warning') || 'This QR code is temporary. Please redeem it immediately in front of the person.'}
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className="swipe-to-redeem-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleEnd}
      >
        <div
          className="swipe-to-redeem-slider"
          style={{ transform: `translateX(${progressPercentage}%)` }}
        >
          <div className="swipe-to-redeem-slider-content">
            <span className="swipe-to-redeem-slider-icon">
              {isConfirmed ? '✓' : '→'}
            </span>
          </div>
        </div>
        <div className="swipe-to-redeem-track">
          <div
            className="swipe-to-redeem-progress"
            style={{ width: `${progressPercentage}%` }}
          />
          <div className="swipe-to-redeem-track-text">
            {progressPercentage >= SWIPE_THRESHOLD * 100
              ? t('rewards.swipe.releasing') || 'Release to confirm'
              : t('rewards.swipe.swipeRight') || 'Swipe right →'}
          </div>
        </div>
      </div>

      {!inline && (
        <div className="swipe-to-redeem-actions">
          <button className="swipe-to-redeem-cancel" onClick={onCancel}>
            {t('rewards.swipe.cancel') || 'Cancel'}
          </button>
        </div>
      )}
    </div>
  );

  if (inline) {
    return <div className="swipe-to-redeem-inline">{body}</div>;
  }

  return (
    <div className="swipe-to-redeem-overlay" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}>{body}</div>
    </div>
  );
}

