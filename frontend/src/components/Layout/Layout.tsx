import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import './Layout.css';

function Layout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isHome = pathname === '/' || pathname === '';
  const isForest = pathname === '/forest';
  const isTasksHub =
    pathname === '/tasks' &&
    !searchParams.get('view') &&
    !searchParams.get('place') &&
    searchParams.get('online') !== 'true' &&
    searchParams.get('map') !== 'true';
  const isViewportFit = isHome || isTasksHub;

  return (
    <div
      className={`layout ${isViewportFit ? 'layout--home' : ''} ${isForest ? 'layout--forest' : ''}`}
    >
      <Navigation />
      <main
        className={`layout-main ${isViewportFit ? 'layout-main--home' : ''} ${isForest ? 'layout-main--forest' : ''}`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
