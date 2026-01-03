import { Outlet } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Navigation />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
