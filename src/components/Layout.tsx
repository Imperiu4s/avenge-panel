import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLink = (to: string, label: string, active: boolean) => (
    <Link to={to} className={`nav-link ${active ? 'nav-active' : ''}`}>{label}</Link>
  );

  return (
    <div className="app-shell">
      {/* Oldalváltáskor végigfutó piros csík - a key miatt minden
          navigációnál újraindul az animációja. */}
      <div className="route-progress" key={`progress-${location.pathname}`} aria-hidden="true" />

      <nav className={`top-nav ${isScrolled ? 'top-nav-scrolled' : ''}`}>
        <div className="nav-links">
          {navLink('/home', 'Home', isActive('/home'))}
          {navLink('/account', 'Account', isActive('/account'))}
          {navLink('/panel', 'Panel', isActive('/panel') || isActive('/results'))}
          {isAdmin && navLink('/admin', 'Admin', isActive('/admin'))}
          {navLink('/changelogs', 'Changelogs', isActive('/changelogs'))}
          <a href="#" className="nav-link" onClick={(e) => e.preventDefault()}>Discord</a>
          {isAuthenticated && <button className="link-button nav-link" onClick={logout}>Logout</button>}
        </div>
        <div className="nav-right">
          {!isAuthenticated && (
            <Link to="/login" className="btn-login">Login</Link>
          )}
          <a href="#" className="btn-support" onClick={(e) => e.preventDefault()}>Support</a>
        </div>
      </nav>

      <div className="page-transition" key={location.pathname}>
        {fullBleed ? children : <main className="app-main">{children}</main>}
      </div>
    </div>
  );
}
