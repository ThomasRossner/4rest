import { useState, useEffect } from 'react';
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
      await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(consent),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Failed to save consent preferences');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/gdpr/export/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
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
      alert('Failed to export data');
    }
  };

  const handleDeleteData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
      return;
    }

    try {
      await fetch(`/api/gdpr/delete/${user?.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      alert('Your data has been deleted. You will be logged out.');
      // Logout user
      window.location.href = '/login';
    } catch (error) {
      alert('Failed to delete data');
    }
  };

  return (
    <div className="consent-manager">
      <h2>Privacy & Data Management</h2>

      <div className="consent-section">
        <h3>Consent Preferences</h3>
        <div className="consent-item">
          <label>
            <input
              type="checkbox"
              checked={consent.dataProcessing}
              onChange={(e) => handleConsentChange('dataProcessing', e.target.checked)}
            />
            <span>Data Processing (Required)</span>
          </label>
          <p className="consent-description">
            Allow processing of your data for core functionality
          </p>
        </div>

        <div className="consent-item">
          <label>
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => handleConsentChange('analytics', e.target.checked)}
            />
            <span>Analytics</span>
          </label>
          <p className="consent-description">
            Allow collection of anonymous usage statistics
          </p>
        </div>

        <div className="consent-item">
          <label>
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) => handleConsentChange('marketing', e.target.checked)}
            />
            <span>Marketing</span>
          </label>
          <p className="consent-description">
            Allow sending promotional emails and notifications
          </p>
        </div>

        <button onClick={handleSave} className="save-consent-button">
          {saved ? '✓ Saved' : 'Save Preferences'}
        </button>
      </div>

      <div className="gdpr-actions">
        <h3>Your Data Rights</h3>
        <div className="gdpr-buttons">
          <button onClick={handleExportData} className="export-button">
            Export My Data
          </button>
          <button onClick={handleDeleteData} className="delete-button">
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}
