import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import './ContestQrCodeCarousel.css';

type ContestQrCodeCarouselProps = {
  contestId: string;
  contestName?: string | null;
  onDissolve?: () => void;
  onLeave?: () => void;
  isCreator?: boolean;
};

export function ContestQrCodeCarousel({ contestId, contestName, onDissolve, onLeave, isCreator }: ContestQrCodeCarouselProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const loadQrCode = async () => {
      try {
        const data = await api.getContestQrCode(contestId);
        setQrToken(data.qrToken);
      } catch (error: any) {
        showToast({
          type: 'error',
          title: t('contests.qrCode.error') || 'Error',
          message: error?.response?.data?.error || error?.message || t('contests.qrCode.errorMessage') || 'Failed to load QR code',
        });
      } finally {
        setLoading(false);
      }
    };

    loadQrCode();
  }, [contestId, showToast, t]);

  const handleDissolve = async () => {
    if (!confirm(t('contests.dissolve.confirm') || 'Are you sure you want to dissolve this contest?')) {
      return;
    }

    setIsDissolving(true);
    try {
      await api.dissolveContest(contestId);
      showToast({
        type: 'success',
        title: t('contests.dissolve.success') || 'Contest dissolved',
        message: t('contests.dissolve.successMessage') || 'Contest has been dissolved',
      });
      onDissolve?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('contests.dissolve.error') || 'Error',
        message: error?.response?.data?.error || error?.message || t('contests.dissolve.errorMessage') || 'Failed to dissolve contest',
      });
    } finally {
      setIsDissolving(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(t('contests.leave.confirm') || 'Are you sure you want to leave this contest?')) {
      return;
    }

    setIsLeaving(true);
    try {
      await api.leaveContest(contestId);
      showToast({
        type: 'success',
        title: t('contests.leave.success') || 'Left contest',
        message: t('contests.leave.successMessage') || 'You have left the contest',
      });
      onLeave?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('contests.leave.error') || 'Error',
        message: error?.response?.data?.error || error?.message || t('contests.leave.errorMessage') || 'Failed to leave contest',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading) {
    return <div className="contest-qr-loading">{t('contests.qrCode.loading') || 'Loading...'}</div>;
  }

  if (!qrToken) {
    return <div className="contest-qr-error">{t('contests.qrCode.error') || 'Failed to load QR code'}</div>;
  }

  return (
    <div className="contest-qr-carousel">
      <h4>{contestName || t('contests.qrCode.title') || 'Contest QR Code'}</h4>
      <div className="contest-qr-code-wrapper">
        <QRCodeSVG value={qrToken} size={200} level="M" />
      </div>
      <p className="contest-qr-description">{t('contests.qrCode.description') || 'Share this QR code to let others join your contest'}</p>
      {isCreator ? (
        <button
          type="button"
          className="contest-dissolve-button"
          onClick={handleDissolve}
          disabled={isDissolving}
        >
          {isDissolving ? (t('contests.dissolve.dissolving') || 'Dissolving...') : (t('contests.dissolve.button') || 'Dissolve Contest')}
        </button>
      ) : (
        <button
          type="button"
          className="contest-leave-button"
          onClick={handleLeave}
          disabled={isLeaving}
        >
          {isLeaving ? (t('contests.leave.leaving') || 'Leaving...') : (t('contests.leave.button') || 'Leave Contest')}
        </button>
      )}
    </div>
  );
}

