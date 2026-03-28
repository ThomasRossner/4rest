import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './ContestRankingPage.css';

function ContestRankingPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation();

  const { data: contest, isLoading: contestLoading } = useQuery(
    ['contestDetails', contestId],
    () => api.getContestDetails(contestId!),
    { enabled: !!contestId }
  );

  const { data: ranking, isLoading: rankingLoading } = useQuery(
    ['contestRanking', contestId],
    () => api.getContestRanking(contestId!),
    { enabled: !!contestId, refetchInterval: 5000 } // Refetch every 5 seconds for real-time updates
  );

  const isLoading = contestLoading || rankingLoading;

  if (isLoading) {
    return (
      <div className="contest-ranking-page">
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="contest-ranking-page">
        <div className="contest-ranking-header">
          <button
            className="contest-ranking-back"
            onClick={() => navigate('/')}
          >
            ← {t('common.actions.back')}
          </button>
        </div>
        <EmptyState
          title={t('contests.ranking.notFound')}
          description={t('contests.ranking.notFoundDescription')}
        />
      </div>
    );
  }

  const endDate = new Date(contest.end_date);
  const now = new Date();
  const timeRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.ceil((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const userRank = ranking?.findIndex((entry: any) => entry.user_id === userId) ?? -1;
  const userEntry = userRank >= 0 ? ranking?.[userRank] : null;

  return (
    <div className="contest-ranking-page">
      <div className="contest-ranking-header">
        <button
          className="contest-ranking-back"
          onClick={() => navigate('/')}
        >
          ← {t('common.actions.back')}
        </button>
        <h2 className="contest-ranking-title">{contest.name || t('contests.ranking.unnamed')}</h2>
      </div>

      <div className="contest-ranking-info">
        <div className="contest-ranking-time">
          <span className="contest-ranking-time-label">{t('contests.ranking.timeRemaining')}:</span>
          <span className="contest-ranking-time-value">
            {timeRemaining > 0 ? (
              <>
                {daysRemaining > 0 && `${daysRemaining} ${t('contests.ranking.days')} `}
                {hoursRemaining > 0 && `${hoursRemaining} ${t('contests.ranking.hours')} `}
                {minutesRemaining > 0 && `${minutesRemaining} ${t('contests.ranking.minutes')}`}
              </>
            ) : (
              t('contests.ranking.ended')
            )}
          </span>
        </div>
      </div>

      {ranking && ranking.length > 0 ? (
        <div className="contest-ranking-list">
          <div className="contest-ranking-list-header">
            <div className="contest-ranking-list-header-rank">{t('contests.ranking.rank')}</div>
            <div className="contest-ranking-list-header-name">{t('contests.ranking.name')}</div>
            <div className="contest-ranking-list-header-points">{t('contests.ranking.points')}</div>
          </div>
          {ranking.map((entry: any, index: number) => (
            <div
              key={entry.user_id}
              className={`contest-ranking-entry ${entry.user_id === userId ? 'contest-ranking-entry-current' : ''}`}
            >
              <div className="contest-ranking-entry-rank">
                {entry.rank === 1 && '🥇'}
                {entry.rank === 2 && '🥈'}
                {entry.rank === 3 && '🥉'}
                {entry.rank > 3 && entry.rank}
              </div>
              <div className="contest-ranking-entry-name">
                {entry.user_name}
                {entry.user_id === userId && (
                  <span className="contest-ranking-entry-you"> ({t('contests.ranking.you')})</span>
                )}
              </div>
              <div className="contest-ranking-entry-points">{entry.points}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('contests.ranking.noParticipants')}
          description={t('contests.ranking.noParticipantsDescription')}
        />
      )}
    </div>
  );
}

export default ContestRankingPage;

