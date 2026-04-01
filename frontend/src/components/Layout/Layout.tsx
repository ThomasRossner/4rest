import { Outlet, useLocation } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import './Layout.css';

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '';
  const isForest = pathname === '/forest';

  return (
    <div className={`layout ${isHome ? 'layout--home' : ''} ${isForest ? 'layout--forest' : ''}`}>
      <Navigation />
      <main className={`layout-main ${isHome ? 'layout-main--home' : ''} ${isForest ? 'layout-main--forest' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
