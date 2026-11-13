import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { storeApi, type CustomerOwned, type StoreRelease } from '../../api/store';
import { useAuth } from '../../auth/AuthContext';
import { ratePassword } from '../../auth/password';
import { Icon } from '../../components/Icon';
import { Skeleton } from '../../components/motion';
import { useCustomer } from '../../store/CustomerAuth';
import { ProductIcon } from '../../store/ProductCard';
import { formatBytes, formatDate, formatDateTime, formatPrice, ORDER_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from '../../store/format';
import { downloadRelease } from './StoreProductPage';

function safeReturnPath(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

function AuthForms() {
  const { login, register } = useCustomer();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strength = ratePassword(password);
  const back = safeReturnPath(searchParams.get('vissza'));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, displayName, accept);
      if (back) navigate(back);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült. Próbáld újra.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="store-auth">
      <section className="card store-auth-card stagger-in">
        <div className="segmented segmented-wide" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(null); }}>Belépés</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(null); }}>Regisztráció</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            <span className="field-label">E-mail cím</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode === 'register' && (
            <label>
              <span className="field-label">Megjelenő név (nem kötelező)</span>
              <input maxLength={40} autoComplete="nickname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </label>
          )}
          <label>
            <span className="field-label">Jelszó</span>
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {mode === 'register' && password && (
            <div className={`strength strength-${strength.score}`}>
              <span className="strength-bars"><i /><i /><i /><i /></span>
              <span className="small">{strength.label}</span>
            </div>
          )}
          {mode === 'register' && (
            <label className="consent-check">
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} required />
              <span>Elolvastam és elfogadom az <Link to="/jogi/aszf">ÁSZF</Link>-et, és tudomásul veszem az <Link to="/jogi/adatkezeles">adatkezelési tájékoztatót</Link>.</span>
            </label>
          )}
          <button type="submit" className={`btn-primary btn-block ${busy ? 'is-loading' : ''}`} disabled={busy}>
            {busy && <span className="btn-spinner" aria-hidden="true" />}
            {mode === 'login' ? 'Belépés' : 'Fiók létrehozása'}
          </button>
          {error && <p className="error-text error-in">{error}</p>}
        </form>
      </section>
      <section className="store-auth-aside stagger-in" style={{ animationDelay: '80ms' }}>
        <h2>Miért kell fiók?</h2>
        <ul className="check-list">
          <li><Icon name="download" size={16} /> A megvásárolt pluginjaid és minden frissítésük itt lesz letölthető.</li>
          <li><Icon name="radar" size={16} /> Az SS tool előfizetésed is ehhez a fiókhoz kötődik.</li>
          <li><Icon name="lock" size={16} /> Kártyaadatot nem tárolunk: a fizetést a Tebex intézi.</li>
        </ul>
        <p className="muted small">Staff vagy? Az SS panelbe a <Link to="/login">staff belépésnél</Link> jutsz be.</p>
      </section>
    </div>
  );
}

