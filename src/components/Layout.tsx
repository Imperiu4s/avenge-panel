import { t } from '../i18n';
import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BladeNav } from './BladeNav';
import { usePointerSpotlight } from './motion';
import { SeasonalGround, SeasonalLayer } from '../seasonal/SeasonalDecor';

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
      </div>
      <SeasonalLayer />

      <BladeNav />

      <div className="route-sweep" key={`sweep-${location.pathname}`} aria-hidden="true" />

      <div className="page-transition" key={location.pathname}>
        <Outlet />
      </div>

      <SeasonalGround />

      <footer className="site-footer">
        <span>© {new Date().getFullYear()}{' '}{t('Avenge · Avenge Foundry')}</span>
        <span className="site-footer-sep" aria-hidden="true" />
        <nav className="site-footer-links" aria-label={t('Jogi információk')}>
          <Link to="/jogi/aszf">{t('ÁSZF')}</Link>
          <Link to="/jogi/adatkezeles">{t('Adatkezelés')}</Link>
          <Link to="/jogi/visszaterites">{t('Visszatérítés')}</Link>
          <Link to="/jogi/licenc">{t('Licenc')}</Link>
          <Link to="/jogi/cookie">{t('Sütik')}</Link>
          <Link to="/jogi/impresszum">{t('Impresszum')}</Link>
          <Link to="/tamogatas">{t('Támogatás')}</Link>
        </nav>
      </footer>
    </div>
  );
}
