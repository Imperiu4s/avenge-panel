import { t } from '../../../i18n';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../api/client';
import { storeAdminApi, type AdminCustomer, type AdminCustomerDetail, type AdminProduct } from '../../../api/store';
import { formatDate, formatDateTime, formatPrice, ORDER_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from '../../../store/format';
import { InvoiceTable } from '../../../store/InvoiceTable';
import { Icon } from '../../Icon';

function CustomerDetail({ id, currency, products, onChanged, onClose }: {
  id: string; currency: string; products: AdminProduct[]; onChanged: () => void; onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grantProduct, setGrantProduct] = useState('');
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    storeAdminApi.customer(id).then(setDetail).catch(() => setError(t('Nem sikerült betölteni a vásárlót.')));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function run(action: () => Promise<void>, refresh = true) {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (refresh) load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült.'));
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <section className="card section-gap">{error ? <p className="error-text">{error}</p> : <p className="muted">{t('Betöltés...')}</p>}</section>;
  const c = detail.customer;
  const ownedIds = new Set(detail.owned.filter((o) => !o.revokedAt).map((o) => o.productId));

  const ban = () => {
    const reason = window.prompt(t('Kitiltod: {0}\nAz élő előfizetése is leáll. Indok (a vásárló belépéskor látja):', c.email), '');
    if (reason === null) return;
    run(() => storeAdminApi.ban(c.id, reason));
  };

  const fixName = () => {
    const name = window.prompt(t('{0} Minecraft-neve (a vásárló nem módosíthatja, csak te):', c.email), c.minecraftUsername ?? '');
    if (name === null || name.trim() === (c.minecraftUsername ?? '')) return;
    run(() => storeAdminApi.setMinecraftName(c.id, name.trim()));
  };

  const remove = () => {
    if (!window.confirm(t('Véglegesen törlöd {0} fiókját? A letöltési jogai megszűnnek, az előfizetése leáll, a rendelései név nélkül, a bizonylatai változatlanul megmaradnak. Ez nem vonható vissza.', c.email))) return;
    run(async () => { await storeAdminApi.deleteCustomer(c.id); onClose(); }, false);
  };

  return (
    <section className="card section-gap customer-detail stagger-in">
      <div className="scans-head">
        <h2 className="card-title"><Icon name="user" size={18} /> {c.email}</h2>
        <button type="button" className="btn-ghost btn-tiny" onClick={onClose}><Icon name="x" size={13} />{' '}{t('Bezárás')}</button>
      </div>

      <dl className="detail-facts">
        <div><dt>{t('Minecraft-név')}</dt><dd className="mono">{c.minecraftUsername ?? c.displayName ?? '-'}</dd></div>
        <div><dt>{t('Discord')}</dt><dd>{c.discordUsername ?? '-'}</dd></div>
        <div><dt>{t('Regisztrált')}</dt><dd>{formatDateTime(c.createdAt)}</dd></div>
        <div><dt>{t('Utolsó belépés')}</dt><dd>{formatDateTime(c.lastLoginAt)}</dd></div>
        <div><dt>{t('ÁSZF elfogadva')}</dt><dd>{detail.acceptedTermsVersion ? `${detail.acceptedTermsVersion} (${formatDate(detail.acceptedTermsAt)})` : '-'}</dd></div>
        <div><dt>{t('Költés')}</dt><dd className="mono">{formatPrice(c.spent, currency)} · {c.paidOrders}{' '}{t('rendelés')}</dd></div>
        <div><dt>{t('Állapot')}</dt><dd>{c.isBanned ? <span className="status-pill status-chargeback">{t('Kitiltva')}{c.banReason ? `: ${c.banReason}` : ''}</span> : <span className="status-pill status-paid">{t('Aktív')}</span>}</dd></div>
      </dl>

      <div className="customer-actions">
        {c.isBanned
          ? <button type="button" className="btn-secondary btn-tiny" disabled={busy} onClick={() => run(() => storeAdminApi.unban(c.id))}><Icon name="check" size={13} />{' '}{t('Kitiltás feloldása')}</button>
          : <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy} onClick={ban}><Icon name="ban" size={13} />{' '}{t('Kitiltás')}</button>}
        <button type="button" className="btn-ghost btn-tiny" disabled={busy} onClick={fixName}><Icon name="user" size={13} />{' '}{t('Minecraft-név javítása')}</button>
        <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy} onClick={remove}><Icon name="trash" size={13} />{' '}{t('Fiók törlése')}</button>
      </div>

      <div className="customer-grid">
        <div>
          <span className="field-label">{t('Pluginok')}</span>
          <ul className="plain-list">
            {detail.owned.map((o) => (
              <li key={o.productId} className={o.revokedAt ? 'is-revoked' : ''}>
                <span><strong>{o.productName}</strong> <small className="muted">{o.source === 'gift' ? t('ajándék') : o.source === 'free' ? 'ingyenes' : t('vásárlás')} · {formatDate(o.grantedAt)}{o.revokedAt ? t(' · visszavonva {0}', formatDate(o.revokedAt)) : ''}</small></span>
                {!o.revokedAt && <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy} onClick={() => window.confirm(t('Visszavonod: {0}?', o.productName)) && run(() => storeAdminApi.revoke(c.id, o.productId))}>{t('Visszavonás')}</button>}
              </li>
            ))}
            {detail.owned.length === 0 && <li className="muted small">{t('Nincs plugin.')}</li>}
          </ul>
          <div className="inline-form">
            <select value={grantProduct} onChange={(e) => setGrantProduct(e.target.value)}>
              <option value="">{t('Plugin ajándékozása...')}</option>
              {products.filter((p) => !ownedIds.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" className="btn-secondary btn-tiny" disabled={!grantProduct || busy} onClick={() => run(async () => { await storeAdminApi.grant(c.id, grantProduct); setGrantProduct(''); })}>{t('Odaad')}</button>
          </div>
        </div>
        <div>
          <span className="field-label">{t('PC Check előfizetés')}</span>
          <ul className="plain-list">
            {detail.subscriptions.map((s) => (
              <li key={s.id}>
                <span>
                  <span className={`status-pill status-${s.status.toLowerCase()}`}>{SUBSCRIPTION_STATUS_LABELS[s.status] ?? s.status}</span>{' '}
                  <small className="muted">{formatPrice(s.price, s.currency)}{t('/hó · eddig:')}{' '}{formatDate(s.currentPeriodEnd)}{s.note ? ` · ${s.note}` : ''}</small>
                </span>
              </li>
            ))}
            {detail.subscriptions.length === 0 && <li className="muted small">{t('Nincs előfizetés.')}</li>}
          </ul>
          <div className="inline-form">
            <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('Napok száma')} />
            <button type="button" className="btn-secondary btn-tiny" disabled={busy} onClick={() => window.confirm(t('{0} nap ingyenes PC Check-hozzáférést adsz {1} részére?', days, c.email)) && run(() => storeAdminApi.grantSubscription(c.id, days))}>{t('Nap jóváírása')}</button>
          </div>
        </div>
      </div>

      <span className="field-label">{t('Rendelések')}</span>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>{t('Dátum')}</th><th>{t('Tételek')}</th><th>{t('Összeg')}</th><th>{t('Állapot')}</th><th>{t('Tebex')}</th></tr></thead>
          <tbody>
            {detail.orders.map((o) => (
              <tr key={o.id}>
                <td className="small muted">{formatDateTime(o.createdAt)}</td>
                <td className="small">{o.items.map((i) => i.productName + (i.discountPercent ? ` (−${i.discountPercent}%)` : '')).join(', ')}</td>
                <td className="mono small">{formatPrice(o.total, o.currency)}</td>
                <td><span className={`status-pill status-${o.status.toLowerCase()}`}>{ORDER_STATUS_LABELS[o.status]}</span></td>
                <td className="mono small muted">{o.tebexTransactionId ?? '-'}</td>
              </tr>
            ))}
            {detail.orders.length === 0 && <tr><td colSpan={5} className="muted empty-row">{t('Nincs rendelés.')}</td></tr>}
          </tbody>
        </table>
      </div>

      <span className="field-label section-gap">{t('Bizonylatok')}</span>
      <InvoiceTable invoices={detail.invoices} download={storeAdminApi.downloadInvoice} empty={t('Nincs bizonylat.')} />
      {error && <p className="error-text error-in">{error}</p>}
    </section>
  );
}

