import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { TeamCreator } from '../Teams/TeamCreator';
import { TeamJoiner } from '../Teams/TeamJoiner';
import { ContestCreator } from '../Contests/ContestCreator';
import { ContestJoiner } from '../Contests/ContestJoiner';
import { TeamQrCodeCarousel } from '../Teams/TeamQrCodeCarousel';
import { ContestQrCodeCarousel } from '../Contests/ContestQrCodeCarousel';
import './UserTeamsContestsSections.css';

export function UserTeamsContestsSections() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation();

  const { data: teams, refetch: refetchTeams } = useQuery(
    ['userTeams', userId],
    () => api.getUserTeams(),
    { enabled: !!userId }
  );

  const isEmployee = user?.role === 'rezeption' || user?.role === 'administrator';

  const { data: contests, refetch: refetchContests } = useQuery(
    ['userContests', userId, isEmployee],
    () => {
      if (isEmployee) {
        return api.getUserContests().then((allContests: any[]) => {
          return allContests.filter(() => true);
        });
      }
      return api.getUserContests();
    },
    { enabled: !!userId }
  );

  const [showTeamCreator, setShowTeamCreator] = useState(false);
  const [showTeamJoiner, setShowTeamJoiner] = useState(false);
  const [showContestCreator, setShowContestCreator] = useState(false);
  const [showContestJoiner, setShowContestJoiner] = useState(false);

  return (
    <>
      <section className="groups-section">
        <div className="groups-section-header">
          <h2>{t('profile.teams.title')}</h2>
          {(!teams || teams.length === 0) && (
            <div className="groups-section-actions">
              <button
                type="button"
                className="groups-action-button glass-btn"
                onClick={() => setShowTeamJoiner(true)}
              >
                {t('profile.teams.joinButton')}
              </button>
              <button
                type="button"
                className="groups-action-button glass-btn"
                onClick={() => setShowTeamCreator(true)}
              >
                {t('profile.teams.createButton')}
              </button>
            </div>
          )}
        </div>
        {showTeamCreator && (
          <TeamCreator
            onSuccess={() => {
              refetchTeams();
              setShowTeamCreator(false);
            }}
            onClose={() => setShowTeamCreator(false)}
          />
        )}
        {showTeamJoiner && (
          <TeamJoiner
            onSuccess={() => {
              refetchTeams();
              setShowTeamJoiner(false);
            }}
            onClose={() => setShowTeamJoiner(false)}
          />
        )}
        {teams && teams.length > 0 ? (
          <div className="groups-list">
            {teams.map((team: any) => (
              <TeamQrCodeCarousel
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                isCreator={team.created_by === userId}
                onDissolve={() => refetchTeams()}
                onLeave={() => refetchTeams()}
              />
            ))}
          </div>
        ) : (
          <p className="groups-empty-state">{t('profile.teams.empty')}</p>
        )}
      </section>

      <section className="groups-section">
        <div className="groups-section-header">
          <h2>{t('profile.contests.title')}</h2>
          <div className="groups-section-actions">
            <button
              type="button"
              className="groups-action-button glass-btn"
              onClick={() => setShowContestJoiner(true)}
            >
              {t('profile.contests.joinButton')}
            </button>
            <button
              type="button"
              className="groups-action-button glass-btn"
              onClick={() => setShowContestCreator(true)}
            >
              {t('profile.contests.createButton')}
            </button>
          </div>
        </div>
        {showContestCreator && (
          <ContestCreator
            onlyEmployeeParticipants={isEmployee}
            onSuccess={() => {
              refetchContests();
              setShowContestCreator(false);
            }}
            onClose={() => setShowContestCreator(false)}
          />
        )}
        {showContestJoiner && (
          <ContestJoiner
            onSuccess={() => {
              refetchContests();
              setShowContestJoiner(false);
            }}
            onClose={() => setShowContestJoiner(false)}
          />
        )}
        {contests && contests.length > 0 ? (
          <div className="groups-list">
            {contests.map((contest: any) => (
              <ContestQrCodeCarousel
                key={contest.id}
                contestId={contest.id}
                contestName={contest.name}
                isCreator={contest.created_by === userId}
                onDissolve={() => refetchContests()}
                onLeave={() => refetchContests()}
              />
            ))}
          </div>
        ) : (
          <p className="groups-empty-state">{t('profile.contests.empty')}</p>
        )}
      </section>
    </>
  );
}
