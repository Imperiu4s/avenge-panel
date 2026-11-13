import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { storeApi, type StoreInfo } from '../api/store';
import { Icon } from '../components/Icon';
import { useCustomer } from './CustomerAuth';

const StoreInfoContext = createContext<{ info: StoreInfo | null; error: string | null }>({ info: null, error: null });

export function useStoreInfo() {
  return useContext(StoreInfoContext);
}

/** Az áruház oldalainak közös kerete: márkasáv (Foundry), menü és vásárlói fiók gomb. */
export function StoreShell() {
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, me } = useCustomer();

  useEffect(() => {
    storeApi.info().then(setInfo).catch(() => setError('Az áruház most nem érhető el. Próbáld újra pár perc múlva.'));
  }, []);

  const brand = info?.brandName ?? 'Avenge Foundry';
  const [first, ...rest] = brand.split(' ');

  return (
    <StoreInfoContext.Provider value={{ info, error }}>
      <div className="foundry-shell">
        <div className="foundry-bar">
          <Link to="/store" className="foundry-bar-brand" aria-label={`${brand} - áruház`}>
            <span className="foundry-mark" aria-hidden="true"><Icon name="package" size={17} /></span>
            <span>{first} <em>{rest.join(' ')}</em></span>
          </Link>
          <nav className="foundry-bar-links" aria-label="Áruház menü">
            <NavLink to="/store" end className={({ isActive }) => `foundry-bar-link ${isActive ? 'is-active' : ''}`}>Pluginok</NavLink>
            {(info?.subscriptionEnabled ?? true) && (
              <NavLink to="/elofizetes" className={({ isActive }) => `foundry-bar-link ${isActive ? 'is-active' : ''}`}>SS tool előfizetés</NavLink>
            )}
            <NavLink to="/jogi/aszf" className={({ isActive }) => `foundry-bar-link ${isActive ? 'is-active' : ''}`}>Feltételek</NavLink>
          </nav>
          <NavLink to="/store/fiok" className={({ isActive }) => `foundry-bar-account ${isActive ? 'is-active' : ''}`}>
            <Icon name="user" size={15} />
            <span>{isLoggedIn ? (me?.displayName || me?.email || 'Fiókom') : 'Belépés / Regisztráció'}</span>
          </NavLink>
        </div>
        <Outlet />
      </div>
    </StoreInfoContext.Provider>
  );
}
