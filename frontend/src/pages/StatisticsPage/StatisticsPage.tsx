import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './StatisticsPage.css';

function StatisticsPage() {
  const { data: stats, isLoading } = useQuery('statistics', () => api.getStatistics(), {
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US';

  if (isLoading) {
    return (
      <div className="statistics-page">
        <h1 className="statistics-title">{t('statistics.title')}</h1>
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics-page">
        <h1 className="statistics-title">{t('statistics.title')}</h1>
        <EmptyState
          title={t('statistics.emptyTitle')}
          description={t('statistics.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <h1 className="statistics-title">{t('statistics.title')}</h1>
      
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

export default StatisticsPage;
