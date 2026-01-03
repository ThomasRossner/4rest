import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import './ConsentManager.css';

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  dataProcessing: boolean;
}

export function ConsentManager() {
  const { user } = useAuthStore();
  const [consent, setConsent] = useState<ConsentPreferences>({
    analytics: false,
    marketing: false,
    dataProcessing: false,
  });
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Load existing consent preferences
    // This would fetch from API
  }, []);

  const handleConsentChange = (key: keyof ConsentPreferences, value: boolean) => {
    setConsent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const token = useAuthStore.getState().token;
      await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(consent),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert(t('consent.alerts.saveError'));
    }
  };

  const handleExportData = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/gdpr/export/${user?.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roots-of-impact-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(t('consent.alerts.exportError'));
    }
  };

  const handleDeleteData = async () => {
    if (!confirm(t('consent.alerts.deleteConfirm'))) {
      return;
    }

    try {
      if (!user?.id) throw new Error('Missing user');
      await api.deleteMyAccount(user.id);
      alert(t('consent.alerts.deleteSuccess'));
      // Clear auth store and redirect
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } catch (error) {
      alert(t('consent.alerts.deleteError'));
    }
  };

  return (
    <div className="consent-manager">
      <h2>{t('consent.title')}</h2>

      <div className="consent-section">
        <h3>{t('consent.preferences')}</h3>
        <div className="consent-item">
          <label>
            <input
              type="checkbox"
              checked={consent.dataProcessing}
              onChange={(e) => handleConsentChange('dataProcessing', e.target.checked)}
            />
            <span>{t('consent.dataProcessing.label')}</span>
          </label>
          <p className="consent-description">
            {t('consent.dataProcessing.description')}
          </p>
        </div>

        <div className="consent-item">
          <label>
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => handleConsentChange('analytics', e.target.checked)}
            />
            <span>{t('consent.analytics.label')}</span>
          </label>
          <p className="consent-description">
            {t('consent.analytics.description')}
          </p>
        </div>

        <div className="consent-item">
          <label>
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) => handleConsentChange('marketing', e.target.checked)}
            />
            <span>{t('consent.marketing.label')}</span>
          </label>
          <p className="consent-description">
            {t('consent.marketing.description')}
          </p>
        </div>

        <button onClick={handleSave} className="save-consent-button">
          {saved ? t('consent.saved') : t('consent.save')}
        </button>
      </div>

      <div className="gdpr-actions">
        <h3>{t('consent.dataRights')}</h3>
        <div className="gdpr-buttons">
          <button onClick={handleExportData} className="export-button">
            {t('consent.export')}
          </button>
          <button onClick={handleDeleteData} className="delete-button">
            {t('consent.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
