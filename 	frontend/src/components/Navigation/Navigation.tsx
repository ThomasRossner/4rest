import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useAuthStore((s) => s.user?.name || 'User');
  const points = useAuthStore((s) => s.user?.points || 0);
  const userRole = useAuthStore((s) => s.user?.role);
  const logout = useAuthStore((s) => s.logout);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  // Generate user initials
  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle click outside and update menu position
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function updateMenuPosition() {
      if (userButtonRef.current) {
        const rect = userButtonRef.current.getBoundingClientRect();
        setMenuStyle({
          position: 'fixed',
          right: `${window.innerWidth - rect.right}px`,
          top: `${rect.bottom + 8}px`,
          zIndex: 99999,
        });
      } else {
        setMenuStyle({});
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateMenuPosition);
      updateMenuPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  const baseNavItems = [
    { path: '/tasks', label: t('navigation.tasks'), icon: '✅' },
    { path: '/forest', label: t('navigation.forest'), icon: '🌲' },
    { path: '/rewards', label: t('navigation.rewards'), icon: '🎁' },
    { path: '/statistics', label: t('navigation.statistics'), icon: '📈' },
  ];
  const navItems =
    userRole === 'administrator'
      ? [...baseNavItems, { path: '/admin', label: t('navigation.admin'), icon: '🛠️' }]
      : baseNavItems;

  return (
    <>
      <nav className="navigation navigation-top">
        <div className="navigation-container">
          <Link
            to="/"
            className={`navigation-logo ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="navigation-logo-icon">🌳</span>
            <span className="navigation-logo-text">{t('common.appName', { defaultValue: 'Roots of Impact' })}</span>
          </Link>
          <div className="navigation-items navigation-items-top">
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
          <div className="navigation-extra">
            <LanguageSwitcher compact className="navigation-language" />
          </div>
          <div className="navigation-user" ref={userMenuRef}>
            <button
              ref={userButtonRef}
              className="navigation-user-button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              title={userName}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="navigation-user-avatar">
                <span className="navigation-user-initials">{getUserInitials(userName)}</span>
              </div>
              <span className="navigation-user-points">
                {t('navigation.points', { count: points })}
              </span>
            </button>
            {isUserMenuOpen && (
              <div className="navigation-user-menu" style={menuStyle}>
                <button
                  className="navigation-user-menu-item"
                  onClick={handleProfileClick}
                >
                  <span className="navigation-user-menu-icon">👤</span>
                  <span>{t('navigation.profile')}</span>
                </button>
                <button
                  className="navigation-user-menu-item navigation-user-menu-item-logout"
                  onClick={handleLogout}
                >
                  <span className="navigation-user-menu-icon">🚪</span>
                  <span>{t('navigation.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <nav className="navigation navigation-bottom">
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
      </nav>
    </>
  );
}

export default Navigation;
