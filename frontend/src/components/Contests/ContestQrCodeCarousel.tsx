import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery } from 'react-query';
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
  startDate?: string | Date;
  endDate?: string | Date;
  rewardsAwarded?: boolean;
};

export function ContestQrCodeCarousel({ 
  contestId, 
  contestName, 
  onDissolve, 
  onLeave, 
  isCreator,
  startDate,
  endDate,
  rewardsAwarded
}: ContestQrCodeCarouselProps) {
  const { t, i18n } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Check if contest is expired
  const isExpired = endDate ? new Date(endDate) <= new Date() : false;

  // Get contest ranking if expired
  const { data: ranking } = useQuery(
    ['contestRanking', contestId],
    () => api.getContestRanking(contestId),
    { enabled: isExpired && !!contestId, refetchInterval: 5000 }
  );

  useEffect(() => {
    // Only load QR code if contest is not expired
    if (isExpired) {
      setLoading(false);
      return;
    }

    const loadQrCode = async () => {
      try {
        const data = await api.getContestQrCode(contestId);
        setQrToken(data.qrToken);
      } catch (error: any) {
        showToast({
          type: 'error',
          title: t('contests.qrCode.error'),
          message: error?.response?.data?.error || error?.message || t('contests.qrCode.errorMessage'),
        });
      } finally {
        setLoading(false);
      }
    };

    loadQrCode();
  }, [contestId, isExpired, showToast, t]);

  const handleDissolve = async () => {
    if (!confirm(t('contests.dissolve.confirm'))) {
      return;
    }

    setIsDissolving(true);
    try {
      await api.dissolveContest(contestId);
      showToast({
        type: 'success',
        title: t('contests.dissolve.success'),
        message: t('contests.dissolve.successMessage'),
      });
      onDissolve?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('contests.dissolve.error'),
        message: error?.response?.data?.error || error?.message || t('contests.dissolve.errorMessage'),
      });
    } finally {
      setIsDissolving(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(t('contests.leave.confirm'))) {
      return;
    }

    setIsLeaving(true);
    try {
      await api.leaveContest(contestId);
      showToast({
        type: 'success',
        title: t('contests.leave.success'),
        message: t('contests.leave.successMessage'),
      });
      onLeave?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('contests.leave.error'),
        message: error?.response?.data?.error || error?.message || t('contests.leave.errorMessage'),
      });
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading) {
    return <div className="contest-qr-loading">{t('contests.qrCode.loading')}</div>;
  }

  // Show ranking if contest is expired
  if (isExpired) {
    return (
      <div className="contest-qr-carousel">
        <h4>{contestName || t('contests.qrCode.title')}</h4>
        <div className="contest-ranking-wrapper">
          <h5 className="contest-ranking-title">{t('contests.ranking.title')}</h5>
          {ranking && ranking.length > 0 ? (
            <div className="contest-ranking-list">
              {ranking.slice(0, 10).map((entry: any) => (
                <div key={entry.user_id} className="contest-ranking-item">
                  <div className="contest-ranking-rank">#{entry.rank}</div>
                  <div className="contest-ranking-name">{entry.user_name}</div>
                  <div className="contest-ranking-points">{entry.points} {t('rankings.points')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="contest-ranking-empty">{t('contests.ranking.empty')}</p>
          )}
          {rewardsAwarded && (
            <p className="contest-rewards-awarded">{t('contests.ranking.rewardsAwarded')}</p>
          )}
        </div>
        {isCreator && (
          <button
            type="button"
            className="contest-dissolve-button"
            onClick={handleDissolve}
            disabled={isDissolving}
          >
            {isDissolving ? (t('contests.dissolve.dissolving')) : (t('contests.dissolve.button'))}
          </button>
        )}
      </div>
    );
  }

  if (!qrToken) {
    return <div className="contest-qr-error">{t('contests.qrCode.error')}</div>;
  }

  return (
    <div className="contest-qr-carousel">
      <h4>{contestName || t('contests.qrCode.title')}</h4>
      <div className="contest-qr-code-wrapper">
        <QRCodeSVG value={qrToken} size={200} level="M" />
      </div>
      {startDate && endDate && (
        <div className="contest-qr-duration">
          {t('contests.qrCode.duration')}: {new Date(startDate).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-GB')} - {new Date(endDate).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-GB')}
        </div>
      )}
      <p className="contest-qr-description">{t('contests.qrCode.description')}</p>
      {isCreator ? (
        <button
          type="button"
          className="contest-dissolve-button"
          onClick={handleDissolve}
          disabled={isDissolving}
        >
          {isDissolving ? (t('contests.dissolve.dissolving')) : (t('contests.dissolve.button'))}
        </button>
      ) : (
        <button
          type="button"
          className="contest-leave-button"
          onClick={handleLeave}
          disabled={isLeaving}
        >
          {isLeaving ? (t('contests.leave.leaving')) : (t('contests.leave.button'))}
        </button>
      )}
    </div>
  );
}
