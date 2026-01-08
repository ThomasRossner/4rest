import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import './TeamQrCodeCarousel.css';

type TeamQrCodeCarouselProps = {
  teamId: string;
  teamName?: string | null;
  onDissolve?: () => void;
  isCreator?: boolean;
};

export function TeamQrCodeCarousel({ teamId, teamName, onDissolve, isCreator }: TeamQrCodeCarouselProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDissolving, setIsDissolving] = useState(false);

  useEffect(() => {
    const loadQrCode = async () => {
      try {
        const data = await api.getTeamQrCode(teamId);
        setQrToken(data.qrToken);
      } catch (error: any) {
        showToast({
          type: 'error',
          title: t('teams.qrCode.error') || 'Error',
          message: error?.response?.data?.error || error?.message || t('teams.qrCode.errorMessage') || 'Failed to load QR code',
        });
      } finally {
        setLoading(false);
      }
    };

    loadQrCode();
  }, [teamId, showToast, t]);

  const handleDissolve = async () => {
    if (!confirm(t('teams.dissolve.confirm') || 'Are you sure you want to dissolve this team? Points will be distributed equally among members.')) {
      return;
    }

    setIsDissolving(true);
    try {
      await api.dissolveTeam(teamId);
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

  if (loading) {
    return <div className="team-qr-loading">{t('teams.qrCode.loading') || 'Loading...'}</div>;
  }

  if (!qrToken) {
    return <div className="team-qr-error">{t('teams.qrCode.error') || 'Failed to load QR code'}</div>;
  }

  return (
    <div className="team-qr-carousel">
      <h4>{teamName || t('teams.qrCode.title') || 'Team QR Code'}</h4>
      <div className="team-qr-code-wrapper">
        <QRCodeSVG value={qrToken} size={200} level="M" />
      </div>
      <p className="team-qr-description">{t('teams.qrCode.description') || 'Share this QR code to let others join your team'}</p>
      {isCreator && (
        <button
          type="button"
          className="team-dissolve-button"
          onClick={handleDissolve}
          disabled={isDissolving}
        >
          {isDissolving ? (t('teams.dissolve.dissolving') || 'Dissolving...') : (t('teams.dissolve.button') || 'Dissolve Team')}
        </button>
      )}
    </div>
  );
}

