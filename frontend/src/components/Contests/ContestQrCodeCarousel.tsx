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
  rewardsAwarded,
}: ContestQrCodeCarouselProps) {
  const { t, i18n } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isExpired = endDate ? new Date(endDate) <= new Date() : false;

  const { data: ranking } = useQuery(
    ['contestRanking', contestId],
    () => api.getContestRanking(contestId),
    { enabled: isExpired && !!contestId, refetchInterval: 5000 }
  );

  useEffect(() => {
    if (isExpired) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadQrCode = async () => {
      setLoading(true);
      try {
        const data = await api.getContestQrCode(contestId);
        if (!cancelled) {
          setQrToken(data?.qrToken ?? null);
        }
      } catch {
        if (!cancelled) {
          setQrToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadQrCode();
    return () => {
      cancelled = true;
    };
  }, [contestId, isExpired, retryNonce]);

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
      const apiMsg =
        error?.response?.data?.message || error?.response?.data?.error || error?.message;
      showToast({
        type: 'error',
        title: t('contests.dissolve.error'),
        message: apiMsg || t('contests.dissolve.errorMessage'),
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

  const membershipActions = isCreator ? (
    <button
      type="button"
      className="contest-dissolve-button"
      onClick={handleDissolve}
      disabled={isDissolving}
    >
      {isDissolving ? t('contests.dissolve.dissolving') : t('contests.dissolve.button')}
    </button>
  ) : (
    <button
      type="button"
      className="contest-leave-button"
      onClick={handleLeave}
      disabled={isLeaving}
    >
      {isLeaving ? t('contests.leave.leaving') : t('contests.leave.button')}
    </button>
  );

  if (loading) {
    return <div className="contest-qr-loading">{t('contests.qrCode.loading')}</div>;
  }

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
                  <div className="contest-ranking-points">
                    {entry.points} {t('rankings.points')}
                  </div>
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
            {isDissolving ? t('contests.dissolve.dissolving') : t('contests.dissolve.button')}
          </button>
        )}
      </div>
    );
  }

  if (!qrToken) {
    return (
      <div className="contest-qr-carousel contest-qr-carousel--error-state">
        <h4>{contestName || t('contests.qrCode.title')}</h4>
        <p className="contest-qr-error-message">{t('contests.qrCode.error')}</p>
        <button
          type="button"
          className="contest-qr-retry-button"
          onClick={() => setRetryNonce((n) => n + 1)}
        >
          {t('contests.qrCode.retry') || 'Try again'}
        </button>
        {membershipActions}
      </div>
    );
  }

  return (
    <div className="contest-qr-carousel">
      <h4>{contestName || t('contests.qrCode.title')}</h4>
      <div className="contest-qr-code-wrapper">
        <QRCodeSVG value={qrToken} size={200} level="M" />
      </div>
      {startDate && endDate && (
        <div className="contest-qr-duration">
          {t('contests.qrCode.duration')}:{' '}
          {new Date(startDate).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-GB')} -{' '}
          {new Date(endDate).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-GB')}
        </div>
      )}
      <p className="contest-qr-description">{t('contests.qrCode.description')}</p>
      {membershipActions}
    </div>
  );
}
