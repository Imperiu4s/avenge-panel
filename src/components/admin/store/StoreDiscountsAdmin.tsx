import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { storeAdminApi, type AdminDiscount, type AdminProduct, type DiscountUpsert } from '../../../api/store';
import { formatDateTime } from '../../../store/format';
import { Icon } from '../../Icon';

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaults(): DiscountUpsert {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 3 * 86400000);
  return { name: '', percent: 20, productId: null, startsAt: start.toISOString(), endsAt: end.toISOString(), isActive: true, tebexCouponCode: '' };
}

const PRESETS: { name: string; percent: number; days: number }[] = [
  { name: 'Black Friday', percent: 30, days: 4 },
  { name: 'Cyber Monday', percent: 25, days: 1 },
  { name: 'Karácsonyi akció', percent: 20, days: 10 },
  { name: 'Nyári akció', percent: 15, days: 7 }
];

export function StoreDiscountsAdmin() {
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<DiscountUpsert>(defaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    storeAdminApi.discounts().then(setDiscounts).catch(() => setError('Nem sikerült betölteni az akciókat.'));
  }, []);

  useEffect(() => {
    load();
    storeAdminApi.products().then(setProducts).catch(() => undefined);
  }, [load]);

  const set = <K extends keyof DiscountUpsert>(key: K, value: DiscountUpsert[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const start = new Date();
    start.setSeconds(0, 0);
    setDraft((d) => ({ ...d, name: preset.name, percent: preset.percent, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + preset.days * 86400000).toISOString() }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) await storeAdminApi.updateDiscount(editingId, draft);
      else await storeAdminApi.createDiscount(draft);
      setDraft(defaults());
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(d: AdminDiscount) {
    await storeAdminApi.updateDiscount(d.id, { name: d.name, percent: d.percent, productId: d.productId, startsAt: d.startsAt, endsAt: d.endsAt, isActive: !d.isActive, tebexCouponCode: d.tebexCouponCode }).catch(() => undefined);
    load();
  }

  async function remove(d: AdminDiscount) {
    if (!window.confirm(`Törlöd a(z) "${d.name}" akciót?`)) return;
    await storeAdminApi.deleteDiscount(d.id).catch(() => undefined);
    load();
  }

  return (
    <>
      <form className="card stagger-in" onSubmit={submit}>
        <div className="scans-head">
          <h2 className="card-title"><Icon name="tag" size={18} /> {editingId ? 'Akció szerkesztése' : 'Új akció'}</h2>
          <div className="preset-row">
            {PRESETS.map((p) => <button type="button" key={p.name} className="chip-toggle" onClick={() => applyPreset(p)}>{p.name}</button>)}
          </div>
        </div>
        <div className="settings-grid">
          <label>
            <span className="field-label">Név</span>
            <input required maxLength={60} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="pl. Black Friday" />
          </label>
          <label>
            <span className="field-label">Kedvezmény (%)</span>
            <input type="number" min={1} max={100} required value={draft.percent} onChange={(e) => set('percent', Number(e.target.value))} />
          </label>
          <label>
            <span className="field-label">Termék</span>
            <select value={draft.productId ?? ''} onChange={(e) => set('productId', e.target.value || null)}>
              <option value="">Minden plugin</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Kezdete</span>
            <input type="datetime-local" required value={toLocalInput(draft.startsAt)} onChange={(e) => e.target.value && set('startsAt', new Date(e.target.value).toISOString())} />
          </label>
          <label>
            <span className="field-label">Vége</span>
            <input type="datetime-local" required value={toLocalInput(draft.endsAt)} onChange={(e) => e.target.value && set('endsAt', new Date(e.target.value).toISOString())} />
          </label>
          <label>
            <span className="field-label">Tebex kuponkód</span>
            <input maxLength={60} value={draft.tebexCouponCode ?? ''} onChange={(e) => set('tebexCouponCode', e.target.value)} placeholder="pl. BLACKFRIDAY" />
            <small className="muted">Tebex-csomagos pluginnál kötelező: hozz létre a Tebexben azonos kedvezményű kupont, és írd be a kódját. A kosárra automatikusan rákerül.</small>
          </label>
          <label className="toggle-row toggle-inline">
            <span className="toggle-text"><strong>Aktív</strong><small>Kikapcsolva nem érvényes, akkor sem, ha az időszak tart.</small></span>
            <input type="checkbox" className="switch" checked={draft.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          </label>
        </div>
        <p className="muted small">Ha egy pluginra több akció is érvényes, a legnagyobb kedvezmény számít. Az akció az időszak kezdetén magától indul és a végén magától leáll.</p>
        <div className="settings-actions">
          {editingId ? <button type="button" className="btn-ghost btn-tiny" onClick={() => { setEditingId(null); setDraft(defaults()); }}>Mégse</button> : <span />}
          <button type="submit" className={`btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
            {busy && <span className="btn-spinner" aria-hidden="true" />}
            {editingId ? 'Mentés' : 'Akció indítása'}
          </button>
        </div>
        {error && <p className="error-text error-in">{error}</p>}
      </form>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="clock" size={18} /> Akciók</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Név</th><th>Kedvezmény</th><th>Termék</th><th>Időszak</th><th>Állapot</th><th /></tr></thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td className="mono">−{d.percent}%</td>
                  <td className="small">{d.productName ?? 'Minden plugin'}</td>
                  <td className="small muted">{formatDateTime(d.startsAt)} – {formatDateTime(d.endsAt)}</td>
                  <td>
                    <span className={`status-pill ${d.isRunning ? 'status-paid' : d.isActive && new Date(d.startsAt) > new Date() ? 'status-pending' : 'status-ended'}`}>
                      {d.isRunning ? 'Fut' : !d.isActive ? 'Kikapcsolva' : new Date(d.startsAt) > new Date() ? 'Ütemezve' : 'Lejárt'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="btn-ghost btn-tiny" onClick={() => { setEditingId(d.id); setDraft({ name: d.name, percent: d.percent, productId: d.productId, startsAt: d.startsAt, endsAt: d.endsAt, isActive: d.isActive, tebexCouponCode: d.tebexCouponCode ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Szerkesztés</button>
                    <button type="button" className="btn-ghost btn-tiny" onClick={() => toggle(d)}>{d.isActive ? 'Kikapcsol' : 'Bekapcsol'}</button>
                    <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => remove(d)}>Törlés</button>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && <tr><td colSpan={6} className="muted empty-row">Nincs akció.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
