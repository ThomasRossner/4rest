import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { ConsentManager } from '../../components/GDPR/ConsentManager';
import './ProfilePage.css';

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const points = useAuthStore((s) => s.user?.points || 0);
  const [showConsent, setShowConsent] = useState(false);

  const sihotGuest = user?.sihotGuest;
  const sihotReservations = user?.sihotReservations ?? [];

  const formatDate = (value: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

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
            <p>{user?.email || 'No email provided'}</p>
            <span className="profile-role">{user?.role || 'guest'}</span>
          </div>
        </div>
          <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{points}</span>
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

      {sihotGuest && (
        <section className="profile-sihot-card">
          <div className="profile-sihot-header">
            <h2>SIHOT Guest Profile</h2>
            {user?.sihotGuestId && (
              <span className="profile-sihot-badge">Guest ID: {user.sihotGuestId}</span>
            )}
          </div>

          <dl className="profile-sihot-grid">
            <div>
              <dt>Name</dt>
              <dd>
                {sihotGuest.firstName} {sihotGuest.lastName}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{sihotGuest.email || user?.email || '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{sihotGuest.phone || '—'}</dd>
            </div>
            <div>
              <dt>Loyalty Level</dt>
              <dd>{sihotGuest.loyaltyLevel || '—'}</dd>
            </div>
            <div>
              <dt>Preferred Language</dt>
              <dd>{sihotGuest.language || '—'}</dd>
            </div>
            <div>
              <dt>Preferences</dt>
              <dd>
                {sihotGuest.preferences?.length
                  ? sihotGuest.preferences.join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>

          {sihotGuest.notes && (
            <div className="profile-sihot-notes">
              <h3>Notes</h3>
              <p>{sihotGuest.notes}</p>
            </div>
          )}

          {sihotReservations.length > 0 && (
            <div className="profile-sihot-reservations">
              <h3>Recent Reservations</h3>
              <ul>
                {sihotReservations.map((reservation) => (
                  <li key={reservation.reservationId}>
                    <div className="reservation-row">
                      <div>
                        <strong>{reservation.propertyId}</strong>
                        <span className="reservation-room">Room {reservation.roomNumber}</span>
                      </div>
                      <div className="reservation-meta">
                        <span>{formatDate(reservation.arrivalDate)} → {formatDate(reservation.departureDate)}</span>
                        <span className={`reservation-status status-${reservation.status}`}>
                          {reservation.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="reservation-footer">
                        <span className="reservation-confirmation">
                          Confirmation: {reservation.confirmationNumber}
                        </span>
                        <span className="reservation-balance">
                          Balance: {reservation.balance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ProfilePage;
