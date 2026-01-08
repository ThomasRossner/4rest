import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import './UserQrCodeDisplay.css';

export function UserQrCodeDisplay() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQrCode = async () => {
      try {
        const data = await api.getUserQrCode();
        setQrToken(data.qrToken);
      } catch (error: any) {
        showToast(t('profile.qrCode.error') || 'Failed to load QR code', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadQrCode();
  }, [showToast, t]);

  if (loading) {
    return <div className="user-qr-loading">{t('profile.qrCode.loading') || 'Loading...'}</div>;
  }

  if (!qrToken) {
    return <div className="user-qr-error">{t('profile.qrCode.error') || 'Failed to load QR code'}</div>;
  }

  return (
    <div className="user-qr-code-display">
      <h3>{t('profile.qrCode.title') || 'Your Personal QR Code'}</h3>
      <p className="user-qr-description">{t('profile.qrCode.description') || 'Share this QR code to create teams or contests with others'}</p>
      <div className="user-qr-code-wrapper">
        <QRCodeSVG value={qrToken} size={256} level="M" />
      </div>
    </div>
  );
}

