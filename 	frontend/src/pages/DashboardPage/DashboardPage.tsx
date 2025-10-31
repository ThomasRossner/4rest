import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import './DashboardPage.css';

function DashboardPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const userPoints = useAuthStore((s) => s.user?.points || 0);

  const { data: progress, isLoading: progressLoading } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  if (progressLoading && !progress) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-hero">
          <h1 className="dashboard-title">Welcome to Roots of Impact</h1>
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Welcome to Roots of Impact</h1>
        <p className="dashboard-subtitle">
          Grow your virtual forest through sustainable actions
        </p>
      </div>
      
      <div className="dashboard-content">
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Your Impact</h2>
            <p className="dashboard-section-subtitle">Track your sustainability progress</p>
          </div>
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
        </section>
        
        <section className="dashboard-section dashboard-section-actions">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Quick Actions</h2>
            <p className="dashboard-section-subtitle">Continue your sustainability journey</p>
          </div>
          <div className="dashboard-actions">
            <Link to="/tasks" className="dashboard-action-card">
              <span className="dashboard-action-icon">✅</span>
              <h3>Complete Tasks</h3>
              <p>Earn points by completing sustainability challenges</p>
            </Link>
            <Link to="/forest" className="dashboard-action-card">
              <span className="dashboard-action-icon">🌲</span>
              <h3>Visit Forest</h3>
              <p>Watch your trees grow in the virtual forest</p>
            </Link>
            <Link to="/rewards" className="dashboard-action-card">
              <span className="dashboard-action-icon">🎁</span>
              <h3>Redeem Rewards</h3>
              <p>Exchange points for discounts and benefits</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
