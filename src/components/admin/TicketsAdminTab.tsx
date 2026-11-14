import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { supportAdminApi, ticketNumber, TICKET_STATUS_LABELS, type AdminTicketList, type SupportTicketDetail } from '../../api/support';
import { SUBSCRIPTION_STATUS_LABELS, formatDateTime } from '../../store/format';
import { TicketComposer, TicketMessages } from '../../support/TicketThread';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';

const FILTERS: { key: string; label: string }[] = [
  { key: 'open', label: 'Válaszra vár' },
  { key: 'answered', label: 'Megválaszolva' },
  { key: 'closed', label: 'Lezárva' },
  { key: 'all', label: 'Összes' }
];

const COOLDOWNS = [
  { hours: 0, label: 'nincs korlát' },
  { hours: 24, label: '1 naponta' },
  { hours: 48, label: '2 naponta' },
  { hours: 72, label: '3 naponta' },
  { hours: 168, label: 'hetente' }
];

function TicketDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => supportAdminApi.ticket(id).then((d) => { if (alive) setDetail(d); }).catch(() => { if (alive) setError('Nem sikerült betölteni a ticketet.'); });
    load();
    const timer = window.setInterval(load, 20000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [id]);

  async function act(action: () => Promise<SupportTicketDetail>) {
    setBusy(true);
    setError(null);
    try {
      setDetail(await action());
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <section className="card ticket-admin-detail">{error ? <p className="error-text">{error}</p> : <><Skeleton width="50%" /><Skeleton width="85%" style={{ marginTop: 12 }} /></>}</section>;
  const t = detail.ticket;
  const c = detail.customer;

  return (
    <section className="card ticket-admin-detail stagger-in">
      <div className="support-ticket-head">
        <div>
          <span className="mono small muted">{ticketNumber(t.number)} · {t.topicLabel}{detail.reference ? ` · ${detail.reference}` : ''} · nyitva: {formatDateTime(t.createdAt)}</span>
          <h2>{t.subject}</h2>
        </div>
        <span className={`status-pill ticket-status-${t.status}`}>{TICKET_STATUS_LABELS[t.status]}</span>
      </div>

      {c && (
        <dl className="ticket-customer">
          <div><dt>Vásárló</dt><dd className="mono small">{c.email}</dd></div>
          <div><dt>Minecraft-név</dt><dd className="mono small">{c.minecraftName ?? '-'}</dd></div>
          <div><dt>Előfizetés</dt><dd className="small">{c.subscriptionStatus ? SUBSCRIPTION_STATUS_LABELS[c.subscriptionStatus as keyof typeof SUBSCRIPTION_STATUS_LABELS] ?? c.subscriptionStatus : 'nincs'}</dd></div>
          <div><dt>Fizetett rendelés</dt><dd className="small">{c.paidOrders}</dd></div>
          <div><dt>Ticketjei</dt><dd className="small">{c.tickets}</dd></div>
          <div><dt>Felelős</dt><dd className="small">{t.assignedName ?? '-'}</dd></div>
        </dl>
      )}

      <div className="ticket-admin-actions">
        {t.assignedName
          ? <button type="button" className="btn-ghost btn-tiny" disabled={busy} onClick={() => act(() => supportAdminApi.assign(id, false))}>Felelős törlése</button>
          : <button type="button" className="btn-ghost btn-tiny" disabled={busy} onClick={() => act(() => supportAdminApi.assign(id, true))}><Icon name="user" size={13} /> Átveszem</button>}
        {t.status === 'closed'
          ? <button type="button" className="btn-ghost btn-tiny" disabled={busy} onClick={() => act(() => supportAdminApi.reopen(id))}><Icon name="refresh" size={13} /> Újranyitás</button>
          : <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy} onClick={() => window.confirm('Lezárod a ticketet?') && act(() => supportAdminApi.close(id))}><Icon name="lock" size={13} /> Lezárás</button>}
        <button
          type="button"
          className="btn-ghost btn-tiny"
          disabled={busy}
          title="Ez a ticket ne számítson bele a várakozási időbe, így a vásárló azonnal nyithat újat."
          onClick={() => act(() => supportAdminApi.waive(id))}
        >
          {t.cooldownWaived ? 'Várakozás visszaállítása' : 'Várakozás elengedése'}
        </button>
      </div>

      <TicketMessages messages={detail.messages} staff />

      <TicketComposer
        placeholder="Válasz a vásárlónak... (a vásárló a nevedet nem, csak az „Avenge Support” feladót látja)"
        onSend={async (message, files, closeAfter) => {
          setDetail(await supportAdminApi.reply(id, message, files, closeAfter));
          onChanged();
        }}
        extra={(send, sending) => (
          <button type="button" className="btn-secondary btn-tiny" disabled={sending} onClick={() => send(true)}>
            <Icon name="check" size={13} /> Küldés és lezárás
          </button>
        )}
      />
      {error && <p className="error-text error-in">{error}</p>}
    </section>
  );
}

