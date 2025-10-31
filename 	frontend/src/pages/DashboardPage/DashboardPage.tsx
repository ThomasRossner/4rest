import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './DashboardPage.css';

function DashboardPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const userPoints = useAuthStore((s) => s.user?.points || 0);

  const { data: progress, isLoading: progressLoading } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  const { data: tasks, isLoading: tasksLoading } = useQuery(
    ['recentTasks'],
    () => api.getTasks({ limit: 5 }),
    { enabled: !!userId }
  );

  if (progressLoading && !progress) {
    return (
      <div className="dashboard-page">
        <h1 className="dashboard-title">Dashboard</h1>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-value">{userPoints}</div>
            <div className="dashboard-stat-label">Total Points</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-value">{progress?.treesPlanted || 0}</div>
            <div className="dashboard-stat-label">Trees Planted</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-value">{progress?.tasksCompleted || 0}</div>
            <div className="dashboard-stat-label">Tasks Completed</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-value">{progress?.co2Saved || 0} kg</div>
            <div className="dashboard-stat-label">CO₂ Saved</div>
          </div>
        </div>
        <div className="dashboard-section">
          <h2>Recent Tasks</h2>
          {tasksLoading ? (
            <LoadingSkeleton lines={3} />
          ) : tasks && tasks.length > 0 ? (
            <div className="dashboard-tasks">
              {tasks.map((task: any) => (
                <div key={task.id} className="dashboard-task-card">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <span className="dashboard-task-points">+{task.points} points</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent tasks" description="Complete some tasks to see them here." />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
