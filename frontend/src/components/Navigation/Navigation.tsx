import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useMatch } from 'react-router-dom';
import {
  Camera,
  Gift,
  ListTodo,
  LogOut,
  Mail,
  Ticket,
  TreePine,
  Trees,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { isForestCategoryRouteKey } from '../../constants/forestCategories';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { PointsBonusScanner } from '../Rewards/PointsBonusScanner';
import { Mailbox } from '../Mailbox/Mailbox';
import { getUserInitials } from '../../utils/userInitials';
import './Navigation.css';

const NAV_ICON = 22;
const NAV_ICON_STROKE = 2;

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = useAuthStore((s) => s.user?.name || 'User');
  const points = useAuthStore((s) => s.user?.points || 0);
  const forestPoints = useAuthStore((s) => s.user?.forestPoints);
  const forestSum = forestPoints
    ? forestPoints.kommunikation +
      forestPoints.mensch +
      forestPoints.natur +
      forestPoints.ressourcen
    : 0;
  const userRole = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);
  const logout = useAuthStore((s) => s.logout);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showPointsBonusScanner, setShowPointsBonusScanner] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Get unread message count
  const { data: unreadCount = 0 } = useQuery(
    ['unreadMessageCount', userId],
    () => api.getUnreadMessageCount(),
    { enabled: !!userId, refetchInterval: 10000 } // Refetch every 10 seconds
  );

  // Get active team and total points
  const { data: activeTeam } = useQuery(
    ['userActiveTeam', userId],
    () => api.getUserActiveTeam(),
    { enabled: !!userId, refetchInterval: 5000 } // Refetch every 5 seconds to keep team points updated in real-time
  );

  const taskCategoryMatch = useMatch({ path: '/tasks/c/:categoryKey', end: true });
  const categoryKey = taskCategoryMatch?.params.categoryKey;

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      return t('home.title');
    }
    if (path.startsWith('/tasks/c/') && categoryKey && isForestCategoryRouteKey(categoryKey)) {
      return t(`tasks.categories.${categoryKey}`);
    }
    if (path.startsWith('/tasks')) {
      return t('tasks.title');
    }
    if (path === '/forest') {
      return t('forest.title');
    }
    if (path === '/rewards') {
      return t('rewards.title');
    }
    if (path === '/groups') {
      return t('groups.title');
    }
    if (path === '/statistics') {
      return userRole === 'guest' ? t('rankings.title') : t('statistics.title');
    }
    if (path === '/profile') {
      return t('profile.title');
    }
    if (path === '/points-bonus') {
      return t('navigation.pointsBonus');
    }
    if (path === '/employee-contests') {
      return t('navigation.contests');
    }
    if (path.startsWith('/contests/')) {
      return t('contests.ranking.title');
    }
    return '';
  }, [location.pathname, categoryKey, t, userRole]);

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

  const iconProps = { size: NAV_ICON, strokeWidth: NAV_ICON_STROKE, 'aria-hidden': true as const };

  const baseNavItems: { path: string; label: string; icon: ReactNode }[] = [
    { path: '/tasks', label: t('navigation.tasks'), icon: <ListTodo {...iconProps} /> },
    { path: '/forest', label: t('navigation.forest'), icon: <Trees {...iconProps} /> },
    { path: '/rewards', label: t('navigation.rewards'), icon: <Gift {...iconProps} /> },
    {
      path: '/groups',
      label: t('navigation.groups'),
      icon: <Users {...iconProps} />,
    },
  ];

  const bottomNavItems = userRole === 'administrator' ? [] : baseNavItems;

  const employeeTopItems =
    userRole === 'rezeption' || userRole === 'administrator'
      ? [
          { path: '/points-bonus', label: t('navigation.pointsBonus'), icon: <Ticket {...iconProps} /> },
          { path: '/employee-contests', label: t('navigation.contests'), icon: <Trophy {...iconProps} /> },
        ]
      : [];

  return (
    <>
      <nav className="navigation navigation-top">
        <div className="navigation-container">
          <div className="navigation-left">
            {/* Mailbox Icon */}
            <button
              className="navigation-mailbox-button"
              onClick={() => setShowMailbox(true)}
              title={t('navigation.mailbox')}
              type="button"
            >
              <span className={`navigation-mailbox-icon ${unreadCount > 0 ? 'has-unread' : ''}`}>
                <Mail size={NAV_ICON} strokeWidth={NAV_ICON_STROKE} aria-hidden />
              </span>
              {unreadCount > 0 && (
                <span className="navigation-mailbox-badge">{unreadCount}</span>
              )}
            </button>
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
          {pageTitle ? (
            <h1 className="navigation-page-title">
              <span className="navigation-page-title-text">{pageTitle}</span>
            </h1>
          ) : (
            <div className="navigation-page-title navigation-page-title--empty" aria-hidden="true" />
          )}
          <div className="navigation-right">
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
              <span className="navigation-user-points-wrap">
                <span className="navigation-user-points">
                  {activeTeam?.totalPoints !== undefined ? (
                    <>
                      {t('navigation.points', { count: activeTeam.totalPoints })} /{' '}
                      {t('navigation.points', { count: points })}
                    </>
                  ) : (
                    t('navigation.points', { count: points })
                  )}
                </span>
                {forestSum > 0 && forestPoints && (
                  <span
                    className="navigation-user-forest"
                    title={t('navigation.forestPoints', {
                      count: forestSum,
                      k: forestPoints.kommunikation,
                      m: forestPoints.mensch,
                      n: forestPoints.natur,
                      r: forestPoints.ressourcen,
                    })}
                  >
                    {t('navigation.forestPointsShort', { count: forestSum })}
                  </span>
                )}
              </span>
            </button>
            {isUserMenuOpen && createPortal(
              <div ref={menuRef} className="navigation-user-menu" style={menuStyle}>
                <button type="button" className="navigation-user-menu-item" onClick={handleProfileClick}>
                  <span className="navigation-user-menu-icon" aria-hidden>
                    <User size={18} strokeWidth={2} />
                  </span>
                  <span>{t('navigation.profile')}</span>
                </button>
                <button type="button" className="navigation-user-menu-item" onClick={handleScanBonusQrClick}>
                  <span className="navigation-user-menu-icon" aria-hidden>
                    <Camera size={18} strokeWidth={2} />
                  </span>
                  <span>{t('navigation.scanBonusQr')}</span>
                </button>
                <button
                  type="button"
                  className="navigation-user-menu-item navigation-user-menu-item-logout"
                  onClick={handleLogout}
                >
                  <span className="navigation-user-menu-icon" aria-hidden>
                    <LogOut size={18} strokeWidth={2} />
                  </span>
                  <span>{t('navigation.logout')}</span>
                </button>
              </div>,
              document.body
            )}
          </div>
          </div>
        </div>
      </nav>
      <nav className="navigation navigation-bottom">
        <div className="navigation-items">
          <Link
            to="/"
            className={`navigation-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="navigation-item-icon">
              <TreePine {...iconProps} />
            </span>
            <span className="navigation-item-label">{t('navigation.home')}</span>
          </Link>
          {bottomNavItems.map((item) => {
            const isTasks = item.path === '/tasks';
            const isActive = isTasks
              ? location.pathname === '/tasks' || location.pathname.startsWith('/tasks/c/')
              : location.pathname === item.path;
            return (
            <Link
              key={item.path}
              to={item.path}
              className={`navigation-item ${isActive ? 'active' : ''}`}
            >
              <span className="navigation-item-icon">{item.icon}</span>
              <span className="navigation-item-label">{item.label}</span>
            </Link>
            );
          })}
        </div>
      </nav>
      {showPointsBonusScanner && createPortal(
        <div className="points-bonus-scanner-portal">
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
      {showMailbox && createPortal(
        <Mailbox onClose={() => setShowMailbox(false)} />,
        document.body
      )}
    </>
  );
}

export default Navigation;