export function TicketsAdminTab() {
  const [filter, setFilter] = useState('open');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<AdminTicketList | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    supportAdminApi.list(filter, query).then(setData).catch((err) => setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a ticketeket.'));
  }, [filter, query]);

  useEffect(() => {
    const timer = window.setTimeout(load, query ? 250 : 0);
    const poll = window.setInterval(load, 30000);
    return () => { window.clearTimeout(timer); window.clearInterval(poll); };
  }, [load, query]);

  async function saveSettings(body: { enabled?: boolean; cooldownHours?: number }) {
    try {
      await supportAdminApi.settings(body);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    }
  }

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="message" size={18} /> Ticketek</h2>
          {data && <span className="muted small">{data.open} válaszra vár · {data.answered} megválaszolva · {data.closed} lezárva</span>}
        </div>
        <p className="muted small">A vásárlók a weboldal Támogatás oldalán nyitnak ticketet. Egy vásárlónak egyszerre egy nyitott ticketje lehet, újat a beállított időnként nyithat.</p>
        {data && (
          <div className="ticket-settings">
            <label className="toggle-row ticket-toggle">
              <span className="toggle-text">
                <strong>Új ticket nyitható</strong>
                <small>Kikapcsolva a meglévő ticketekre továbbra is lehet válaszolni.</small>
              </span>
              <input type="checkbox" className="switch" checked={data.enabled} onChange={(e) => saveSettings({ enabled: e.target.checked })} />
            </label>
            <label>
              <span className="field-label">Új ticket vásárlónként</span>
              <select value={data.cooldownHours} onChange={(e) => saveSettings({ cooldownHours: Number(e.target.value) })}>
                {COOLDOWNS.map((c) => <option key={c.hours} value={c.hours}>{c.label}</option>)}
                {!COOLDOWNS.some((c) => c.hours === data.cooldownHours) && <option value={data.cooldownHours}>{data.cooldownHours} óránként</option>}
              </select>
            </label>
          </div>
        )}
      </section>

      <div className="ticket-admin-layout section-gap">
        <section className="card ticket-admin-list stagger-in">
          <div className="segmented ticket-filter-tabs">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className={filter === f.key ? 'is-active' : ''} onClick={() => setFilter(f.key)}>
                {f.label}{f.key === 'open' && data && data.open > 0 ? ` (${data.open})` : ''}
              </button>
            ))}
          </div>
          <label className="filter-search">
            <Icon name="search" size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Keresés: tárgy, e-mail, név, #szám" aria-label="Keresés" />
          </label>
          {!data && !error && <Skeleton width="100%" height={60} />}
          <div className="support-list">
            {data?.items.map((t) => (
              <button key={t.id} type="button" className={`support-row ${t.unread ? 'is-unread' : ''} ${selected === t.id ? 'is-selected' : ''}`} onClick={() => setSelected(t.id)}>
                <span className="mono small muted">{ticketNumber(t.number)}</span>
                <span className="support-row-main">
                  <strong>{t.subject}</strong>
                  <small className="muted">{t.minecraftName ?? t.customerEmail} · {t.topicLabel} · {formatDateTime(t.updatedAt)}</small>
                </span>
                <span className={`status-pill ticket-status-${t.status}`}>{TICKET_STATUS_LABELS[t.status]}</span>
              </button>
            ))}
            {data && data.items.length === 0 && <p className="muted empty-row">Nincs ilyen ticket.</p>}
          </div>
          {error && <p className="error-text error-in">{error}</p>}
        </section>

        {selected
          ? <TicketDetail key={selected} id={selected} onChanged={load} />
          : <section className="card ticket-admin-detail ticket-admin-empty"><Icon name="message" size={28} /><p className="muted">Válassz egy ticketet a listából.</p></section>}
      </div>
    </>
  );
}
