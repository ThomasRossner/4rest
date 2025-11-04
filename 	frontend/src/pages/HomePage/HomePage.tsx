import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import './HomePage.css';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const userPoints = useAuthStore((s) => s.user?.points || 0);

  const { data: progress, isLoading: progressLoading } = useQuery(
    ['userProgress', userId],
    () => api.getUserProgress(userId as string),
    { enabled: !!userId }
  );

  if (progressLoading && !progress) {
    return (
      <div className="home-page">
        <div className="home-hero">
          <h1 className="home-title">Welcome to Roots of Impact</h1>
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">Welcome to Roots of Impact</h1>
        <p className="home-subtitle">
          Grow your virtual forest through sustainable actions
        </p>
      </div>
      
      {user && (
        <div className="home-content">
          <section className="home-section">
            <div className="home-section-header">
              <h2 className="home-section-title">Your Impact</h2>
              <p className="home-section-subtitle">Track your sustainability progress</p>
            </div>
            <div className="home-stats">
              <div className="home-stat">
                <div className="home-stat-icon">⭐</div>
                <span className="home-stat-value">{userPoints}</span>
                <span className="home-stat-label">Total Points</span>
              </div>
              <div className="home-stat">
                <div className="home-stat-icon">🌲</div>
                <span className="home-stat-value">{progress?.treesPlanted || 0}</span>
                <span className="home-stat-label">Trees Planted</span>
              </div>
              <div className="home-stat">
                <div className="home-stat-icon">✅</div>
                <span className="home-stat-value">{progress?.tasksCompleted || 0}</span>
                <span className="home-stat-label">Tasks Completed</span>
              </div>
              <div className="home-stat">
                <div className="home-stat-icon">🌍</div>
                <span className="home-stat-value">{progress?.co2Saved ? `${progress.co2Saved.toFixed(1)} kg` : '0 kg'}</span>
                <span className="home-stat-label">CO₂ Saved</span>
              </div>
            </div>
          </section>
          
          <section className="home-section home-section-actions">
            <div className="home-section-header">
              <h2 className="home-section-title">Quick Actions</h2>
              <p className="home-section-subtitle">Continue your sustainability journey</p>
            </div>
            <div className="home-actions">
              <Link to="/tasks" className="home-action-card">
                <span className="home-action-icon">✅</span>
                <h3>Complete Tasks</h3>
                <p>Earn points by completing sustainability challenges</p>
              </Link>
              <Link to="/forest" className="home-action-card">
                <span className="home-action-icon">🌲</span>
                <h3>Visit Forest</h3>
                <p>Watch your trees grow in the virtual forest</p>
              </Link>
              <Link to="/rewards" className="home-action-card">
                <span className="home-action-icon">🎁</span>
                <h3>Redeem Rewards</h3>
                <p>Exchange points for discounts and benefits</p>
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default HomePage;
