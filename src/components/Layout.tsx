import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <Link to="/panel" className="nav-brand">AVENGE</Link>
        <div className="nav-links">
          <Link to="/panel">Panel</Link>
          <button className="link-button" onClick={logout}>Kijelentkezés</button>
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
