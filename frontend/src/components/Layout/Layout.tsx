import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import { useMainPageBackground } from '../../hooks/useMainPageBackground';
import './Layout.css';

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
  const isViewportFit = isHome || isTasksRoute;

  return (
    <div
      className={`layout ${isViewportFit ? 'layout--home' : ''} ${isForest ? 'layout--forest' : ''}`}
    >
      <Navigation />
      <main
        className={`layout-main ${isViewportFit ? 'layout-main--home' : ''} ${isTasksRoute ? 'layout-main--tasks-viewport' : ''} ${isTasksHub ? 'layout-main--tasks-hub' : ''} ${isForest ? 'layout-main--forest' : ''}`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
