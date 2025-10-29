import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './HomePage.css';

function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">Welcome to Roots of Impact</h1>
        <p className="home-subtitle">
          Grow your virtual forest through sustainable actions
        </p>
        {user && (
          <div className="home-stats">
            <div className="home-stat">
              <span className="home-stat-value">{user.points}</span>
              <span className="home-stat-label">Points</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-value">🌲</span>
              <span className="home-stat-label">Your Trees</span>
            </div>
          </div>
        )}
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
    </div>
  );
}

export default HomePage;
