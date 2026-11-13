import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { storeAdminApi, type RefundResult, type RefundsOverview, type StoreInvoice } from '../../../api/store';
import { formatDateTime, formatPrice, INVOICE_KIND_LABELS, timeLeft } from '../../../store/format';
import { InvoiceKindPill, InvoiceTable } from '../../../store/InvoiceTable';
import { Icon } from '../../Icon';

const REASONS = ['A vásárló kérte', 'Nem működik a vásárló szerverén', 'Véletlen / dupla vásárlás', 'Technikai hiba a fizetésnél'];

function consequence(invoice: StoreInvoice): string {
  if (invoice.kind === 'subscription') return 'Az előfizetés azonnal megszűnik, a megújítás leáll, és a panel-hozzáférés megszűnik.';
  return 'A plugin letöltési joga megszűnik a vásárlónál.';
}

function RefundDialog({ invoice, onDone, onCancel }: { invoice: StoreInvoice; onDone: (result: RefundResult) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onDone(await storeAdminApi.refund(invoice.id, reason.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült a visszatérítés.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="refund-dialog error-in" onSubmit={submit}>
      <h3 className="card-title"><Icon name="refresh" size={17} /> Visszatérítés: {invoice.number}</h3>
      <dl className="refund-summary">
        <div><dt>Vevő</dt><dd className="small">{invoice.buyerName ? `${invoice.buyerName} · ` : ''}<span className="mono">{invoice.buyerEmail}</span></dd></div>
        <div><dt>Tétel</dt><dd className="small">{invoice.title}</dd></div>
        <div><dt>Összeg</dt><dd className="mono">{formatPrice(invoice.total, invoice.currency)}</dd></div>
        <div><dt>Fizetve</dt><dd className="small">{formatDateTime(invoice.paidAt)}</dd></div>
      </dl>
      <p className="small">
        {invoice.tebexTransactionId
          ? <>A teljes összeget a Tebex visszaküldi a vásárló fizetési módjára (<span className="mono">{invoice.tebexTransactionId}</span>). </>
          : <>Ehhez a fizetéshez nincs Tebex-tranzakció, ezért a pénzt kézzel kell visszaküldened. </>}
        {consequence(invoice)} Visszatérítési bizonylat készül, ami a vásárló fiókjában is megjelenik.
      </p>
      <label>
        <span className="field-label">A visszatérítés oka (a bizonylaton is szerepel)</span>
        <textarea required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Pl. a vásárló kérte, mert nem működött a szerverén" />
      </label>
      <div className="chip-row">
        {REASONS.map((r) => (
          <button key={r} type="button" className="chip chip-dim" onClick={() => setReason(r)}>{r}</button>
        ))}
      </div>
      <label className="consent-check">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        <span>Értem, hogy a visszatérítés nem vonható vissza.</span>
      </label>
      <div className="refund-dialog-actions">
        <button type="submit" className={`btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy || !confirm || reason.trim().length === 0}>
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          {formatPrice(invoice.total, invoice.currency)} visszatérítése
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>Mégse</button>
      </div>
      {error && <p className="error-text error-in">{error}</p>}
    </form>
  );
}

export function StoreRefundsAdmin() {
  const [data, setData] = useState<RefundsOverview | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StoreInvoice | null>(null);
  const [result, setResult] = useState<RefundResult | null>(null);

  const load = useCallback(() => {
    storeAdminApi.refunds()
      .then((overview) => { setData(overview); setLoadedAt(Date.now()); })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <section className="card stagger-in">{error ? <p className="error-text">{error}</p> : <p className="muted">Betöltés...</p>}</section>;

  const open = data.recent.filter((i) => i.refundable);

  return (
    <>
      <section className="card stagger-in">
        <div className="refund-toolbar">
          <h2 className="card-title"><Icon name="refresh" size={18} /> Visszatérítés</h2>
          <span className="refund-window"><Icon name="clock" size={14} /> {data.windowDays} napos visszatérítési ablak · {open.length} visszatéríthető</span>
        </div>
        <p className="muted small">
          Az elmúlt {data.windowDays} nap fizetései (plugin vásárlás és előfizetés). Visszatéríteni csak a fizetéstől számított {data.windowDays} napon belül lehet, mindig a teljes összeget.
        </p>
        {!data.paymentsConfigured && (
          <p className="invoice-note small"><Icon name="alert" size={15} /><span>A Tebex nincs beállítva: Tebexen keresztül fizetett összeget most nem lehet visszaküldeni.</span></p>
        )}

        {result && (
          <div className="invoice-note small error-in">
            <Icon name="check" size={15} />
            <div>
              <strong>Visszatérítve: {result.refund.refundOfNumber} → {result.refund.number} ({formatPrice(result.refund.total, result.refund.currency)})</strong>
              {result.warnings.length > 0 && (
                <ul className="warning-list">{result.warnings.map((w) => <li key={w}><Icon name="alert" size={14} /> {w}</li>)}</ul>
              )}
            </div>
          </div>
        )}

        {selected && (
          <RefundDialog
            invoice={selected}
            onCancel={() => setSelected(null)}
            onDone={(r) => { setResult(r); setSelected(null); load(); }}
          />
        )}

        <div className="table-scroll section-gap">
          <table className="data-table invoice-table">
            <thead>
              <tr><th>Bizonylat</th><th>Fizetve</th><th>Vevő</th><th>Tétel</th><th className="num">Összeg</th><th>Határidő</th><th /></tr>
            </thead>
            <tbody>
              {data.recent.map((invoice) => {
                const left = timeLeft(invoice.refundableUntil, loadedAt);
                const close = invoice.refundableUntil ? new Date(invoice.refundableUntil).getTime() - loadedAt < 2 * 86_400_000 : false;
                return (
                  <tr key={invoice.id} className={selected?.id === invoice.id ? 'row-selected' : ''}>
                    <td><span className="mono invoice-number">{invoice.number}</span><InvoiceKindPill invoice={invoice} /></td>
                    <td className="small muted">{formatDateTime(invoice.paidAt)}</td>
                    <td className="small">{invoice.buyerName && <strong className="block">{invoice.buyerName}</strong>}<span className="mono muted">{invoice.buyerEmail}</span></td>
                    <td className="small">{invoice.title}</td>
                    <td className="mono num">{formatPrice(invoice.total, invoice.currency)}</td>
                    <td>
                      {invoice.refundedByNumber
                        ? <span className="status-pill status-refunded">Visszatérítve · {invoice.refundedByNumber}</span>
                        : <span className={`refund-deadline ${close ? 'is-close' : ''}`}>{left ? `még ${left}` : 'lejárt'}</span>}
                    </td>
                    <td className="num">
                      {invoice.refundable && (
                        <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => { setSelected(invoice); setResult(null); }}>
                          <Icon name="refresh" size={12} /> Visszatérítés
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.recent.length === 0 && <tr><td colSpan={7} className="muted empty-row">Az elmúlt {data.windowDays} napban nem volt fizetés.</td></tr>}
            </tbody>
          </table>
        </div>
        {error && <p className="error-text error-in">{error}</p>}
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="file" size={18} /> Korábbi visszatérítések</h2>
        <InvoiceTable invoices={data.history} download={storeAdminApi.downloadInvoice} showBuyer empty="Még nem volt visszatérítés." />
        <p className="muted small">A Tebex felületén indított visszatérítés és az elvesztett chargeback is automatikusan ide kerül ({INVOICE_KIND_LABELS.refund.toLowerCase()} bizonylattal).</p>
      </section>
    </>
  );
}
