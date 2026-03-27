import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import './TeamQrCodeCarousel.css';

type TeamQrCodeCarouselProps = {
  teamId: string;
  teamName?: string | null;
  onDissolve?: () => void;
  onLeave?: () => void;
  isCreator?: boolean;
};

export function TeamQrCodeCarousel({ teamId, teamName, onDissolve, onLeave, isCreator }: TeamQrCodeCarouselProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const showToast = useToastStore((s) => s.showToast);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadQrCode = async () => {
      setLoading(true);
      try {
        const data = await api.getTeamQrCode(teamId);
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
  }, [teamId, retryNonce]);

  const handleDissolve = async () => {
    if (!confirm(t('teams.dissolve.confirm') || 'Are you sure you want to dissolve this team? Points will be distributed equally among members.')) {
      return;
    }

    setIsDissolving(true);
    try {
      await api.dissolveTeam(teamId);

      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries(['userActiveTeam', userId]),
          queryClient.invalidateQueries(['userTeams', userId]),
          queryClient.invalidateQueries(['userProgress', userId]),
        ]);
      }

      queryClient.invalidateQueries(['userActiveTeam']);
      queryClient.invalidateQueries(['userTeams']);

      try {
        await api.refreshMe();
      } catch (userError) {
        console.debug('Failed to refresh user data:', userError);
      }

      showToast({
        type: 'success',
        title: t('teams.dissolve.success') || 'Team dissolved',
        message: t('teams.dissolve.successMessage') || 'Team has been dissolved and points distributed',
      });
      onDissolve?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('teams.dissolve.error') || 'Error',
        message: error?.response?.data?.error || error?.message || t('teams.dissolve.errorMessage') || 'Failed to dissolve team',
      });
    } finally {
      setIsDissolving(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(t('teams.leave.confirm') || 'Are you sure you want to leave this team? Your contributed points will be returned to you.')) {
      return;
    }

    setIsLeaving(true);
    try {
      await api.leaveTeam(teamId);

      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries(['userActiveTeam', userId]),
          queryClient.invalidateQueries(['userTeams', userId]),
          queryClient.invalidateQueries(['userProgress', userId]),
        ]);
      }

      queryClient.invalidateQueries(['userActiveTeam']);
      queryClient.invalidateQueries(['userTeams']);

      try {
        await api.refreshMe();
      } catch (userError) {
        console.debug('Failed to refresh user data:', userError);
      }

      showToast({
        type: 'success',
        title: t('teams.leave.success') || 'Left team',
        message: t('teams.leave.successMessage') || 'You have left the team and your contributed points have been returned',
      });
      onLeave?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('teams.leave.error') || 'Error',
        message: error?.response?.data?.error || error?.message || t('teams.leave.errorMessage') || 'Failed to leave team',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const membershipActions = isCreator ? (
    <button
      type="button"
      className="team-dissolve-button"
      onClick={handleDissolve}
      disabled={isDissolving}
    >
      {isDissolving ? (t('teams.dissolve.dissolving') || 'Dissolving...') : (t('teams.dissolve.button') || 'Dissolve Team')}
    </button>
  ) : (
    <button
      type="button"
      className="team-leave-button"
      onClick={handleLeave}
      disabled={isLeaving}
    >
      {isLeaving ? (t('teams.leave.leaving') || 'Leaving...') : (t('teams.leave.button') || 'Leave Team')}
    </button>
  );

  if (loading) {
    return <div className="team-qr-loading">{t('teams.qrCode.loading') || 'Loading...'}</div>;
  }

  if (!qrToken) {
    return (
      <div className="team-qr-carousel team-qr-carousel--error-state">
        <h4>{teamName || t('teams.qrCode.title') || 'Team QR Code'}</h4>
        <p className="team-qr-error-message">{t('teams.qrCode.error') || 'Failed to load QR code'}</p>
        <button
          type="button"
          className="team-qr-retry-button"
          onClick={() => setRetryNonce((n) => n + 1)}
        >
          {t('teams.qrCode.retry') || 'Try again'}
        </button>
        {membershipActions}
      </div>
    );
  }

  return (
    <div className="team-qr-carousel">
      <h4>{teamName || t('teams.qrCode.title') || 'Team QR Code'}</h4>
      <div className="team-qr-code-wrapper">
        <QRCodeSVG value={qrToken} size={200} level="M" />
      </div>
      <p className="team-qr-description">{t('teams.qrCode.description') || 'Share this QR code to let others join your team'}</p>
      {membershipActions}
    </div>
  );
}
