import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import {
  storeAdminApi,
  type AdminOrder,
  type AdminStoreSettings,
  type AdminSubscription,
  type StoreOverview,
  type StoreSettingsUpdate,
  type TebexConnectionTest,
  type WebhookLog
} from '../../../api/store';
import { formatDate, formatDateTime, formatPrice, ORDER_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from '../../../store/format';
import { Icon, type IconName } from '../../Icon';
import { useCopyFeedback } from '../../motion';
import { StoreCustomersAdmin } from './StoreCustomersAdmin';
import { StoreDiscountsAdmin } from './StoreDiscountsAdmin';
import { StoreInvoicesAdmin } from './StoreInvoicesAdmin';
import { StoreProductsAdmin } from './StoreProductsAdmin';
import { StoreRefundsAdmin } from './StoreRefundsAdmin';

const SECTIONS: { key: string; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'Áttekintés', icon: 'activity' },
  { key: 'products', label: 'Pluginok', icon: 'package' },
  { key: 'discounts', label: 'Akciók', icon: 'tag' },
  { key: 'customers', label: 'Vásárlók', icon: 'users' },
  { key: 'orders', label: 'Rendelések', icon: 'card' },
  { key: 'subscriptions', label: 'Előfizetések', icon: 'radar' },
  { key: 'invoices', label: 'Bizonylatok', icon: 'file' },
  { key: 'refunds', label: 'Visszatérítés', icon: 'refresh' },
  { key: 'settings', label: 'Beállítások', icon: 'settings' }
];

function Overview({ onOpen }: { onOpen: (key: string) => void }) {
  const [data, setData] = useState<StoreOverview | null>(null);
  useEffect(() => { storeAdminApi.overview().then(setData).catch(() => undefined); }, []);
  if (!data) return <div className="card"><p className="muted">Betöltés...</p></div>;

  const tiles: { label: string; value: string; key: string }[] = [
    { label: 'Pluginok (közzétéve)', value: `${data.products} (${data.published})`, key: 'products' },
    { label: 'Vásárlók', value: `${data.customers}${data.banned ? ` · ${data.banned} kitiltva` : ''}`, key: 'customers' },
    { label: 'Fizetett rendelés', value: `${data.paidOrders}${data.pendingOrders ? ` · ${data.pendingOrders} függő` : ''}`, key: 'orders' },
    { label: 'Élő előfizetés', value: String(data.activeSubscriptions), key: 'subscriptions' }
  ];

  return (
    <>
      {!data.paymentsConfigured && (
        <div className="store-notice store-notice-warn">
          <Icon name="alert" size={16} />
          <span>A Tebex még nincs beállítva: amíg nincs megadva a Public Token (és a csomagok), a fizetős vásárlás és az előfizetés nem indítható.</span>
          <button type="button" className="btn-secondary btn-tiny" onClick={() => onOpen('settings')}>Beállítás</button>
        </div>
      )}
      {data.lastTebexError && (
        <div className="store-notice store-notice-warn">
          <Icon name="alert" size={16} />
          <span>Utolsó Tebex-hiba ({formatDateTime(data.lastTebexErrorAt)}): {data.lastTebexError}</span>
          <button type="button" className="btn-secondary btn-tiny" onClick={() => onOpen('settings')}>Kapcsolat tesztelése</button>
        </div>
      )}
      <div className="stat-tiles">
        {tiles.map((t) => (
          <button type="button" className="card stat-tile spot" key={t.label} onClick={() => onOpen(t.key)}>
            <span className="muted small">{t.label}</span>
            <strong>{t.value}</strong>
          </button>
        ))}
      </div>
      <section className="card section-gap">
        <h2 className="card-title"><Icon name="card" size={18} /> Bevétel</h2>
        {data.revenue.length === 0
          ? <p className="muted">Még nincs fizetett rendelés.</p>
          : (
            <div className="stat-tiles stat-tiles-inline">
              {data.revenue.map((r) => (
                <div key={r.currency} className="revenue-tile">
                  <span className="muted small">Összesen ({r.currency})</span>
                  <strong className="mono">{formatPrice(r.total, r.currency)}</strong>
                  <span className="muted small">utolsó 30 nap: <b className="mono">{formatPrice(r.last30Days, r.currency)}</b></span>
                </div>
              ))}
            </div>
          )}
        <p className="muted small">Bruttó összegek a vásárlási áron; a Tebex díja és az adók levonása a Tebex kimutatásában látszik. Az előfizetések megújításai a Tebexben követhetők.</p>
      </section>
    </>
  );
}