export function StoreCustomersAdmin({ currency }: { currency: string }) {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((q: string) => {
    storeAdminApi.customers(q).then(setCustomers).catch(() => setError(t('Nem sikerült betölteni a vásárlókat.')));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(query), 250);
    return () => window.clearTimeout(timer);
  }, [query, load]);

  useEffect(() => {
    storeAdminApi.products().then(setProducts).catch(() => undefined);
  }, []);

  return (
    <>
      {selected && (
        <CustomerDetail key={selected} id={selected} currency={currency} products={products} onChanged={() => load(query)} onClose={() => { setSelected(null); load(query); }} />
      )}
      <section className="card section-gap stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="users" size={18} />{' '}{t('Vásárlók')}{' '}<span className="muted small">({customers.length})</span></h2>
          <label className="filter-search filter-search-inline">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('E-mail vagy név')} aria-label={t('Keresés')} />
          </label>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>{t('E-mail')}</th><th>{t('Regisztrált')}</th><th className="align-right">{t('Plugin')}</th><th className="align-right">{t('Költés')}</th><th>{t('Előfizetés')}</th><th>{t('Állapot')}</th><th /></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className={selected === c.id ? 'row-selected' : ''}>
                  <td><strong className="small">{c.email}</strong>{c.displayName && <small className="muted"> · {c.displayName}</small>}</td>
                  <td className="small muted">{formatDate(c.createdAt)}</td>
                  <td className="align-right mono">{c.products}</td>
                  <td className="align-right mono small">{formatPrice(c.spent, currency)}</td>
                  <td className="small">{c.subscriptionStatus ? SUBSCRIPTION_STATUS_LABELS[c.subscriptionStatus] : <span className="muted">-</span>}</td>
                  <td>{c.isBanned ? <span className="status-pill status-chargeback">{t('Kitiltva')}</span> : <span className="status-pill status-paid">{t('Aktív')}</span>}</td>
                  <td><button type="button" className="btn-ghost btn-tiny" onClick={() => { setSelected(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('Részletek')}</button></td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={7} className="muted empty-row">{query ? t('Nincs találat.') : t('Még nincs regisztrált vásárló.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
