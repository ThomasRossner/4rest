import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { TimelineChart } from '../../components/Statistics/TimelineChart';
import './StatisticsPage.css';

function StatisticsPage() {
  const userRole = useAuthStore((s) => s.user?.role);
  const isGuest = userRole === 'guest';
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US';

  // For guests: show rankings view
  // For others: show statistics view
  if (isGuest) {
    return <RankingsPage />;
  }

  // Original statistics view for non-guests
  const { data: stats, isLoading } = useQuery('statistics', () => api.getStatistics(), {
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="statistics-page">
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics-page">
        <EmptyState
          title={t('statistics.emptyTitle')}
          description={t('statistics.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-grid">
        <div className="statistics-card">
          <div className="statistics-icon">🌍</div>
          <div className="statistics-value">{stats ? Number(stats.totalCo2Saved ?? 0).toFixed(2) : 0} kg</div>
          <div className="statistics-label">{t('statistics.cards.co2Saved')}</div>
          <div className="statistics-sublabel">
            {stats?.co2SavedPerTask !== undefined
              ? t('statistics.cards.co2PerTask', {
                  value: Number(stats.co2SavedPerTask).toFixed(2),
                })
              : ''}
          </div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">🌲</div>
          <div className="statistics-value">{stats?.totalTrees || 0}</div>
          <div className="statistics-label">{t('statistics.cards.trees')}</div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">👥</div>
          <div className="statistics-value">{stats?.activeUsers || 0}</div>
          <div className="statistics-label">{t('statistics.cards.activeUsers')}</div>
          <div className="statistics-sublabel">{t('statistics.cards.activeUsersSubtitle')}</div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">✅</div>
          <div className="statistics-value">{stats?.tasksCompleted || 0}</div>
          <div className="statistics-label">{t('statistics.cards.tasksCompleted')}</div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">⭐</div>
          <div className="statistics-value">{stats ? Number(stats.averagePointsPerUser ?? 0).toFixed(0) : 0}</div>
          <div className="statistics-label">{t('statistics.cards.avgPoints')}</div>
        </div>
      </div>

      {stats?.dailyStats && stats.dailyStats.length > 0 && (
        <div className="statistics-section">
          <h2>{t('statistics.dailyProgress')}</h2>
          <div className="daily-stats-chart">
            {stats.dailyStats.slice(0, 7).map((day: any, idx: number) => (
              <div key={day.date || idx} className="daily-stat-bar">
                <div className="daily-stat-date">
                  {new Date(day.date).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="daily-stat-value">
                  <div className="daily-stat-tasks">{day.tasksCompleted}</div>
                  <div className="daily-stat-co2">
                    {t('statistics.leaderboard.co2', {
                      value: Number(day.co2Saved ?? 0).toFixed(1),
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.teamProgress && stats.teamProgress.length > 0 && (
        <div className="statistics-section">
          <h2>{t('statistics.teamLeaderboard')}</h2>
          <div className="statistics-team">
            <div className="leaderboard">
              {stats.teamProgress.map((member: any, index: number) => (
                <div key={member.id} className="leaderboard-item">
                  <div className="leaderboard-rank">#{index + 1}</div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{member.name}</div>
                    <div className="leaderboard-stats">
                      {t('statistics.leaderboard.tasks', {
                        count: Number(member.tasks_completed ?? 0),
                      })}{' '}
                      •{' '}
                      {t('statistics.leaderboard.points', {
                        count: Number(member.total_points ?? 0),
                      })}
                    </div>
                  </div>
                  <div className="leaderboard-co2">
                    {t('statistics.leaderboard.co2', {
                      value: Number(member.co2_saved ?? 0).toFixed(1),
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Rankings page for guests
function RankingsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const profilePoints = useAuthStore((s) => s.user?.points ?? 0);
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US';
  const [expandedContests, setExpandedContests] = useState<Set<string>>(new Set());
  const [expandedTeam, setExpandedTeam] = useState(false);

  // Get user's contests (active and expired) for rankings page
  const { data: contests } = useQuery(
    ['allUserContests', userId],
    () => api.getAllUserContests(),
    { enabled: !!userId, refetchInterval: 5000 }
  );

  // Separate active and expired contests
  const activeContests = contests?.filter((c: any) => {
    const endDate = new Date(c.end_date);
    return endDate > new Date() && c.active;
  }) || [];

  const expiredContests = contests?.filter((c: any) => {
    const endDate = new Date(c.end_date);
    return endDate <= new Date() && c.active;
  }) || [];

  // Get user's active team
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 }
  );

  // Get rankings for active contests
  const activeContestRankingsQueries = useQuery(
    ['contestRankings', activeContests.map((c: any) => c.id)],
    async () => {
      const rankings = await Promise.all(
        activeContests.map(async (contest: any) => {
          const ranking = await api.getContestRanking(contest.id);
          return {
            ...contest,
            ranking,
          };
        })
      );
      return rankings;
    },
    { enabled: activeContests.length > 0, refetchInterval: 5000 }
  );

  // Get rankings for expired contests
  const expiredContestRankingsQueries = useQuery(
    ['expiredContestRankings', expiredContests.map((c: any) => c.id)],
    async () => {
      const rankings = await Promise.all(
        expiredContests.map(async (contest: any) => {
          const ranking = await api.getContestRanking(contest.id);
          return {
            ...contest,
            ranking,
          };
        })
      );
      return rankings;
    },
    { enabled: expiredContests.length > 0 }
  );

  const activeContestsWithRankings = activeContestRankingsQueries.data || [];
  const expiredContestsWithRankings = expiredContestRankingsQueries.data || [];

  // Get team ranking if user is in a team
  const { data: teamRanking } = useQuery(
    ['teamRanking', activeTeam?.id],
    () => api.getTeamRanking(activeTeam!.id),
    { enabled: !!activeTeam?.id, refetchInterval: 5000 }
  );

  // Get timeline data
  const { data: timeline } = useQuery(
    ['userTimeline', userId],
    () => api.getUserTimeline(userId!),
    { enabled: !!userId }
  );

  const toggleContestExpanded = (contestId: string) => {
    const newSet = new Set(expandedContests);
    if (newSet.has(contestId)) {
      newSet.delete(contestId);
    } else {
      newSet.add(contestId);
    }
    setExpandedContests(newSet);
  };

  return (
    <div className="rankings-page">
      {/* Active Contests */}
      {activeContestsWithRankings.length > 0 && (
        <section className="rankings-section">
          <h2 className="rankings-section-title">{t('rankings.contests.title')}</h2>
          {activeContestsWithRankings.map((contest: any) => {
            const isExpanded = expandedContests.has(contest.id);
            const top5 = contest.ranking.slice(0, 5);
            const hasMore = contest.ranking.length > 5;
            const displayRanking = isExpanded ? contest.ranking : top5;

            const startDate = new Date(contest.start_date);
            const endDate = new Date(contest.end_date);

            return (
              <div key={contest.id} className="rankings-contest-card">
                <div className="rankings-contest-header">
                  <h3 className="rankings-contest-name">{contest.name || t('rankings.contests.unnamed')}</h3>
                  <div className="rankings-contest-duration">
                    {t('rankings.contests.duration')}: {startDate.toLocaleDateString(dateLocale)} - {endDate.toLocaleDateString(dateLocale)}
                  </div>
                </div>
                <div className="rankings-list">
                  {displayRanking.map((entry: any) => (
                    <div key={entry.user_id} className="rankings-item">
                      <div className="rankings-rank">#{entry.rank}</div>
                      <div className="rankings-name">{entry.user_name}</div>
                      <div className="rankings-points">{entry.points} {t('rankings.points')}</div>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <button
                    className="rankings-expand-button"
                    onClick={() => toggleContestExpanded(contest.id)}
                  >
                    {isExpanded
                      ? t('rankings.contests.showLess')
                      : t('rankings.contests.showAll', { count: contest.ranking.length })}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Expired Contests */}
      {expiredContestsWithRankings.length > 0 && (
        <section className="rankings-section">
          <h2 className="rankings-section-title">{t('rankings.contests.expired')}</h2>
          {expiredContestsWithRankings.map((contest: any) => {
            const startDate = new Date(contest.start_date);
            const endDate = new Date(contest.end_date);

            return (
              <div key={contest.id} className="rankings-contest-card">
                <div className="rankings-contest-header">
                  <h3 className="rankings-contest-name">{contest.name || t('rankings.contests.unnamed')}</h3>
                  <div className="rankings-contest-duration">
                    {t('rankings.contests.duration')}: {startDate.toLocaleDateString(dateLocale)} - {endDate.toLocaleDateString(dateLocale)}
                  </div>
                </div>
                <div className="rankings-list">
                  {contest.ranking && contest.ranking.length > 0 ? (
                    contest.ranking.map((entry: any) => (
                      <div key={entry.user_id} className="rankings-item">
                        <div className="rankings-rank">#{entry.rank}</div>
                        <div className="rankings-name">{entry.user_name}</div>
                        <div className="rankings-points">{entry.points} {t('rankings.points')}</div>
                      </div>
                    ))
                  ) : (
                    <p className="rankings-empty">{t('rankings.contests.noParticipants')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Team Ranking */}
      {activeTeam && teamRanking && (
        <section className="rankings-section">
          <h2 className="rankings-section-title">{t('rankings.team.title')}</h2>
          <div className="rankings-team-card">
            <div className="rankings-team-header">
              <h3 className="rankings-team-name">{activeTeam.name || t('rankings.team.unnamed')}</h3>
            </div>
            <div className="rankings-list">
              {(expandedTeam ? teamRanking : teamRanking.slice(0, 5)).map((entry: any) => (
                <div key={entry.user_id} className="rankings-item">
                  <div className="rankings-rank">#{entry.rank}</div>
                  <div className="rankings-name">{entry.user_name}</div>
                  <div className="rankings-points">{entry.points} {t('rankings.points')}</div>
                </div>
              ))}
            </div>
            {teamRanking.length > 5 && (
              <button
                className="rankings-expand-button"
                onClick={() => setExpandedTeam(!expandedTeam)}
              >
                {expandedTeam
                  ? t('rankings.team.showLess')
                  : t('rankings.team.showAll', `Alle ${teamRanking.length} Mitglieder anzeigen`)}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <section className="rankings-section">
          <h2 className="rankings-section-title">{t('rankings.timeline.title')}</h2>
          <div className="rankings-timeline-card">
            <TimelineChart data={timeline} profileTotalPoints={profilePoints} />
          </div>
        </section>
      )}
    </div>
  );
}

export default StatisticsPage;
