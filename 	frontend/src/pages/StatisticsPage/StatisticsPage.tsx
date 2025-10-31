import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './StatisticsPage.css';

function StatisticsPage() {
  const { data: stats, isLoading } = useQuery('statistics', () => api.getStatistics(), {
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="statistics-page">
        <h1 className="statistics-title">Statistics & Impact</h1>
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics-page">
        <h1 className="statistics-title">Statistics & Impact</h1>
        <EmptyState title="No statistics available" description="Statistics will appear here once tasks are completed." />
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <h1 className="statistics-title">Statistics & Impact</h1>
      
      <div className="statistics-grid">
        <div className="statistics-card">
          <div className="statistics-icon">🌍</div>
          <div className="statistics-value">{stats ? Number(stats.totalCo2Saved ?? 0).toFixed(2) : 0} kg</div>
          <div className="statistics-label">CO₂ Saved</div>
          <div className="statistics-sublabel">
            {stats?.co2SavedPerTask !== undefined ? `~${Number(stats.co2SavedPerTask).toFixed(2)} kg per task` : ''}
          </div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">🌲</div>
          <div className="statistics-value">{stats?.totalTrees || 0}</div>
          <div className="statistics-label">Total Trees</div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">👥</div>
          <div className="statistics-value">{stats?.activeUsers || 0}</div>
          <div className="statistics-label">Active Users</div>
          <div className="statistics-sublabel">Last 30 days</div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">✅</div>
          <div className="statistics-value">{stats?.tasksCompleted || 0}</div>
          <div className="statistics-label">Tasks Completed</div>
        </div>
        <div className="statistics-card">
          <div className="statistics-icon">⭐</div>
          <div className="statistics-value">{stats ? Number(stats.averagePointsPerUser ?? 0).toFixed(0) : 0}</div>
          <div className="statistics-label">Avg Points/User</div>
        </div>
      </div>

      {stats?.dailyStats && stats.dailyStats.length > 0 && (
        <div className="statistics-section">
          <h2>Daily Progress (Last 30 Days)</h2>
          <div className="daily-stats-chart">
            {stats.dailyStats.slice(0, 7).map((day: any, idx: number) => (
              <div key={day.date || idx} className="daily-stat-bar">
                <div className="daily-stat-date">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="daily-stat-value">
                  <div className="daily-stat-tasks">{day.tasksCompleted}</div>
                  <div className="daily-stat-co2">{Number(day.co2Saved ?? 0).toFixed(1)} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.teamProgress && stats.teamProgress.length > 0 && (
        <div className="statistics-section">
          <h2>Team Leaderboard</h2>
          <div className="statistics-team">
            <div className="leaderboard">
              {stats.teamProgress.map((member: any, index: number) => (
                <div key={member.id} className="leaderboard-item">
                  <div className="leaderboard-rank">#{index + 1}</div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{member.name}</div>
                    <div className="leaderboard-stats">
                      {Number(member.tasks_completed ?? 0)} tasks • {Number(member.total_points ?? 0)} pts
                    </div>
                  </div>
                  <div className="leaderboard-co2">
                    {Number(member.co2_saved ?? 0).toFixed(1)} kg CO₂
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