function Orders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState('');
  useEffect(() => { storeAdminApi.orders(status).then(setOrders).catch(() => setOrders([])); }, [status]);

  return (
    <section className="card stagger-in">
      <div className="scans-head">
        <h2 className="card-title"><Icon name="card" size={18} /> Rendelések</h2>
        <select className="role-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Állapot szűrő">
          <option value="">Minden állapot</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Dátum</th><th>Vásárló</th><th>Tételek</th><th className="align-right">Összeg</th><th>Állapot</th><th>Tebex tranzakció</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="small muted">{formatDateTime(o.createdAt)}</td>
                <td className="small">{o.customerEmail}</td>
                <td className="small">{o.items.map((i) => i.productName + (i.discountPercent ? ` (−${i.discountPercent}% ${i.discountName ?? ''})` : '')).join(', ')}</td>
                <td className="align-right mono small">{formatPrice(o.total, o.currency)}</td>
                <td><span className={`status-pill status-${o.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                <td className="mono small muted">{o.tebexTransactionId ?? '-'}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="muted empty-row">Nincs rendelés.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="muted small">A "Fizetésre vár" rendelés azt jelenti, hogy a vásárló megnyitotta a Tebex fizetési oldalt, de (még) nem fizetett.</p>
    </section>
  );
}

function Subscriptions() {
  const [subs, setSubs] = useState<AdminSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { storeAdminApi.subscriptions().then(setSubs).catch(() => setSubs([])); }, []);
  useEffect(() => { load(); }, [load]);

  async function cancel(s: AdminSubscription, immediate: boolean) {
    const text = immediate
      ? `Azonnal megszünteted ${s.customerEmail} előfizetését? A hozzáférése most megszűnik (visszatérítés nélkül - azt a Tebexben indíthatod).`
      : `Lemondod ${s.customerEmail} előfizetését? A kifizetett időszak végéig még él.`;
    if (!window.confirm(text)) return;
    setError(null);
    try {
      await storeAdminApi.cancelSubscription(s.id, immediate);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    }
  }

  return (
    <section className="card stagger-in">
      <h2 className="card-title"><Icon name="radar" size={18} /> SS tool előfizetések</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Vásárló</th><th>Állapot</th><th>Díj</th><th>Indult</th><th>Eddig él</th><th>Tebex ref.</th><th /></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="small">{s.customerEmail}{s.note && <small className="muted"><br />{s.note}</small>}</td>
                <td><span className={`status-pill status-${s.status.toLowerCase()}`}>{SUBSCRIPTION_STATUS_LABELS[s.status]}</span></td>
                <td className="mono small">{formatPrice(s.price, s.currency)}</td>
                <td className="small muted">{formatDate(s.startedAt)}</td>
                <td className="small">{formatDate(s.currentPeriodEnd)}</td>
                <td className="mono small muted">{s.tebexReference ?? '-'}</td>
                <td className="row-actions">
                  {s.status === 'Active' && <button type="button" className="btn-ghost btn-tiny" onClick={() => cancel(s, false)}>Lemondás</button>}
                  {(s.status === 'Active' || s.status === 'CancelPending') && <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => cancel(s, true)}>Azonnal</button>}
                </td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={7} className="muted empty-row">Még nincs előfizető.</td></tr>}
          </tbody>
        </table>
      </div>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}

function Settings({ onSaved }: { onSaved: (s: AdminStoreSettings) => void }) {
  const [settings, setSettings] = useState<AdminStoreSettings | null>(null);
  const [draft, setDraft] = useState<StoreSettingsUpdate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hooks, setHooks] = useState<WebhookLog[]>([]);
  const [test, setTest] = useState<TebexConnectionTest | null>(null);
  const [testing, setTesting] = useState(false);
  const { copiedKey, copy } = useCopyFeedback();

  const apply = useCallback((s: AdminStoreSettings) => {
    setSettings(s);
    setDraft({
      brandName: s.brandName, tagline: s.tagline, about: s.about, currency: s.currency, storeEnabled: s.storeEnabled,
      subscriptionEnabled: s.subscriptionEnabled, subscriptionName: s.subscriptionName, subscriptionPrice: s.subscriptionPrice,
      tebexProjectId: s.tebexProjectId, tebexPrivateKey: null, tebexWebhookSecret: null,
      sellerName: s.sellerName, sellerAddress: s.sellerAddress, sellerTaxNumber: s.sellerTaxNumber, sellerEmail: s.sellerEmail,
      receiptNote: s.receiptNote, tebexPublicToken: s.tebexPublicToken, subscriptionPackageId: s.subscriptionPackageId
    });
  }, []);

  useEffect(() => {
    storeAdminApi.settings().then(apply).catch(() => setError('Nem sikerült betölteni a beállításokat.'));
    storeAdminApi.webhooks().then(setHooks).catch(() => setHooks([]));
  }, [apply]);

  if (!draft || !settings) return error ? <p className="error-text">{error}</p> : <div className="card"><p className="muted">Betöltés...</p></div>;
  const set = <K extends keyof StoreSettingsUpdate>(key: K, value: StoreSettingsUpdate[K]) => { setDraft((d) => (d ? { ...d, [key]: value } : d)); setNotice(null); };

  async function runTest() {
    setTesting(true);
    setTest(null);
    setError(null);
    try {
      setTest(await storeAdminApi.testTebex());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'A teszt nem futott le.');
    } finally {
      setTesting(false);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await storeAdminApi.updateSettings(draft);
      apply(saved);
      onSaved(saved);
      setNotice(saved.notice ? `Beállítások mentve. ${saved.notice}` : 'Beállítások mentve.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="card settings-card stagger-in" onSubmit={save}>
        <h2 className="card-title"><Icon name="package" size={18} /> Áruház</h2>
        <div className="settings-grid">
          <label>
            <span className="field-label">Márkanév</span>
            <input required maxLength={60} value={draft.brandName} onChange={(e) => set('brandName', e.target.value)} />
            <small className="muted">A plugin-részleg neve (pl. Avenge Foundry).</small>
          </label>
          <label>
            <span className="field-label">Szlogen</span>
            <input maxLength={160} value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </label>
          <label>
            <span className="field-label">Pénznem</span>
            <input required maxLength={3} value={draft.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} />
            <small className="muted">Egyezzen a Tebex-fiókod pénznemével (pl. EUR, HUF).</small>
          </label>
        </div>
        <span className="field-label">Rólunk (Markdown)</span>
        <textarea rows={6} value={draft.about} onChange={(e) => set('about', e.target.value)} placeholder="A Rólunk fülön jelenik meg. Üresen egy alapértelmezett bemutatkozás látszik." />
        <div className="toggle-list">
          <label className="toggle-row">
            <span className="toggle-text"><strong>Vásárlás engedélyezve</strong><small>Kikapcsolva az áruház böngészhető, de nem lehet rendelni (a megvett pluginok letölthetők).</small></span>
            <input type="checkbox" className="switch" checked={draft.storeEnabled} onChange={(e) => set('storeEnabled', e.target.checked)} />
          </label>
        </div>

        <h2 className="card-title section-gap"><Icon name="radar" size={18} /> SS tool előfizetés</h2>
        <div className="settings-grid">
          <label>
            <span className="field-label">Megnevezés (a Tebex-számlán)</span>
            <input required maxLength={80} value={draft.subscriptionName} onChange={(e) => set('subscriptionName', e.target.value)} />
          </label>
          <label>
            <span className="field-label">Havidíj ({draft.currency})</span>
            <input type="number" min={0} step="0.01" value={draft.subscriptionPrice} onChange={(e) => set('subscriptionPrice', Number(e.target.value))} />
            <small className="muted">Csak az új előfizetésekre vonatkozik.</small>
          </label>
          <label className="toggle-row toggle-inline">
            <span className="toggle-text"><strong>Előfizetés elérhető</strong><small>Megjelenik az /elofizetes oldalon.</small></span>
            <input type="checkbox" className="switch" checked={draft.subscriptionEnabled} onChange={(e) => set('subscriptionEnabled', e.target.checked)} />
          </label>
        </div>

        <h2 className="card-title section-gap"><Icon name="file" size={18} /> Bizonylatok</h2>
        <p className="muted small">Ezek az adatok kerülnek az újonnan kiállított bizonylatokra. A már kiállítottak nem változnak.</p>
        <div className="seller-grid">
          <label>
            <span className="field-label">Eladó neve</span>
            <input maxLength={120} value={draft.sellerName} onChange={(e) => set('sellerName', e.target.value)} placeholder="Pl. Avenge vagy a vállalkozásod neve" />
          </label>
          <label>
            <span className="field-label">Ügyfélszolgálati e-mail</span>
            <input type="email" maxLength={120} value={draft.sellerEmail} onChange={(e) => set('sellerEmail', e.target.value)} />
          </label>
          <label>
            <span className="field-label">Cím</span>
            <input maxLength={300} value={draft.sellerAddress} onChange={(e) => set('sellerAddress', e.target.value)} />
          </label>
          <label>
            <span className="field-label">Adószám</span>
            <input maxLength={40} value={draft.sellerTaxNumber} onChange={(e) => set('sellerTaxNumber', e.target.value)} placeholder="Ha van" />
          </label>
        </div>
        <label>
          <span className="field-label">Megjegyzés a bizonylat alján</span>
          <textarea rows={3} maxLength={1500} value={draft.receiptNote} onChange={(e) => set('receiptNote', e.target.value)} />
        </label>

        <h2 className="card-title section-gap"><Icon name="lock" size={18} /> Tebex</h2>
        <ol className="setup-steps small muted">
          <li>A Tebexben (Packages) hozz létre egy csomagot az előfizetésnek: <b>Recurring Payment: havonta</b>, az ár egyezzen az itteni pénznemmel. Minden pluginnak is lehet saját csomagja.</li>
          <li>A <a className="text-link" href="https://creator.tebex.io/developers/api-keys" target="_blank" rel="noopener noreferrer">Tebex API Keys</a> oldalról másold be a <b>Public Tokent</b>, és írd be az előfizetés csomagjának azonosítóját. Mentéskor ellenőrzöm a csomagot, és átveszem az árát.</li>
          <li>A Tebex webhookjainál add meg az alábbi URL-t, és másold be a webhook titkos kulcsát.</li>
          <li>A Project ID és a Private Key a visszatérítéshez és az előfizetés automatikus lemondásához kell.</li>
        </ol>
        <div className="settings-grid">
          <label>
            <span className="field-label">Public Token</span>
            <input value={draft.tebexPublicToken} onChange={(e) => set('tebexPublicToken', e.target.value)} autoComplete="off" placeholder="pl. abcd-1234…" />
          </label>
          <label>
            <span className="field-label">Előfizetés csomag azonosító</span>
            <input value={draft.subscriptionPackageId} onChange={(e) => set('subscriptionPackageId', e.target.value)} autoComplete="off" placeholder="pl. 6276316" />
          </label>
        </div>
        <div className="settings-grid">
          <label>
            <span className="field-label">Project ID</span>
            <input value={draft.tebexProjectId ?? ''} onChange={(e) => set('tebexProjectId', e.target.value)} autoComplete="off" />
          </label>
          <label>
            <span className="field-label">Private Key {settings.hasPrivateKey && <span className="chip chip-inline">beállítva</span>}</span>
            <input type="password" autoComplete="new-password" value={draft.tebexPrivateKey ?? ''} placeholder={settings.hasPrivateKey ? '•••••••• (üresen marad a régi)' : ''} onChange={(e) => set('tebexPrivateKey', e.target.value || null)} />
          </label>
          <label>
            <span className="field-label">Webhook secret {settings.hasWebhookSecret && <span className="chip chip-inline">beállítva</span>}</span>
            <input type="password" autoComplete="new-password" value={draft.tebexWebhookSecret ?? ''} placeholder={settings.hasWebhookSecret ? '•••••••• (üresen marad a régi)' : ''} onChange={(e) => set('tebexWebhookSecret', e.target.value || null)} />
          </label>
        </div>
        <div className="webhook-url">
          <span className="field-label">Webhook URL</span>
          <div className="copy-field">
            <code className="mono">{settings.webhookUrl}</code>
            <button type="button" className="btn-ghost btn-tiny" onClick={() => copy('webhook', settings.webhookUrl)}>
              <Icon name={copiedKey === 'webhook' ? 'check' : 'copy'} size={13} /> {copiedKey === 'webhook' ? 'Másolva' : 'Másolás'}
            </button>
          </div>
        </div>

        <div className="tebex-test">
          <button type="button" className={`btn-secondary btn-tiny ${testing ? 'is-loading' : ''}`} onClick={runTest} disabled={testing || (!settings.hasPrivateKey && !(settings.tebexPublicToken && settings.subscriptionPackageId))}>
            <Icon name="activity" size={13} /> Kapcsolat tesztelése
          </button>
          <span className="muted small">Előbb mentsd a kulcsokat. A teszt egy próba-előfizetési kosarat is nyit fizetés nélkül, pontosan úgy, ahogy egy vásárló.</span>
          {test && (
            <ul className="tebex-test-results">
              {[test.auth, test.checkout].filter((r): r is NonNullable<typeof r> => r !== null).map((r, i) => (
                <li key={i} className={r.ok ? 'is-ok' : 'is-bad'}>
                  <Icon name={r.ok ? 'check' : 'alert'} size={15} />
                  <div>
                    <strong>{r.message}</strong>
                    {r.tebexResponse && !r.ok && <code className="mono small">{r.tebexResponse}</code>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="settings-actions">
          <span className="muted small">Módosítva: {formatDateTime(settings.updatedAt)}</span>
          <button type="submit" className={`btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
            {busy && <span className="btn-spinner" aria-hidden="true" />}
            Mentés
          </button>
        </div>
        {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
        {error && <p className="error-text error-in">{error}</p>}
      </form>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="activity" size={18} /> Tebex webhookok</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Érkezett</th><th>Típus</th><th>Eredmény</th></tr></thead>
            <tbody>
              {hooks.map((h) => (
                <tr key={h.id}>
                  <td className="small muted">{formatDateTime(h.receivedAt)}</td>
                  <td className="mono small">{h.type}</td>
                  <td className={`small ${h.result.startsWith('hiba') ? 'error-inline' : ''}`}>{h.result}</td>
                </tr>
              ))}
              {hooks.length === 0 && <tr><td colSpan={3} className="muted empty-row">Még nem érkezett webhook.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function StoreAdminTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = SECTIONS.some((s) => s.key === searchParams.get('store')) ? searchParams.get('store')! : 'overview';
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    storeAdminApi.settings().then((s) => setCurrency(s.currency)).catch(() => undefined);
  }, []);

  const open = (key: string) => setSearchParams({ tab: 'store', store: key });

  return (
    <>
      <nav className="sub-tabs stagger-in" aria-label="Áruház részei">
        {SECTIONS.map((s) => (
          <button key={s.key} type="button" className={`sub-tab ${section === s.key ? 'is-active' : ''}`} onClick={() => open(s.key)}>
            <Icon name={s.icon} size={14} /> {s.label}
          </button>
        ))}
        <Link to="/store" className="sub-tab sub-tab-link" target="_blank"><Icon name="eye" size={14} /> Áruház megnyitása</Link>
      </nav>
      {section === 'overview' && <Overview onOpen={open} />}
      {section === 'products' && <StoreProductsAdmin currency={currency} />}
      {section === 'discounts' && <StoreDiscountsAdmin />}
      {section === 'customers' && <StoreCustomersAdmin currency={currency} />}
      {section === 'orders' && <Orders />}
      {section === 'subscriptions' && <Subscriptions />}
      {section === 'invoices' && <StoreInvoicesAdmin />}
      {section === 'refunds' && <StoreRefundsAdmin />}
      {section === 'settings' && <Settings onSaved={(s) => setCurrency(s.currency)} />}
    </>
  );
}
