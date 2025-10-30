import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const userName = useAuthStore((s) => s.user?.name || 'User');
  const points = useAuthStore((s) => s.user?.points || 0);
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tasks', label: 'Tasks', icon: '✅' },
    { path: '/forest', label: 'Forest', icon: '🌲' },
    { path: '/rewards', label: 'Rewards', icon: '🎁' },
    { path: '/statistics', label: 'Statistics', icon: '📈' },
  ];

  return (
    <nav className="navigation">
      <div className="navigation-container">
        <Link to="/" className="navigation-logo">
          <span className="navigation-logo-icon">🌳</span>
          <span className="navigation-logo-text">Roots of Impact</span>
        </Link>
        <div className="navigation-items">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navigation-item ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="navigation-item-icon">{item.icon}</span>
              <span className="navigation-item-label">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="navigation-user">
          <Link to="/profile" className="navigation-user-link">
            <span className="navigation-user-name">{userName}</span>
            <span className="navigation-user-points">{points} pts</span>
          </Link>
          <button onClick={logout} className="navigation-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
