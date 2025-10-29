import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ConsentManager } from '../../components/GDPR/ConsentManager';
import './ProfilePage.css';

function ProfilePage() {
  const { user } = useAuthStore();
  const [showConsent, setShowConsent] = useState(false);

  return (
    <div className="profile-page">
      <h1 className="profile-title">Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email}</p>
            <span className="profile-role">{user?.role || 'guest'}</span>
          </div>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{user?.points || 0}</span>
            <span className="profile-stat-label">Total Points</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">🌲</span>
            <span className="profile-stat-label">Your Trees</span>
          </div>
        </div>
        <div className="profile-actions">
          <button
            onClick={() => setShowConsent(!showConsent)}
            className="privacy-button"
          >
            {showConsent ? 'Hide' : 'Show'} Privacy Settings
          </button>
        </div>
      </div>

      {showConsent && (
        <div className="consent-section-wrapper">
          <ConsentManager />
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
