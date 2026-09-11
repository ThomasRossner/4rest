import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { ConsentManager } from '../../components/GDPR/ConsentManager';
import { TimelineChart } from '../../components/Statistics/TimelineChart';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { getUserInitials } from '../../utils/userInitials';
import PlayerProfileOnboarding from '../../components/PlayerProfile/PlayerProfileOnboarding';
import PlayerProfileTypeModal from '../../components/PlayerProfile/PlayerProfileTypeModal';
import type { OnboardingConfig } from '../../types/onboarding';
import { resolveOnboardingBackgroundUrl } from '../../utils/onboardingBackgroundUrl';
import { getPlayerCharacterEmoji, getPlayerCharacterIconUrl } from '../../constants/playerCharacter';
import './ProfilePage.css';

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const points = useAuthStore((s) => s.user?.points || 0);
  const [showConsent, setShowConsent] = useState(false);
  const [languageSaving, setLanguageSaving] = useState(false);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US';

  const { data: progress } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  const { data: timeline, isLoading: timelineLoading } = useQuery(
    ['userTimeline', userId],
    () => api.getUserTimeline(userId as string),
    { enabled: !!userId }
  );

  // Get active team and total points
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 } // Refetch every 5 seconds to keep team points updated in real-time
  );
  const { data: onboardingConfig } = useQuery(
    'onboardingConfig',
    () => api.getOnboardingConfig() as Promise<OnboardingConfig>,
    { staleTime: 5 * 60 * 1000 }
  );

  const [showPlayerTypeModal, setShowPlayerTypeModal] = useState(false);
  const [showPlayerRetake, setShowPlayerRetake] = useState(false);

  const sihotGuest = user?.sihotGuest;
  const sihotReservations = user?.sihotReservations ?? [];
  const profileCharacterIcon = resolveOnboardingBackgroundUrl(
    getPlayerCharacterIconUrl(user?.playerProfile, onboardingConfig?.characterIcons)
  );

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
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="profile-avatar-initials">
              {getUserInitials(user?.name || 'User')}
            </span>
          </div>
          <div className="profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || t('profile.noEmail')}</p>
            <div className="profile-preferences-row">
              <div className="profile-language profile-language--inline">
                <span className="profile-language-label">{t('profile.language.label')}</span>
                <div className="profile-language-buttons">
                <button
                  type="button"
                  className={`profile-language-btn ${(user?.preferredLanguage || i18n.language || 'de').startsWith('de') ? 'active' : ''}`}
                  onClick={async () => {
                    if (!userId || (user?.preferredLanguage || 'de') === 'de') return;
                    setLanguageSaving(true);
                    try {
                      await api.updateUserProfile(userId, { preferredLanguage: 'de' });
                      i18n.changeLanguage('de');
                      await api.refreshMe();
                      // Content (tasks, rewards, teams, contests) is resolved by backend from preferred_language – refetch so UI shows new language
                      await Promise.all([
                        queryClient.invalidateQueries('tasks'),
                        queryClient.invalidateQueries('rewards'),
                        queryClient.invalidateQueries(['task']),
                        queryClient.invalidateQueries(['userActiveTeam', userId]),
                        queryClient.invalidateQueries(['userTeams', userId]),
                        queryClient.invalidateQueries(['userContests']),
                      ]);
                    } finally {
                      setLanguageSaving(false);
                    }
                  }}
                  disabled={languageSaving}
                >
                  {t('language.de')}
                </button>
                <button
                  type="button"
                  className={`profile-language-btn ${(user?.preferredLanguage || i18n.language || 'de') === 'en' ? 'active' : ''}`}
                  onClick={async () => {
                    if (!userId || user?.preferredLanguage === 'en') return;
                    setLanguageSaving(true);
                    try {
                      await api.updateUserProfile(userId, { preferredLanguage: 'en' });
                      i18n.changeLanguage('en');
                      await api.refreshMe();
                      // Content (tasks, rewards, teams, contests) is resolved by backend from preferred_language – refetch so UI shows new language
                      await Promise.all([
                        queryClient.invalidateQueries('tasks'),
                        queryClient.invalidateQueries('rewards'),
                        queryClient.invalidateQueries(['task']),
                        queryClient.invalidateQueries(['userActiveTeam', userId]),
                        queryClient.invalidateQueries(['userTeams', userId]),
                        queryClient.invalidateQueries(['userContests']),
                      ]);
                    } finally {
                      setLanguageSaving(false);
                    }
                  }}
                  disabled={languageSaving}
                >
                  {t('language.en')}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
          <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">
              {activeTeam?.totalPoints !== undefined ? (
                <>
                  {activeTeam.totalPoints} / {points}
                </>
              ) : (
                points
              )}
            </span>
            <span className="profile-stat-label">
              {activeTeam?.totalPoints !== undefined 
                ? t('profile.stats.teamPoints')
                : t('profile.stats.points')
              }
            </span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">
              🌲 {progress?.treesPlanted || 0}
            </span>
            <span className="profile-stat-label">{t('profile.stats.trees')}</span>
          </div>
        </div>

        {user?.role === 'guest' && user.playerProfile && (
          <>
            <div className="profile-player-section">
              <div className="profile-player-section__title-row">
                <h3 className="profile-player-section__title">{t('playerProfile.profileSection.title')}</h3>
                <div className="profile-player-section__character" aria-label={t('playerProfile.profileSection.title')}>
                  {profileCharacterIcon ? (
                    <img src={profileCharacterIcon} alt="" className="profile-player-section__icon-image" aria-hidden />
                  ) : (
                    <span className="profile-player-section__emoji" aria-hidden>
                      {getPlayerCharacterEmoji(user.playerProfile)}
                    </span>
                  )}
                  {user.playerProfile?.profileDisplayName?.trim() && (
                    <span className="profile-player-section__name">
                      {user.playerProfile.profileDisplayName.trim()}
                    </span>
                  )}
                </div>
              </div>
              <div className="profile-player-section__content">
                <span className="profile-role">
                  {user?.role ? t('profile.role', { role: user.role }) : t('profile.role', { role: 'guest' })}
                </span>
                <div className="profile-player-section__actions">
                  <button
                    type="button"
                    className="profile-player-section__btn"
                    onClick={() => setShowPlayerTypeModal(true)}
                  >
                    {t('playerProfile.moreAbout.shortCta')}
                  </button>
                  <button
                    type="button"
                    className="profile-player-section__btn"
                    onClick={() => setShowPlayerRetake(true)}
                  >
                    {t('playerProfile.profileSection.retake')}
                  </button>
                </div>
              </div>
            </div>
            {showPlayerTypeModal && user.playerProfile && (
              <PlayerProfileTypeModal
                profile={user.playerProfile}
                onClose={() => setShowPlayerTypeModal(false)}
              />
            )}
            {showPlayerRetake && (
              <PlayerProfileOnboarding
                variant="inline"
                initialProfile={user.playerProfile}
                onDone={() => {
                  setShowPlayerRetake(false);
                  void api.refreshMe();
                }}
              />
            )}
          </>
        )}

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

      {!showPlayerRetake && timelineLoading && (
        <section className="profile-section profile-timeline-section">
          <LoadingSkeleton lines={6} />
        </section>
      )}

      {!showPlayerRetake && !timelineLoading && timeline && timeline.length > 0 && (
        <section className="profile-section profile-timeline-section">
          <h2 className="profile-timeline-title">{t('rankings.timeline.title')}</h2>
          <TimelineChart data={timeline} profileTotalPoints={points} />
        </section>
      )}
    </div>
  );
}

export default ProfilePage;
