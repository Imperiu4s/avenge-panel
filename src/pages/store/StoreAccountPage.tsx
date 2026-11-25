import { t } from '../../i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { customerProfileApi } from '../../api/profile';
import { storeApi, type CustomerMe, type CustomerOwned, type StoreInvoice, type StoreRelease } from '../../api/store';
import { useAuth } from '../../auth/AuthContext';
import { ratePassword } from '../../auth/password';
import { Icon } from '../../components/Icon';
import { Skeleton } from '../../components/motion';
import { ProfileCustomizer } from '../../components/ProfileCustomizer';
import { MINECRAFT_NAME_PATTERN } from '../../store/MinecraftNamePrompt';
import { SubscriptionCancel } from '../../store/SubscriptionCancel';
import { useCustomer } from '../../store/CustomerAuth';
import { DiscordLinkCard } from '../../store/DiscordLinkCard';
import { InvoiceTable } from '../../store/InvoiceTable';
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
  const [minecraftName, setMinecraftName] = useState('');
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
      else await register(email, password, minecraftName.trim(), accept);
      if (back) navigate(back);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült. Próbáld újra.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="store-auth">
      <section className="card store-auth-card stagger-in">
        <div className="segmented segmented-wide" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(null); }}>{t('Belépés')}</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(null); }}>{t('Regisztráció')}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            <span className="field-label">{t('E-mail cím')}</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode === 'register' && (
            <label>
              <span className="field-label">{t('Minecraft-név')}</span>
              <input
                maxLength={32}
                autoComplete="nickname"
                required
                pattern={MINECRAFT_NAME_PATTERN}
                title={t('3-32 karakter: betűk, számok, alulvonás (Bedrock-névnél . vagy * előtag)')}
                value={minecraftName}
                onChange={(e) => setMinecraftName(e.target.value)}
              />
              <small className="muted">{t('Ezen a néven köszönünk, és ehhez köti a Tebex a vásárlásaidat, így fizetéskor már nem kell megadnod.')}</small>
            </label>
          )}
          <label>
            <span className="field-label">{t('Jelszó')}</span>
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
              <span>{t('Elolvastam és elfogadom az')}{' '}<Link to="/jogi/aszf">{t('ÁSZF')}</Link>{t('-et, és tudomásul veszem az')}{' '}<Link to="/jogi/adatkezeles">{t('adatkezelési tájékoztatót')}</Link>.</span>
            </label>
          )}
          <button type="submit" className={`btn-primary btn-block ${busy ? 'is-loading' : ''}`} disabled={busy}>
            {busy && <span className="btn-spinner" aria-hidden="true" />}
            {mode === 'login' ? t('Belépés') : t('Fiók létrehozása')}
          </button>
          {error && <p className="error-text error-in">{error}</p>}
        </form>
      </section>
      <section className="store-auth-aside stagger-in" style={{ animationDelay: '80ms' }}>
        <h2>{t('Miért kell fiók?')}</h2>
        <ul className="check-list">
          <li><Icon name="download" size={16} />{' '}{t('A megvásárolt pluginjaid, modelljeid és minden frissítésük itt lesz letölthető.')}</li>
          <li><Icon name="radar" size={16} />{' '}{t('A PC Check előfizetésed is ehhez a fiókhoz kötődik.')}</li>
          <li><Icon name="lock" size={16} />{' '}{t('Kártyaadatot nem tárolunk: a fizetést a Tebex intézi.')}</li>
        </ul>
        <p className="muted small">{t('Staff vagy? A PC Check panelbe a')}{' '}<Link to="/login">{t('staff belépésnél')}</Link>{' '}{t('jutsz be.')}</p>
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
      onError(err instanceof ApiError ? err.message : t('Nem sikerült elindítani a letöltést.'));
    }
  }

  return (
    <article className="owned-item">
      <ProductIcon name={item.name} iconAssetId={item.iconAssetId} size={48} />
      <div className="owned-text">
        <Link to={`/store/${item.slug}`}><strong>{item.name}</strong></Link>
        <span className="muted small">{t('Megszerezve:')}{' '}{formatDate(item.grantedAt)}{latest ? t(' · legújabb: v{0}', latest.version) : ''}</span>
        {open && item.releases.length > 1 && (
          <ul className="owned-releases">
            {item.releases.slice(1).map((r) => (
              <li key={r.id}>
                <span className="mono">{t('v')}{r.version}</span>
                <span className="muted small">{formatDate(r.createdAt)} · {formatBytes(r.sizeBytes)}</span>
                <button type="button" className="btn-ghost btn-tiny" onClick={() => download(r)}><Icon name="download" size={12} />{' '}{t('Letöltés')}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="owned-actions">
        {latest ? (
          <button type="button" className="btn-primary btn-tiny" onClick={() => download(latest)}><Icon name="download" size={13} />{' '}{t('v')}{latest.version}</button>
        ) : <span className="muted small">{t('Még nincs letölthető verzió')}</span>}
        {item.releases.length > 1 && (
          <button type="button" className="btn-ghost btn-tiny" onClick={() => setOpen(!open)}>{open ? t('Kevesebb') : t('Korábbi verziók')}</button>
        )}
      </div>
    </article>
  );
}

function MyInvoices({ refreshKey }: { refreshKey: string }) {
  const [invoices, setInvoices] = useState<StoreInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    storeApi.invoices()
      .then((list) => { if (alive) setInvoices(list); })
      .catch((err) => { if (alive) setError(err instanceof ApiError ? err.message : t('Nem sikerült betölteni a számláidat.')); });
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <section id="szamlak" className="card section-gap stagger-in" style={{ animationDelay: '90ms' }}>
      <h2 className="card-title"><Icon name="file" size={18} />{' '}{t('Számlák és bizonylatok')}</h2>
      {invoices === null && !error && <><Skeleton width="60%" /><Skeleton width="85%" style={{ marginTop: 10 }} /></>}
      {invoices && <InvoiceTable invoices={invoices} download={storeApi.downloadInvoice} empty={t('Még nincs bizonylatod. Minden fizetés után itt jelenik meg.')} />}
      {error && <p className="error-text error-in">{error}</p>}
      <p className="invoice-note small muted">
        <Icon name="shield" size={15} />
        <span>{t('Minden fizetésről és visszatérítésről automatikusan bizonylat készül, ami innen bármikor újra letölthető, és soha nem törlődik. A fizetést a Tebex dolgozza fel, ezért a hivatalos nyugtát vagy számlát ő küldi e-mailben.')}</span>
      </p>
    </section>
  );
}

function ProfileSection({ me, refresh }: { me: CustomerMe; refresh: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm(t('A Minecraft-neved ez lesz: {0}. Később nem módosíthatod. Biztosan jó?', name.trim()))) return;
    setBusy(true);
    setError(null);
    try {
      await customerProfileApi.setMinecraftName(name.trim());
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült menteni.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stagger-in" style={{ animationDelay: '20ms' }}>
      <h2 className="card-title"><Icon name="user" size={18} />{' '}{t('Profil')}</h2>
      <ProfileCustomizer
        avatarUrl={me.avatarUrl}
        name={me.minecraftUsername ?? me.displayName ?? me.email}
        onUpload={async (image) => { await customerProfileApi.uploadAvatar(image); await refresh(); }}
        onRemove={async () => { await customerProfileApi.removeAvatar(); await refresh(); }}
      />
      {me.minecraftUsername ? (
        <div className="mc-name-locked">
          <span className="field-label">{t('Minecraft-név')}</span>
          <span className="mc-name-value"><Icon name="lock" size={14} /> <strong>{me.minecraftUsername}</strong></span>
          <small className="muted">{t('Ezzel a névvel regisztráltál, és nem módosítható: a Tebex ehhez köti a vásárlásaidat. Ha elírtad, nyiss')}{' '}<Link to="/tamogatas" className="text-link">{t('ticketet')}</Link>.</small>
        </div>
      ) : (
        <form className="account-form mc-name-form" onSubmit={saveName}>
          <span className="field-label">{t('Minecraft-név')}</span>
          <div className="mc-name-row">
            <input
              value={name}
              maxLength={32}
              required
              pattern={MINECRAFT_NAME_PATTERN}
              title={t('3-32 karakter: betűk, számok, alulvonás (Bedrock-névnél . vagy * előtag)')}
              placeholder={t('pl. Steve')}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className={`btn-secondary btn-tiny ${busy ? 'is-loading' : ''}`} disabled={busy || name.trim().length < 3}>{t('Mentés')}</button>
          </div>
          <small className="muted">{t('Csak egyszer adható meg, utána nem módosítható. A Tebex ehhez köti a vásárlásaidat.')}</small>
          {error && <p className="error-text error-in">{error}</p>}
        </form>
      )}
    </section>
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
      setError(err instanceof ApiError ? err.message : t('Nem sikerült.'));
    } finally {
      setBusy(null);
    }
  }

  const openPanel = () => run('panel', async () => {
    const { token } = await storeApi.panelToken();
    staff.replaceToken(token);
    navigate('/panel');
  });

  const changePassword = (e: FormEvent) => {
    e.preventDefault();
    run('password', async () => {
      const { token } = await storeApi.changePassword(currentPassword, newPassword);
      replaceToken(token);
      setCurrentPassword('');
      setNewPassword('');
      setNotice(t('Jelszó megváltoztatva. Ha van PC Check panel-fiókod, ott is ez az új jelszó.'));
    });
  };

  const deleteAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm(t('Biztosan törlöd a fiókodat? A megvásárolt pluginokhoz és modellekhez többé nem férsz hozzá, és ez nem vonható vissza.'))) return;
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
            <h2 className="card-title"><Icon name="package" size={18} />{' '}{t('Termékeim')}</h2>
            <Link to="/store" className="btn-ghost btn-tiny">{t('Áruház')}</Link>
          </div>
          {me.owned.length === 0
            ? <p className="muted">{t('Még nincs pluginod vagy modelled.')}{' '}<Link to="/store" className="text-link">{t('Nézz körül az áruházban.')}</Link></p>
            : <div className="owned-list">{me.owned.map((item) => <OwnedPlugin key={item.productId} item={item} onError={setError} />)}</div>}
          {me.owned.length > 0 && <p className="muted small">{t('A még le nem töltött terméket a fizetéstől számított 3 napon belül visszatérítjük; letöltés után a vásárlás már nem téríthető vissza.')}</p>}
        </section>

        <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
          <h2 className="card-title"><Icon name="card" size={18} />{' '}{t('Rendeléseim')}</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>{t('Dátum')}</th><th>{t('Tételek')}</th><th>{t('Összeg')}</th><th>{t('Állapot')}</th></tr></thead>
              <tbody>
                {me.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="muted small">{formatDateTime(o.createdAt)}</td>
                    <td>{o.items.join(', ')}</td>
                    <td className="mono">{formatPrice(o.total, o.currency)}</td>
                    <td><span className={`status-pill status-${o.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</span></td>
                  </tr>
                ))}
                {me.orders.length === 0 && <tr><td colSpan={4} className="muted empty-row">{t('Még nincs rendelésed.')}</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="muted small">{t('A bizonylataidat lent, a Számlák résznél töltheted le.')}</p>
        </section>

        <MyInvoices refreshKey={`${me.orders.length}-${me.orders.map((o) => o.status).join('')}-${sub?.status ?? ''}`} />
      </div>

      <aside className="side-stack">
        <ProfileSection me={me} refresh={refresh} />
        <DiscordLinkCard />
        <section className="card stagger-in support-mini" style={{ animationDelay: '30ms' }}>
          <h2 className="card-title"><Icon name="message" size={18} />{' '}{t('Támogatás')}</h2>
          {(me.unreadTickets ?? 0) > 0
            ? <p className="success-text"><Icon name="message" size={15} /> {me.unreadTickets}{' '}{t('ticketedre új válasz érkezett.')}</p>
            : <p className="muted small">{t('Kérdésed van, vagy hibát találtál? Nyiss ticketet, és a staff itt, a weboldalon válaszol.')}</p>}
          <Link to="/tamogatas" className="btn-secondary btn-block">{t('Ticketjeim')}</Link>
        </section>
        <section className={`card sub-card stagger-in ${subLive ? 'sub-card-live' : ''}`} style={{ animationDelay: '40ms' }}>
          <h2 className="card-title"><Icon name="radar" size={18} />{' '}{t('PC Check előfizetés')}</h2>
          {sub ? (
            <>
              <p><span className={`status-pill status-${sub.status.toLowerCase()}`}>{SUBSCRIPTION_STATUS_LABELS[sub.status] ?? sub.status}</span></p>
              <dl className="mini-facts">
                <div><dt>{t('Díj')}</dt><dd>{formatPrice(sub.price, sub.currency)}{t('/hó')}</dd></div>
                <div><dt>{sub.status === 'Active' ? t('Következő terhelés') : t('Hozzáférés eddig')}</dt><dd>{formatDate(sub.currentPeriodEnd)}</dd></div>
              </dl>
              {sub.note && <p className="muted small">{sub.note}</p>}
              {sub.hasPanelAccess && (
                <button type="button" className={`btn-primary btn-block ${busy === 'panel' ? 'is-loading' : ''}`} onClick={openPanel} disabled={busy !== null}>
                  <Icon name="radar" size={16} />{' '}{t('Belépés a PC Check panelbe')}</button>
              )}
              {subLive && <SubscriptionCancel subscription={sub} onChanged={refresh} />}
              {!subLive && <Link to="/elofizetes" className="btn-secondary btn-block">{t('Újra előfizetek')}</Link>}
            </>
          ) : (
            <>
              <p className="muted small">{t('Saját PC Check panel, korlátlan vizsgálati kód, staff fiókok - havi díjért, bármikor lemondható.')}</p>
              <Link to="/elofizetes" className="btn-secondary btn-block">{t('Részletek')}</Link>
            </>
          )}
        </section>

        <section className="card stagger-in" style={{ animationDelay: '80ms' }}>
          <h2 className="card-title"><Icon name="user" size={18} />{' '}{t('Fiók')}</h2>
          <dl className="mini-facts">
            <div><dt>{t('E-mail')}</dt><dd className="mono small">{me.email}</dd></div>
            <div><dt>{t('Regisztráció')}</dt><dd>{formatDate(me.createdAt)}</dd></div>
          </dl>
          <button type="button" className="btn-ghost btn-tiny" onClick={() => { logout(); navigate('/store'); }}><Icon name="logout" size={13} />{' '}{t('Kijelentkezés')}</button>

          <form className="account-form" onSubmit={changePassword}>
            <span className="field-label">{t('Jelszó megváltoztatása')}</span>
            <input type="password" placeholder={t('Jelenlegi jelszó')} autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <input type="password" placeholder={t('Új jelszó (min. 8 karakter)')} autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button type="submit" className="btn-secondary btn-tiny" disabled={busy !== null}>{t('Mentés')}</button>
          </form>

          <details className="danger-zone">
            <summary>{t('Fiók törlése')}</summary>
            <form className="account-form" onSubmit={deleteAccount}>
              <p className="muted small">{t('A fiókod, a profilképed és a letöltési jogaid törlődnek. A kiállított bizonylatok a könyvelési kötelezettség miatt megmaradnak. Élő előfizetést előbb mondj le.')}</p>
              <input type="password" placeholder={t('Jelszó a megerősítéshez')} autoComplete="current-password" required value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              <button type="submit" className="btn-ghost btn-tiny btn-danger" disabled={busy !== null}>{t('Végleges törlés')}</button>
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
        <span className="eyebrow">{t('Vásárlói fiók')}</span>
        <h1>{isLoggedIn ? (me?.minecraftUsername || me?.displayName ? t('Szia, {0}!', me?.minecraftUsername || me?.displayName) : t('Szia!')) : t('Belépés az áruházba')}</h1>
        <p className="muted">{isLoggedIn ? t('Itt éred el a pluginjaidat, a modelljeidet, a rendeléseidet és a PC Check előfizetésedet.') : t('Vásárláshoz és letöltéshez fiók szükséges.')}</p>
      </header>
      {isLoggedIn ? <Dashboard /> : <AuthForms />}
    </main>
  );
}
