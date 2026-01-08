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
        message: t('employee.pointsBonus.invalidAmount'),
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generatePointsBonusQr(amount);
      console.log('QR code generation result:', result);
      if (!result || !result.qrToken) {
        throw new Error('Invalid response from server: missing qrToken');
      }
      setQrToken(result.qrToken);
      setExpiresAt(result.expiresAt);
      pushToast({
        type: 'success',
        message: t('employee.pointsBonus.qrGenerated'),
      });
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.statusText || error?.message || t('employee.pointsBonus.generateError');
      pushToast({
        type: 'error',
        message: errorMessage,
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
      <h1 className="points-bonus-title">{t('employee.pointsBonus.title')}</h1>
      <p className="points-bonus-description">
        {t('employee.pointsBonus.description')}
      </p>

      {!qrToken ? (
        <div className="points-bonus-form">
          <label className="points-bonus-field">
            <span className="points-bonus-label">
              {t('employee.pointsBonus.pointsAmount')} *
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(e.target.value)}
              placeholder={t('employee.pointsBonus.pointsPlaceholder')}
              disabled={isGenerating}
            />
          </label>
          <button
            className="points-bonus-button"
            onClick={handleGenerate}
            disabled={isGenerating || !pointsAmount}
          >
            {isGenerating
              ? t('employee.pointsBonus.generating')
              : t('employee.pointsBonus.generate')}
          </button>
        </div>
      ) : (
        <div className="points-bonus-qr-display">
          <h2 className="points-bonus-qr-title">
            {t('employee.pointsBonus.qrTitle')}
          </h2>
          <p className="points-bonus-qr-info">
            {t('employee.pointsBonus.qrInfo', { amount: pointsAmount })}
          </p>
          {expiresAt && (
            <p className="points-bonus-qr-expiry">
              {t('employee.pointsBonus.expiresAt')}: {new Date(expiresAt).toLocaleString()}
            </p>
          )}
          <div className="points-bonus-qr-container">
            {qrToken ? (
              <QRCodeSVG value={qrToken} size={256} level="M" includeMargin />
            ) : (
              <p>No QR token available</p>
            )}
          </div>
          <p className="points-bonus-qr-instruction">
            {t('employee.pointsBonus.instruction')}
          </p>
          <button className="points-bonus-button" onClick={handleReset}>
            {t('employee.pointsBonus.generateNew')}
          </button>
        </div>
      )}
    </div>
  );
}

export default PointsBonusPage;

