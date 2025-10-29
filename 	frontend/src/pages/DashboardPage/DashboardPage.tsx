import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import './DashboardPage.css';

function DashboardPage() {
  const { user } = useAuthStore();

  const { data: progress } = useQuery(
    ['userProgress', user?.id],
    () => api.getUserProgress(user!.id),
    { enabled: !!user }
  );

  const { data: tasks } = useQuery(
    ['recentTasks'],
    () => api.getTasks({ limit: 5 }),
    { enabled: !!user }
  );

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-value">{user?.points || 0}</div>
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
          <div className="dashboard-tasks">
            {tasks?.map((task: any) => (
              <div key={task.id} className="dashboard-task-card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <span className="dashboard-task-points">+{task.points} points</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
