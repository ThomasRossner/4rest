import { Outlet, useLocation } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import './Layout.css';

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '';

  return (
    <div className={`layout ${isHome ? 'layout--home' : ''}`}>
      <Navigation />
      <main className={`layout-main ${isHome ? 'layout-main--home' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
