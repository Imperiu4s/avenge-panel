import { useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import type { StoreInvoice } from '../api/store';
import { Icon } from '../components/Icon';
import { formatDateTime, formatPrice, INVOICE_KIND_LABELS } from './format';

export function InvoiceKindPill({ invoice }: { invoice: StoreInvoice }) {
  return <span className={`status-pill invoice-kind invoice-kind-${invoice.kind}`}>{INVOICE_KIND_LABELS[invoice.kind] ?? invoice.kind}</span>;
}

export function InvoiceTable({
  invoices,
  download,
  showBuyer = false,
  actions,
  empty = 'Még nincs bizonylatod.'
}: {
  invoices: StoreInvoice[];
  download: (invoice: StoreInvoice) => Promise<void>;
  showBuyer?: boolean;
  actions?: (invoice: StoreInvoice) => ReactNode;
  empty?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(invoice: StoreInvoice) {
    setBusy(invoice.id);
    setError(null);
    try {
      await download(invoice);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült letölteni a bizonylatot.');
    } finally {
      setBusy(null);
    }
  }

  const columns = 5 + (showBuyer ? 1 : 0) + (actions ? 1 : 0);

  return (
    <>
      <div className="table-scroll">
        <table className="data-table invoice-table">
          <thead>
            <tr>
              <th>Bizonylatszám</th>
              <th>Dátum</th>
              {showBuyer && <th>Vevő</th>}
              <th>Megnevezés</th>
              <th className="num">Összeg</th>
              <th />
              {actions && <th />}
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className={invoice.kind === 'refund' ? 'invoice-row-refund' : ''}>
                <td>
                  <span className="mono invoice-number">{invoice.number}</span>
                  <InvoiceKindPill invoice={invoice} />
                </td>
                <td className="muted small">{formatDateTime(invoice.paidAt)}</td>
                {showBuyer && (
                  <td className="small">
                    {invoice.buyerName && <strong className="block">{invoice.buyerName}</strong>}
                    <span className="mono muted">{invoice.buyerEmail}</span>
                  </td>
                )}
                <td>
                  <span>{invoice.title}</span>
                  {invoice.refundedByNumber && <span className="muted small block">Visszatérítve: {invoice.refundedByNumber}</span>}
                  {invoice.refundOfNumber && <span className="muted small block">Eredeti: {invoice.refundOfNumber}{invoice.reason ? ` · ${invoice.reason}` : ''}</span>}
                </td>
                <td className={`mono num ${invoice.total < 0 ? 'amount-negative' : ''}`}>{formatPrice(invoice.total, invoice.currency)}</td>
                <td className="num">
                  <button type="button" className={`btn-ghost btn-tiny ${busy === invoice.id ? 'is-loading' : ''}`} onClick={() => save(invoice)} disabled={busy !== null}>
                    <Icon name="download" size={12} /> PDF
                  </button>
                </td>
                {actions && <td className="num">{actions(invoice)}</td>}
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={columns} className="muted empty-row">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      {error && <p className="error-text error-in">{error}</p>}
    </>
  );
}
