import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { ConsentManager } from '../../components/GDPR/ConsentManager';
import { UserQrCodeDisplay } from '../../components/Teams/UserQrCodeDisplay';
import { TeamCreator } from '../../components/Teams/TeamCreator';
import { ContestCreator } from '../../components/Contests/ContestCreator';
import { TeamQrCodeCarousel } from '../../components/Teams/TeamQrCodeCarousel';
import { ContestQrCodeCarousel } from '../../components/Contests/ContestQrCodeCarousel';
import './ProfilePage.css';

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const points = useAuthStore((s) => s.user?.points || 0);
  const [showConsent, setShowConsent] = useState(false);
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US';

  const { data: progress } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  const { data: teams, refetch: refetchTeams } = useQuery(
    ['userTeams', userId],
    () => api.getUserTeams(),
    { enabled: !!userId }
  );

  const { data: contests, refetch: refetchContests } = useQuery(
    ['userContests', userId],
    () => api.getUserContests(),
    { enabled: !!userId }
  );

  const [showTeamCreator, setShowTeamCreator] = useState(false);
  const [showContestCreator, setShowContestCreator] = useState(false);

  const sihotGuest = user?.sihotGuest;
  const sihotReservations = user?.sihotReservations ?? [];

  const formatDate = (value: string) => {
    if (!value) return t('profile.sihot.missing');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(locale);
  };

  return (
    <div className="profile-page">
      <h1 className="profile-title">{t('profile.title')}</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || t('profile.noEmail')}</p>
            <span className="profile-role">
              {user?.role ? t('profile.role', { role: user.role }) : t('profile.role', { role: 'guest' })}
            </span>
          </div>
        </div>
          <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{points}</span>
            <span className="profile-stat-label">{t('profile.stats.points')}</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">
              🌲 {progress?.treesPlanted || 0}
            </span>
            <span className="profile-stat-label">{t('profile.stats.trees')}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button
            onClick={() => setShowConsent(!showConsent)}
            className="privacy-button"
          >
            {showConsent ? t('profile.privacy.hide') : t('profile.privacy.show')}
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
            <h2>{t('profile.sihot.title')}</h2>
            {user?.sihotGuestId && (
              <span className="profile-sihot-badge">
                {t('profile.sihot.guestId', { id: user.sihotGuestId })}
              </span>
            )}
          </div>

          <dl className="profile-sihot-grid">
            <div>
              <dt>{t('profile.sihot.fields.name')}</dt>
              <dd>
                {sihotGuest.firstName} {sihotGuest.lastName}
              </dd>
            </div>
            <div>
              <dt>{t('profile.sihot.fields.email')}</dt>
              <dd>{sihotGuest.email || user?.email || t('profile.sihot.missing')}</dd>
            </div>
            <div>
              <dt>{t('profile.sihot.fields.phone')}</dt>
              <dd>{sihotGuest.phone || t('profile.sihot.missing')}</dd>
            </div>
            <div>
              <dt>{t('profile.sihot.fields.loyaltyLevel')}</dt>
              <dd>{sihotGuest.loyaltyLevel || t('profile.sihot.missing')}</dd>
            </div>
            <div>
              <dt>{t('profile.sihot.fields.language')}</dt>
              <dd>{sihotGuest.language || t('profile.sihot.missing')}</dd>
            </div>
            <div>
              <dt>{t('profile.sihot.fields.preferences')}</dt>
              <dd>
                {sihotGuest.preferences?.length
                  ? sihotGuest.preferences.join(', ')
                  : t('profile.sihot.missing')}
              </dd>
            </div>
          </dl>

          {sihotGuest.notes && (
            <div className="profile-sihot-notes">
              <h3>{t('profile.sihot.fields.notes')}</h3>
              <p>{sihotGuest.notes}</p>
            </div>
          )}

          {sihotReservations.length > 0 && (
            <div className="profile-sihot-reservations">
              <h3>{t('profile.sihot.reservations.title')}</h3>
              <ul>
                {sihotReservations.map((reservation) => (
                  <li key={reservation.reservationId}>
                    <div className="reservation-row">
                      <div>
                        <strong>{reservation.propertyId}</strong>
                        <span className="reservation-room">
                          {t('profile.sihot.reservations.room', { room: reservation.roomNumber })}
                        </span>
                      </div>
                      <div className="reservation-meta">
                        <span>
                          {formatDate(reservation.arrivalDate)} → {formatDate(reservation.departureDate)}
                        </span>
                        <span className={`reservation-status status-${reservation.status}`}>
                          {reservation.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="reservation-footer">
                        <span className="reservation-confirmation">
                          {t('profile.sihot.reservations.confirmation', {
                            number: reservation.confirmationNumber,
                          })}
                        </span>
                        <span className="reservation-balance">
                          {t('profile.sihot.reservations.balance', {
                            amount: reservation.balance.toFixed(2),
                          })}
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

      {/* Personal QR Code */}
      <section className="profile-section">
        <h2>{t('profile.qrCode.sectionTitle') || 'Personal QR Code'}</h2>
        <UserQrCodeDisplay />
      </section>

      {/* Teams */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h2>{t('profile.teams.title') || 'My Teams'}</h2>
          <button
            type="button"
            className="profile-action-button"
            onClick={() => setShowTeamCreator(true)}
          >
            {t('profile.teams.createButton') || 'Create Team'}
          </button>
        </div>
        {showTeamCreator && (
          <TeamCreator
            onSuccess={(teamId) => {
              refetchTeams();
              setShowTeamCreator(false);
            }}
            onClose={() => setShowTeamCreator(false)}
          />
        )}
        {teams && teams.length > 0 ? (
          <div className="profile-teams-list">
            {teams.map((team: any) => (
              <TeamQrCodeCarousel
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                isCreator={team.created_by === userId}
                onDissolve={() => refetchTeams()}
              />
            ))}
          </div>
        ) : (
          <p className="profile-empty-state">{t('profile.teams.empty') || 'No teams yet. Create one by scanning another user\'s QR code!'}</p>
        )}
      </section>

      {/* Contests */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h2>{t('profile.contests.title') || 'My Contests'}</h2>
          <button
            type="button"
            className="profile-action-button"
            onClick={() => setShowContestCreator(true)}
          >
            {t('profile.contests.createButton') || 'Create Contest'}
          </button>
        </div>
        {showContestCreator && (
          <ContestCreator
            onSuccess={(contestId) => {
              refetchContests();
              setShowContestCreator(false);
            }}
            onClose={() => setShowContestCreator(false)}
          />
        )}
        {contests && contests.length > 0 ? (
          <div className="profile-contests-list">
            {contests.map((contest: any) => (
              <ContestQrCodeCarousel
                key={contest.id}
                contestId={contest.id}
                contestName={contest.name}
                isCreator={contest.created_by === userId}
                onDissolve={() => refetchContests()}
              />
            ))}
          </div>
        ) : (
          <p className="profile-empty-state">{t('profile.contests.empty') || 'No contests yet. Create one by scanning another user\'s QR code!'}</p>
        )}
      </section>
    </div>
  );
}

export default ProfilePage;
