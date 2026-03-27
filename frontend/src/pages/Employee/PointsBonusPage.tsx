import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { pushToast } from '../../components/Toaster/Toaster';
import './PointsBonusPage.css';

function PointsBonusPage() {
  const { t, i18n } = useTranslation();
  const [pointsAmount, setPointsAmount] = useState<string>('');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Ensure translations are loaded
  const getTranslation = (key: string, fallback: string) => {
    const translation = t(key);
    return translation !== key ? translation : fallback;
  };

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

  const handlePointsAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPointsAmount(e.target.value.replace(/\D/g, ''));
  };

  return (
    <div className="points-bonus-page">
      <h1 className="points-bonus-title">
        {getTranslation('employee.pointsBonus.title', 'Punkte-Bonus QR-Code generieren')}
      </h1>
      <p className="points-bonus-description">
        {getTranslation('employee.pointsBonus.description', 'Geben Sie die Anzahl der zu vergebenden Punkte ein und generieren Sie einen QR-Code, den Gäste scannen können, um die Bonus-Punkte zu erhalten.')}
      </p>

      {!qrToken ? (
        <div className="points-bonus-form">
          <label className="points-bonus-field">
            <span className="points-bonus-label">
              {getTranslation('employee.pointsBonus.pointsAmount', 'Punkte-Anzahl')} *
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={pointsAmount}
              onChange={handlePointsAmountChange}
              placeholder={getTranslation('employee.pointsBonus.pointsPlaceholder', 'Punkte-Anzahl eingeben')}
              disabled={isGenerating}
              aria-label={getTranslation('employee.pointsBonus.pointsAmount', 'Punkte-Anzahl')}
            />
          </label>
          <button
            className="points-bonus-button"
            onClick={handleGenerate}
            disabled={isGenerating || !pointsAmount}
          >
            {isGenerating
              ? getTranslation('employee.pointsBonus.generating', 'Wird generiert...')
              : getTranslation('employee.pointsBonus.generate', 'QR-Code generieren')}
          </button>
        </div>
      ) : (
        <div className="points-bonus-qr-display">
          <h2 className="points-bonus-qr-title">
            {getTranslation('employee.pointsBonus.qrTitle', 'QR-Code generiert')}
          </h2>
          <p className="points-bonus-qr-info">
            {getTranslation('employee.pointsBonus.qrInfo', `Punkte-Anzahl: ${pointsAmount}`)}
          </p>
          {expiresAt && (
            <p className="points-bonus-qr-expiry">
              {getTranslation('employee.pointsBonus.expiresAt', 'Läuft ab am')}: {new Date(expiresAt).toLocaleString()}
            </p>
          )}
          <div className="points-bonus-qr-container">
            {qrToken ? (
              <QRCodeSVG value={qrToken} size={256} level="M" includeMargin />
            ) : (
              <p>{t('rewards.pointsBonus.noToken')}</p>
            )}
          </div>
          <p className="points-bonus-qr-instruction">
            {getTranslation('employee.pointsBonus.instruction', 'Der Gast sollte diesen QR-Code scannen, um die Bonus-Punkte zu erhalten. Dieser Code läuft in 24 Stunden ab.')}
          </p>
          <button className="points-bonus-button" onClick={handleReset}>
            {getTranslation('employee.pointsBonus.generateNew', 'Neuen QR-Code generieren')}
          </button>
        </div>
      )}
    </div>
  );
}

export default PointsBonusPage;

