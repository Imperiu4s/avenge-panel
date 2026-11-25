import { t } from '../../../i18n';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { storeAdminApi, type RefundResult, type RefundsOverview, type StoreInvoice } from '../../../api/store';
import { formatDateTime, formatPrice, INVOICE_KIND_LABELS, timeLeft } from '../../../store/format';
import { InvoiceKindPill, InvoiceTable } from '../../../store/InvoiceTable';
import { Icon } from '../../Icon';

const REASONS = [t('A vásárló kérte (még nem töltötte le)'), t('Véletlen / dupla vásárlás'), t('Technikai hiba a fizetésnél')];
const EXCEPTIONAL_REASONS = [t('Lényegesen hibás termék, nem javítottuk'), t('Dupla fizetés'), t('A termék nem vált letölthetővé')];

function consequence(invoice: StoreInvoice): string {
  if (invoice.kind === 'subscription') return t('Az előfizetés azonnal megszűnik, a megújítás leáll, és a panel-hozzáférés megszűnik.');
  return t('A plugin letöltési joga megszűnik a vásárlónál.');
}

function RefundDialog({ invoice, exceptional, onDone, onCancel }: { invoice: StoreInvoice; exceptional: boolean; onDone: (result: RefundResult) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onDone(await storeAdminApi.refund(invoice.id, reason.trim(), exceptional));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült a visszatérítés.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="refund-dialog error-in" onSubmit={submit}>
      <h3 className="card-title"><Icon name="refresh" size={17} /> {exceptional ? t('Kivételes visszatérítés') : t('Visszatérítés')}: {invoice.number}</h3>
      {exceptional && (
        <p className="invoice-note small">
          <Icon name="alert" size={15} />
          <span>
            {invoice.downloaded ? t('A vásárló már letöltötte a terméket') : t('A 3 napos határidő lejárt')}{t(', ezért a szokásos szabály szerint nem téríthető vissza. Kivételt csak lényegesen hibás termék, dupla fizetés vagy le nem tölthető termék esetén tegyél.')}</span>
        </p>
      )}
      <dl className="refund-summary">
        <div><dt>{t('Vevő')}</dt><dd className="small">{invoice.buyerName ? `${invoice.buyerName} · ` : ''}<span className="mono">{invoice.buyerEmail}</span></dd></div>
        <div><dt>{t('Tétel')}</dt><dd className="small">{invoice.title}</dd></div>
        <div><dt>{t('Összeg')}</dt><dd className="mono">{formatPrice(invoice.total, invoice.currency)}</dd></div>
        <div><dt>{t('Fizetve')}</dt><dd className="small">{formatDateTime(invoice.paidAt)}</dd></div>
      </dl>
      <p className="small">
        {invoice.tebexTransactionId
          ? <>{t('A teljes összeget a Tebex visszaküldi a vásárló fizetési módjára (')}<span className="mono">{invoice.tebexTransactionId}</span>). </>
          : <>{t('Ehhez a fizetéshez nincs Tebex-tranzakció, ezért a pénzt kézzel kell visszaküldened.')}{' '}</>}
        {consequence(invoice)}{' '}{t('Visszatérítési bizonylat készül, ami a vásárló fiókjában is megjelenik.')}</p>
      <label>
        <span className="field-label">{t('A visszatérítés oka (a bizonylaton is szerepel)')}</span>
        <textarea required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Pl. a vásárló kérte, mert nem működött a szerverén')} />
      </label>
      <div className="chip-row">
        {(exceptional ? EXCEPTIONAL_REASONS : REASONS).map((r) => (
          <button key={r} type="button" className="chip chip-dim" onClick={() => setReason(r)}>{r}</button>
        ))}
      </div>
      <label className="consent-check">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        <span>{t('Értem, hogy a visszatérítés nem vonható vissza.')}</span>
      </label>
      <div className="refund-dialog-actions">
        <button type="submit" className={`btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy || !confirm || reason.trim().length === 0}>
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          {formatPrice(invoice.total, invoice.currency)}{' '}{t('visszatérítése')}</button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>{t('Mégse')}</button>
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
  const [exceptional, setExceptional] = useState(false);
  const [result, setResult] = useState<RefundResult | null>(null);

  const load = useCallback(() => {
    storeAdminApi.refunds()
      .then((overview) => { setData(overview); setLoadedAt(Date.now()); })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('Nem sikerült betölteni.')));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return <section className="card stagger-in">{error ? <p className="error-text">{error}</p> : <p className="muted">{t('Betöltés...')}</p>}</section>;

  const open = data.recent.filter((i) => i.refundable);

  return (
    <>
      <section className="card stagger-in">
        <div className="refund-toolbar">
          <h2 className="card-title"><Icon name="refresh" size={18} />{' '}{t('Visszatérítés')}</h2>
          <span className="refund-window"><Icon name="clock" size={14} /> {data.windowDays}{' '}{t('napos visszatérítési ablak ·')}{' '}{open.length}{' '}{t('visszatéríthető')}</span>
        </div>
        <p className="muted small">{t('Az utóbbi hetek fizetései (plugin- és modellvásárlás, előfizetés). A szokásos visszatérítés a fizetéstől számított')}{' '}{data.windowDays}{' '}{t('napon belül, és csak akkor lehetséges, ha a vásárló még nem töltötte le a terméket; mindig a teljes összeget küldjük vissza. Lényegesen hibás termék, dupla fizetés vagy le nem tölthető termék esetén kivételes visszatérítést indíthatsz.')}</p>
        {!data.paymentsConfigured && (
          <p className="invoice-note small"><Icon name="alert" size={15} /><span>{t('A Tebex nincs beállítva: Tebexen keresztül fizetett összeget most nem lehet visszaküldeni.')}</span></p>
        )}

        {result && (
          <div className="invoice-note small error-in">
            <Icon name="check" size={15} />
            <div>
              <strong>{t('Visszatérítve:')}{' '}{result.refund.refundOfNumber} → {result.refund.number} ({formatPrice(result.refund.total, result.refund.currency)})</strong>
              {result.warnings.length > 0 && (
                <ul className="warning-list">{result.warnings.map((w) => <li key={w}><Icon name="alert" size={14} /> {w}</li>)}</ul>
              )}
            </div>
          </div>
        )}

        {selected && (
          <RefundDialog
            invoice={selected}
            exceptional={exceptional}
            onCancel={() => setSelected(null)}
            onDone={(r) => { setResult(r); setSelected(null); load(); }}
          />
        )}

        <div className="table-scroll section-gap">
          <table className="data-table invoice-table">
            <thead>
              <tr><th>{t('Bizonylat')}</th><th>{t('Fizetve')}</th><th>{t('Vevő')}</th><th>{t('Tétel')}</th><th className="num">{t('Összeg')}</th><th>{t('Határidő')}</th><th /></tr>
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
                        ? <span className="status-pill status-refunded">{t('Visszatérítve ·')}{' '}{invoice.refundedByNumber}</span>
                        : invoice.downloaded
                          ? <span className="status-pill status-ended">{t('Letöltve')}</span>
                          : <span className={`refund-deadline ${close ? 'is-close' : ''}`}>{left ? t('még {0}', left) : t('lejárt')}</span>}
                    </td>
                    <td className="num">
                      {invoice.refundable && (
                        <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => { setSelected(invoice); setExceptional(false); setResult(null); }}>
                          <Icon name="refresh" size={12} />{' '}{t('Visszatérítés')}</button>
                      )}
                      {!invoice.refundable && !invoice.refundedByNumber && invoice.total > 0 && (
                        <button type="button" className="btn-ghost btn-tiny" onClick={() => { setSelected(invoice); setExceptional(true); setResult(null); }}>{t('Kivételes')}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.recent.length === 0 && <tr><td colSpan={7} className="muted empty-row">{t('Az utóbbi hetekben nem volt fizetés.')}</td></tr>}
            </tbody>
          </table>
        </div>
        {error && <p className="error-text error-in">{error}</p>}
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="file" size={18} />{' '}{t('Korábbi visszatérítések')}</h2>
        <InvoiceTable invoices={data.history} download={storeAdminApi.downloadInvoice} showBuyer empty={t('Még nem volt visszatérítés.')} />
        <p className="muted small">{t('A Tebex felületén indított visszatérítés és az elvesztett chargeback is automatikusan ide kerül (')}{INVOICE_KIND_LABELS.refund.toLowerCase()}{' '}{t('bizonylattal).')}</p>
      </section>
    </>
  );
}
