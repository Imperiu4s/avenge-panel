import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../api/client';
import { storeAdminApi, type StoreInvoice } from '../../../api/store';
import { formatPrice } from '../../../store/format';
import { InvoiceTable } from '../../../store/InvoiceTable';
import { Icon } from '../../Icon';

export function StoreInvoicesAdmin() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [invoices, setInvoices] = useState<StoreInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      storeAdminApi.invoices(query.trim(), kind)
        .then((list) => { if (alive) { setInvoices(list); setError(null); } })
        .catch((err) => { if (alive) setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a bizonylatokat.'); });
    }, 250);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, kind]);

  const totals = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const invoice of invoices ?? []) byCurrency.set(invoice.currency, (byCurrency.get(invoice.currency) ?? 0) + invoice.total);
    return [...byCurrency.entries()];
  }, [invoices]);

  return (
    <section className="card stagger-in">
      <div className="scans-head">
        <h2 className="card-title">
          <Icon name="file" size={18} /> Bizonylatok{' '}
          <span className="muted small">
            ({invoices ? invoices.length : '…'}{totals.map(([currency, sum]) => ` · nettó ${formatPrice(sum, currency)}`).join('')})
          </span>
        </h2>
        <div className="inline-form">
          <label className="filter-search filter-search-inline">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szám, e-mail vagy tranzakció" aria-label="Keresés" />
          </label>
          <select className="role-select" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Bizonylat típusa">
            <option value="">Minden típus</option>
            <option value="purchase">Plugin vásárlás</option>
            <option value="subscription">Előfizetés</option>
            <option value="refund">Visszatérítés</option>
          </select>
        </div>
      </div>
      {invoices && <InvoiceTable invoices={invoices} download={storeAdminApi.downloadInvoice} showBuyer empty="Nincs a szűrésnek megfelelő bizonylat." />}
      {error && <p className="error-text error-in">{error}</p>}
      <p className="invoice-note small muted">
        <Icon name="lock" size={15} />
        <span>A bizonylatok kiállítás után nem módosíthatók és nem törölhetők, a vásárló fiókjának törlése után is megmaradnak. Visszatérítéskor új, negatív összegű bizonylat készül, ami az eredetire hivatkozik.</span>
      </p>
    </section>
  );
}
