import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BladeNav } from './BladeNav';
import { usePointerSpotlight } from './motion';

/** A teljes oldal kerete - route-ok között NEM épül újra, így a navbar mozgása folytonos. */
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

      {/* Oldalváltáskor végigsöprő vörös vizsgálati csík - a key miatt minden
          navigációnál újraindul. */}
      <div className="route-sweep" key={`sweep-${location.pathname}`} aria-hidden="true" />

      <div className="page-transition" key={location.pathname}>
        <Outlet />
      </div>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Avenge</span>
        <span className="site-footer-sep" aria-hidden="true" />
        <span>Hozzáférés csak meghívással</span>
      </footer>
    </div>
  );
}