function OwnedPlugin({ item, onError }: { item: CustomerOwned; onError: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const latest = item.releases[0];

  async function download(release: StoreRelease) {
    try {
      await downloadRelease(release);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Nem sikerült elindítani a letöltést.');
    }
  }

  return (
    <article className="owned-item">
      <ProductIcon name={item.name} iconAssetId={item.iconAssetId} size={48} />
      <div className="owned-text">
        <Link to={`/store/${item.slug}`}><strong>{item.name}</strong></Link>
        <span className="muted small">Megszerezve: {formatDate(item.grantedAt)}{latest ? ` · legújabb: v${latest.version}` : ''}</span>
        {open && item.releases.length > 1 && (
          <ul className="owned-releases">
            {item.releases.slice(1).map((r) => (
              <li key={r.id}>
                <span className="mono">v{r.version}</span>
                <span className="muted small">{formatDate(r.createdAt)} · {formatBytes(r.sizeBytes)}</span>
                <button type="button" className="btn-ghost btn-tiny" onClick={() => download(r)}><Icon name="download" size={12} /> Letöltés</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="owned-actions">
        {latest ? (
          <button type="button" className="btn-primary btn-tiny" onClick={() => download(latest)}><Icon name="download" size={13} /> v{latest.version}</button>
        ) : <span className="muted small">Még nincs letölthető verzió</span>}
        {item.releases.length > 1 && (
          <button type="button" className="btn-ghost btn-tiny" onClick={() => setOpen(!open)}>{open ? 'Kevesebb' : 'Korábbi verziók'}</button>
        )}
      </div>
    </article>
  );
}

function Dashboard() {
  const { me, refresh, logout, replaceToken } = useCustomer();
  const staff = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  if (!me) {
    return <div className="card"><Skeleton width="40%" /><Skeleton width="80%" style={{ marginTop: 12 }} /></div>;
  }

  const sub = me.subscription;
  const subLive = sub && (sub.status === 'Active' || sub.status === 'CancelPending');

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(null);
    }
  }

  const openPanel = () => run('panel', async () => {
    const { token } = await storeApi.panelToken();
    staff.replaceToken(token);
    navigate('/panel');
  });

  const cancel = () => {
    if (!window.confirm('Lemondod az előfizetést? A már kifizetett időszak végéig megmarad a hozzáférésed, utána nem terhelünk többet.')) return;
    run('cancel', async () => {
      await storeApi.subscriptionCancel();
      await refresh();
      setNotice('Előfizetés lemondva. A kifizetett időszak végéig használhatod.');
    });
  };

  const changePassword = (e: FormEvent) => {
    e.preventDefault();
    run('password', async () => {
      const { token } = await storeApi.changePassword(currentPassword, newPassword);
      replaceToken(token);
      setCurrentPassword('');
      setNewPassword('');
      setNotice('Jelszó megváltoztatva. Ha van SS panel-fiókod, ott is ez az új jelszó.');
    });
  };

  const deleteAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Biztosan törlöd a fiókodat? A megvásárolt pluginokhoz többé nem férsz hozzá, és ez nem vonható vissza.')) return;
    run('delete', async () => {
      await storeApi.deleteAccount(deletePassword);
      logout();
      navigate('/store');
    });
  };

  return (
    <div className="account-grid">
      <div className="account-main">
        <section className="card stagger-in">
          <div className="scans-head">
            <h2 className="card-title"><Icon name="package" size={18} /> Pluginjaim</h2>
            <Link to="/store" className="btn-ghost btn-tiny">Áruház</Link>
          </div>
          {me.owned.length === 0
            ? <p className="muted">Még nincs pluginod. <Link to="/store" className="text-link">Nézz körül az áruházban.</Link></p>
            : <div className="owned-list">{me.owned.map((item) => <OwnedPlugin key={item.productId} item={item} onError={setError} />)}</div>}
        </section>

        <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
          <h2 className="card-title"><Icon name="card" size={18} /> Rendeléseim</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Dátum</th><th>Tételek</th><th>Összeg</th><th>Állapot</th></tr></thead>
              <tbody>
                {me.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="muted small">{formatDateTime(o.createdAt)}</td>
                    <td>{o.items.join(', ')}</td>
                    <td className="mono">{formatPrice(o.total, o.currency)}</td>
                    <td><span className={`status-pill status-${o.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</span></td>
                  </tr>
                ))}
                {me.orders.length === 0 && <tr><td colSpan={4} className="muted empty-row">Még nincs rendelésed.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="muted small">A számlát a Tebex küldi e-mailben a fizetés után.</p>
        </section>
      </div>

      <aside className="side-stack">
        <section className={`card sub-card stagger-in ${subLive ? 'sub-card-live' : ''}`} style={{ animationDelay: '40ms' }}>
          <h2 className="card-title"><Icon name="radar" size={18} /> SS tool előfizetés</h2>
          {sub ? (
            <>
              <p><span className={`status-pill status-${sub.status.toLowerCase()}`}>{SUBSCRIPTION_STATUS_LABELS[sub.status] ?? sub.status}</span></p>
              <dl className="mini-facts">
                <div><dt>Díj</dt><dd>{formatPrice(sub.price, sub.currency)}/hó</dd></div>
                <div><dt>{sub.status === 'Active' ? 'Következő terhelés' : 'Hozzáférés eddig'}</dt><dd>{formatDate(sub.currentPeriodEnd)}</dd></div>
              </dl>
              {sub.note && <p className="muted small">{sub.note}</p>}
              {sub.hasPanelAccess && (
                <button type="button" className={`btn-primary btn-block ${busy === 'panel' ? 'is-loading' : ''}`} onClick={openPanel} disabled={busy !== null}>
                  <Icon name="radar" size={16} /> Belépés az SS panelbe
                </button>
              )}
              {sub.status === 'Active' && (
                <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={cancel} disabled={busy !== null}>Előfizetés lemondása</button>
              )}
              {!subLive && <Link to="/elofizetes" className="btn-secondary btn-block">Újra előfizetek</Link>}
            </>
          ) : (
            <>
              <p className="muted small">Saját SS panel, korlátlan vizsgálati kód, staff fiókok - havi díjért, bármikor lemondható.</p>
              <Link to="/elofizetes" className="btn-secondary btn-block">Részletek</Link>
            </>
          )}
        </section>

        <section className="card stagger-in" style={{ animationDelay: '80ms' }}>
          <h2 className="card-title"><Icon name="user" size={18} /> Fiók</h2>
          <dl className="mini-facts">
            <div><dt>E-mail</dt><dd className="mono small">{me.email}</dd></div>
            <div><dt>Regisztráció</dt><dd>{formatDate(me.createdAt)}</dd></div>
          </dl>
          <button type="button" className="btn-ghost btn-tiny" onClick={() => { logout(); navigate('/store'); }}><Icon name="logout" size={13} /> Kijelentkezés</button>

          <form className="account-form" onSubmit={changePassword}>
            <span className="field-label">Jelszó megváltoztatása</span>
            <input type="password" placeholder="Jelenlegi jelszó" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <input type="password" placeholder="Új jelszó (min. 8 karakter)" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button type="submit" className="btn-secondary btn-tiny" disabled={busy !== null}>Mentés</button>
          </form>

          <details className="danger-zone">
            <summary>Fiók törlése</summary>
            <form className="account-form" onSubmit={deleteAccount}>
              <p className="muted small">A fiókod és a letöltési jogaid törlődnek; a rendeléseid név nélkül maradnak meg a könyveléshez. Élő előfizetést előbb mondj le.</p>
              <input type="password" placeholder="Jelszó a megerősítéshez" autoComplete="current-password" required value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              <button type="submit" className="btn-ghost btn-tiny btn-danger" disabled={busy !== null}>Végleges törlés</button>
            </form>
          </details>
        </section>
        {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
        {error && <p className="error-text error-in">{error}</p>}
      </aside>
    </div>
  );
}

export function StoreAccountPage() {
  const { isLoggedIn, me } = useCustomer();

  return (
    <main className="page store-page">
      <header className="page-head stagger-in">
        <span className="eyebrow">Vásárlói fiók</span>
        <h1>{isLoggedIn ? `Szia${me?.displayName ? `, ${me.displayName}` : ''}!` : 'Belépés az áruházba'}</h1>
        <p className="muted">{isLoggedIn ? 'Itt éred el a pluginjaidat, a rendeléseidet és az SS tool előfizetésedet.' : 'Vásárláshoz és letöltéshez fiók szükséges.'}</p>
      </header>
      {isLoggedIn ? <Dashboard /> : <AuthForms />}
    </main>
  );
}
