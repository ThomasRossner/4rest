import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const userName = useAuthStore((s) => s.user?.name || 'User');
  const points = useAuthStore((s) => s.user?.points || 0);
  const logout = useAuthStore((s) => s.logout);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  useEffect(() => {
    const mediaQuery1024 = window.matchMedia('(max-width: 1024px)');
    const mediaQuery480 = window.matchMedia('(max-width: 480px)');
    
    setIsSmallScreen(mediaQuery1024.matches);
    setIsVerySmallScreen(mediaQuery480.matches);

    const handleChange1024 = (e: MediaQueryListEvent) => {
      setIsSmallScreen(e.matches);
    };
    
    const handleChange480 = (e: MediaQueryListEvent) => {
      setIsVerySmallScreen(e.matches);
    };

    mediaQuery1024.addEventListener('change', handleChange1024);
    mediaQuery480.addEventListener('change', handleChange480);
    
    return () => {
      mediaQuery1024.removeEventListener('change', handleChange1024);
      mediaQuery480.removeEventListener('change', handleChange480);
    };
  }, []);

  const navItems = [
    { path: '/tasks', label: 'Tasks', icon: '✅' },
    { path: '/forest', label: 'Forest', icon: '🌲' },
    { path: '/rewards', label: 'Rewards', icon: '🎁' },
    { path: '/statistics', label: 'Statistics', icon: '📈' },
  ];

  return (
    <nav className="navigation">
      <div className="navigation-container">
        <Link 
          to="/" 
          className={`navigation-logo ${location.pathname === '/' ? 'active' : ''}`}
          title={isSmallScreen ? 'Roots of Impact' : undefined}
        >
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
              title={isSmallScreen ? item.label : undefined}
            >
              <span className="navigation-item-icon">{item.icon}</span>
              <span className="navigation-item-label">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="navigation-user">
          <Link 
            to="/profile" 
            className="navigation-user-link"
            title={isVerySmallScreen ? userName : undefined}
          >
            <span className="navigation-user-name">{userName}</span>
            <span className="navigation-user-points">{points} pts</span>
          </Link>
          <button 
            onClick={logout} 
            className="navigation-logout"
            title={isSmallScreen ? 'Logout' : undefined}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
