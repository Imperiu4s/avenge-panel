import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="nav-links">
          <Link to="/home" className={isActive('/home') ? 'nav-active' : ''}>Home</Link>
          <Link to="/account" className={isActive('/account') ? 'nav-active' : ''}>Account</Link>
          <Link to="/panel" className={isActive('/panel') || isActive('/results') ? 'nav-active' : ''}>Panel</Link>
          {isAdmin && (
            <Link to="/admin" className={isActive('/admin') ? 'nav-active' : ''}>Admin</Link>
          )}
          <Link to="/changelogs" className={isActive('/changelogs') ? 'nav-active' : ''}>Changelogs</Link>
          <a href="#" onClick={(e) => e.preventDefault()}>Discord</a>
          {isAuthenticated && <button className="link-button" onClick={logout}>Logout</button>}
        </div>
        <div className="nav-right">
          {!isAuthenticated && (
            <Link to="/login" className="btn-login">Login</Link>
          )}
          <a href="#" className="btn-support" onClick={(e) => e.preventDefault()}>Support</a>
        </div>
      </nav>
      {fullBleed ? children : <main className="app-main">{children}</main>}
    </div>
  );
}
