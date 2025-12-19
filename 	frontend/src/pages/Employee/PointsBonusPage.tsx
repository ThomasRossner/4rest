import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { pushToast } from '../../components/Toaster/Toaster';
import './PointsBonusPage.css';

function PointsBonusPage() {
  const { t } = useTranslation();
  const [pointsAmount, setPointsAmount] = useState<string>('');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    const amount = Number.parseInt(pointsAmount, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      pushToast({
        type: 'error',
        message: t('employee.pointsBonus.invalidAmount') || 'Please enter a valid positive number',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generatePointsBonusQr(amount);
      setQrToken(result.qrToken);
      setExpiresAt(result.expiresAt);
      pushToast({
        type: 'success',
        message: t('employee.pointsBonus.qrGenerated') || 'QR code generated successfully',
      });
    } catch (error: any) {
      pushToast({
        type: 'error',
        message: error?.response?.data?.error || error?.message || t('employee.pointsBonus.generateError') || 'Failed to generate QR code',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setQrToken(null);
    setExpiresAt(null);
    setPointsAmount('');
  };

  return (
    <div className="points-bonus-page">
      <h1 className="points-bonus-title">{t('employee.pointsBonus.title') || 'Generate Points Bonus QR Code'}</h1>
      <p className="points-bonus-description">
        {t('employee.pointsBonus.description') || 'Enter the number of points to award and generate a QR code that guests can scan to receive the bonus points.'}
      </p>

      {!qrToken ? (
        <div className="points-bonus-form">
          <label className="points-bonus-field">
            <span className="points-bonus-label">
              {t('employee.pointsBonus.pointsAmount') || 'Points Amount'} *
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(e.target.value)}
              placeholder={t('employee.pointsBonus.pointsPlaceholder') || 'Enter points amount'}
              disabled={isGenerating}
            />
          </label>
          <button
            className="points-bonus-button"
            onClick={handleGenerate}
            disabled={isGenerating || !pointsAmount}
          >
            {isGenerating
              ? t('employee.pointsBonus.generating') || 'Generating...'
              : t('employee.pointsBonus.generate') || 'Generate QR Code'}
          </button>
        </div>
      ) : (
        <div className="points-bonus-qr-display">
          <h2 className="points-bonus-qr-title">
            {t('employee.pointsBonus.qrTitle') || 'QR Code Generated'}
          </h2>
          <p className="points-bonus-qr-info">
            {t('employee.pointsBonus.qrInfo', { amount: pointsAmount }) ||
              `Points Amount: ${pointsAmount}`}
          </p>
          {expiresAt && (
            <p className="points-bonus-qr-expiry">
              {t('employee.pointsBonus.expiresAt') || 'Expires at'}: {new Date(expiresAt).toLocaleString()}
            </p>
          )}
          <div className="points-bonus-qr-container">
            <QRCodeSVG value={qrToken} size={256} level="M" includeMargin />
          </div>
          <p className="points-bonus-qr-instruction">
            {t('employee.pointsBonus.instruction') || 'Guest should scan this QR code to receive the bonus points. This code will expire in 24 hours.'}
          </p>
          <button className="points-bonus-button" onClick={handleReset}>
            {t('employee.pointsBonus.generateNew') || 'Generate New QR Code'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PointsBonusPage;

