import { useEffect } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import { useMainPageBackground } from '../../hooks/useMainPageBackground';
import './Layout.css';

const APP_SHELL_SCROLL_LOCK_CLASS = 'app-shell-viewport';

function Layout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  useMainPageBackground(pathname);
  const isHome = pathname === '/' || pathname === '';
  const isForest = pathname === '/forest';
  const isTasksRoute = pathname.startsWith('/tasks');
  const isTasksHub =
    isTasksRoute &&
    pathname === '/tasks' &&
    !searchParams.get('view') &&
    !searchParams.get('place') &&
    searchParams.get('online') !== 'true' &&
    searchParams.get('map') !== 'true';
  const isGroups = pathname === '/groups';
  const isViewportFit = isHome || isTasksRoute;
  const isAppShell = isViewportFit || isForest || isGroups;

  useEffect(() => {
    const { documentElement: html, body } = document;
    if (isAppShell) {
      html.classList.add(APP_SHELL_SCROLL_LOCK_CLASS);
      body.classList.add(APP_SHELL_SCROLL_LOCK_CLASS);
    } else {
      html.classList.remove(APP_SHELL_SCROLL_LOCK_CLASS);
      body.classList.remove(APP_SHELL_SCROLL_LOCK_CLASS);
    }
    return () => {
      html.classList.remove(APP_SHELL_SCROLL_LOCK_CLASS);
      body.classList.remove(APP_SHELL_SCROLL_LOCK_CLASS);
    };
  }, [isAppShell]);

  return (
    <div
      className={`layout ${isViewportFit ? 'layout--home' : ''} ${isAppShell ? 'layout--app-shell' : ''} ${isForest ? 'layout--forest' : ''}`}
    >
      <Navigation />
      <main
        className={`layout-main ${isViewportFit ? 'layout-main--viewport-shell' : ''} ${isHome ? 'layout-main--home' : ''} ${isGroups ? 'layout-main--groups' : ''} ${isTasksRoute ? 'layout-main--tasks-viewport' : ''} ${isTasksHub ? 'layout-main--tasks-hub' : ''} ${isForest ? 'layout-main--forest' : ''}`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
