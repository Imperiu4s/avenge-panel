import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BladeNav } from './BladeNav';
import { usePointerSpotlight } from './motion';

export function Layout() {
  const location = useLocation();
  usePointerSpotlight();

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className="app-shell">
      <div className="backdrop" aria-hidden="true">
        <span className="backdrop-grid" />
        <span className="backdrop-ember backdrop-ember-a" />
        <span className="backdrop-ember backdrop-ember-b" />
        <span className="backdrop-scan" />
      </div>

      <BladeNav />

      <div className="route-sweep" key={`sweep-${location.pathname}`} aria-hidden="true" />

      <div className="page-transition" key={location.pathname}>
        <Outlet />
      </div>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Avenge · Avenge Foundry</span>
        <span className="site-footer-sep" aria-hidden="true" />
        <nav className="site-footer-links" aria-label="Jogi információk">
          <Link to="/jogi/aszf">ÁSZF</Link>
          <Link to="/jogi/adatkezeles">Adatkezelés</Link>
          <Link to="/jogi/visszaterites">Visszatérítés</Link>
          <Link to="/jogi/licenc">Licenc</Link>
          <Link to="/jogi/cookie">Sütik</Link>
          <Link to="/jogi/impresszum">Impresszum</Link>
          <a href="/third-party-licenses.txt" target="_blank" rel="noopener">Nyílt forráskód</a>
        </nav>
      </footer>
    </div>
  );
}
