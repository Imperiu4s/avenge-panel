import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-links">
          <Link to="/home" className={isActive('/home') ? 'nav-active' : ''}>Home</Link>
          <Link to="/account" className={isActive('/account') ? 'nav-active' : ''}>Account</Link>
          <Link to="/panel" className={isActive('/panel') || isActive('/results') ? 'nav-active' : ''}>Panel</Link>
          <Link to="/changelogs" className={isActive('/changelogs') ? 'nav-active' : ''}>Changelogs</Link>
          <a href="#" onClick={(e) => e.preventDefault()}>Discord</a>
          <button className="link-button" onClick={logout}>Logout</button>
        </div>
        <a href="#" className="btn-support" onClick={(e) => e.preventDefault()}>Support</a>
      </nav>
      {fullBleed ? children : <main className="app-main">{children}</main>}
    </div>
  );
}
