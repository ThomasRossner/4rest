import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { PointsBonusScanner } from '../Rewards/PointsBonusScanner';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useAuthStore((s) => s.user?.name || 'User');
  const points = useAuthStore((s) => s.user?.points || 0);
  const userRole = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);
  const logout = useAuthStore((s) => s.logout);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showPointsBonusScanner, setShowPointsBonusScanner] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Get active team and total points
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 } // Refetch every 5 seconds to keep team points updated in real-time
  );

  // Get active contests for contest button
  const { data: contests } = useQuery(
    ['userContests', userId],
    () => api.getUserContests(),
    { enabled: !!userId, refetchInterval: 5000 }
  );

  const activeContests = contests?.filter((c: any) => {
    const endDate = new Date(c.end_date);
    return endDate > new Date() && c.active;
  }) || [];

  // Get the first active contest for the button
  const activeContest = activeContests.length > 0 ? activeContests[0] : null;

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
      const target = event.target as Node;
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
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
          zIndex: 999999,
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

  const handleScanBonusQrClick = () => {
    setIsUserMenuOpen(false);
    setShowPointsBonusScanner(true);
  };

  // Base navigation items for all non-admin users (shown in bottom navigation)
  const baseNavItems = [
    { path: '/tasks', label: t('navigation.tasks'), icon: '✅' },
    { path: '/forest', label: t('navigation.forest'), icon: '🌲' },
    { path: '/rewards', label: t('navigation.rewards'), icon: '🎁' },
    { 
      path: '/statistics', 
      label: userRole === 'guest' ? t('navigation.rankings') : t('navigation.statistics'), 
      icon: '📈' 
    },
  ];
  
  // Navigation items for bottom bar (all non-admin users)
  const bottomNavItems = userRole === 'administrator' ? [] : baseNavItems;
  
  // Top bar items for employees (Points Bonus and Contests)
  const employeeTopItems = (userRole === 'employee' || userRole === 'administrator')
    ? [
        { path: '/points-bonus', label: t('navigation.pointsBonus') || 'Points Bonus', icon: '🎫' },
        { path: '/employee-contests', label: t('navigation.contests', 'Contests') || 'Contests', icon: '🏆' },
      ]
    : [];

  return (
    <>
      <nav className="navigation navigation-top">
        <div className="navigation-container">
          <div className="navigation-left">
            {userRole !== 'administrator' && employeeTopItems.length > 0 && (
              <div className="navigation-items navigation-items-top">
                {employeeTopItems.map((item) => (
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
            )}
          </div>
          <div className="navigation-extra">
            {/* Empty for non-admin users, can be used for future items */}
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
                {activeTeam?.totalPoints !== undefined ? (
                  <>
                    {t('navigation.points', { count: activeTeam.totalPoints })} / {t('navigation.points', { count: points })}
                  </>
                ) : (
                  t('navigation.points', { count: points })
                )}
              </span>
            </button>
            {isUserMenuOpen && createPortal(
              <div ref={menuRef} className="navigation-user-menu" style={menuStyle}>
                <button
                  className="navigation-user-menu-item"
                  onClick={handleProfileClick}
                >
                  <span className="navigation-user-menu-icon">👤</span>
                  <span>{t('navigation.profile')}</span>
                </button>
                <button
                  className="navigation-user-menu-item"
                  onClick={handleScanBonusQrClick}
                >
                  <span className="navigation-user-menu-icon">📷</span>
                  <span>{t('navigation.scanBonusQr') || 'Bonus-QR-Code scannen'}</span>
                </button>
                <button
                  className="navigation-user-menu-item navigation-user-menu-item-logout"
                  onClick={handleLogout}
                >
                  <span className="navigation-user-menu-icon">🚪</span>
                  <span>{t('navigation.logout')}</span>
                </button>
              </div>,
              document.body
            )}
          </div>
        </div>
      </nav>
      <nav className="navigation navigation-bottom">
        <div className="navigation-items">
          <Link
            to="/"
            className={`navigation-logo-bottom ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="navigation-logo-icon">🌳</span>
            <span className="navigation-logo-text">{t('navigation.home', 'Roots') || 'Roots'}</span>
          </Link>
          {bottomNavItems.map((item) => (
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
      {showPointsBonusScanner && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999998, backgroundColor: 'var(--color-background, #f9fafb)' }}>
          <PointsBonusScanner
            onClose={() => setShowPointsBonusScanner(false)}
            onSuccess={(pointsAwarded, newBalance) => {
              // Points are already updated in the API call
              setShowPointsBonusScanner(false);
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}

export default Navigation;
