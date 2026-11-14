import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { supportApi, ticketNumber, TICKET_STATUS_LABELS, type SupportOverview, type SupportTicketDetail } from '../../api/support';
import { Icon } from '../../components/Icon';
import { Skeleton } from '../../components/motion';
import { useCustomer } from '../../store/CustomerAuth';
import { formatDateTime } from '../../store/format';
import { TicketComposer, TicketMessages } from '../../support/TicketThread';

function LoginPrompt() {
  return (
    <section className="card support-login stagger-in">
      <Icon name="message" size={28} />
      <h2>Lépj be a ticket nyitásához</h2>
      <p className="muted">A ticketek a vásárlói fiókodhoz tartoznak: itt látod a válaszainkat, és bármikor folytathatod a beszélgetést.</p>
      <Link to="/store/fiok?vissza=/tamogatas" className="btn-primary">Belépés / Regisztráció</Link>
    </section>
  );
}

function NewTicket({ overview, onCreated }: { overview: SupportOverview; onCreated: (id: string) => void }) {
  const [topic, setTopic] = useState(overview.topics[0]?.key ?? 'other');
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');

  if (!overview.canOpen) {
    const open = overview.tickets.find((t) => t.status !== 'closed');
    return (
      <section className="card stagger-in">
        <h2 className="card-title"><Icon name="clock" size={18} /> Új ticket</h2>
        <p className="notice-text"><Icon name="info" size={15} /> {overview.blockedReason}</p>
        {open && <Link to={`/tamogatas/${open.id}`} className="btn-secondary btn-block">{ticketNumber(open.number)} megnyitása</Link>}
      </section>
    );
  }

  async function create(message: string, files: File[]) {
    if (subject.trim().length < 3) throw new ApiError(400, 'Adj meg egy rövid tárgyat (legalább 3 karakter).');
    const detail = await supportApi.create({ topic, subject: subject.trim(), message, reference: reference.trim() }, files);
    onCreated(detail.ticket.id);
  }

  return (
    <section className="card stagger-in">
      <h2 className="card-title"><Icon name="plus" size={18} /> Új ticket</h2>
      <span className="field-label">Téma</span>
      <div className="support-topics" role="radiogroup" aria-label="Téma">
        {overview.topics.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={topic === t.key} className={`support-topic ${topic === t.key ? 'is-active' : ''}`} onClick={() => setTopic(t.key)}>
            <strong>{t.label}</strong>
            <small>{t.description}</small>
          </button>
        ))}
      </div>
      <div className="settings-grid">
        <label>
          <span className="field-label">Tárgy</span>
          <input maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="pl. Nem jelent meg a plugin a fiókomban" />
        </label>
        <label>
          <span className="field-label">Bizonylatszám vagy azonosító (nem kötelező)</span>
          <input maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="pl. AV-2026-000123" />
        </label>
      </div>
      <span className="field-label">Üzenet</span>
      <TicketComposer onSend={(message, files) => create(message, files)} placeholder="Írd le pontosan, mi történt, és mit szeretnél. Képernyőképet is csatolhatsz." busyLabel="Ticket nyitása" />
      <p className="muted small support-rule">
        <Icon name="info" size={14} /> Egyszerre egy nyitott ticketed lehet, újat {overview.cooldownHours % 24 === 0 && overview.cooldownHours >= 24 ? `${overview.cooldownHours / 24} naponta` : `${overview.cooldownHours} óránként`} nyithatsz. Soha ne küldd el a jelszavadat.
      </p>
    </section>
  );
}

function TicketList({ overview }: { overview: SupportOverview }) {
  return (
    <section className="card stagger-in" style={{ animationDelay: '60ms' }}>
      <h2 className="card-title"><Icon name="message" size={18} /> Ticketjeim</h2>
      {overview.tickets.length === 0 && <p className="muted">Még nem nyitottál ticketet.</p>}
      <div className="support-list">
        {overview.tickets.map((t) => (
          <Link key={t.id} to={`/tamogatas/${t.id}`} className={`support-row ${t.unread ? 'is-unread' : ''}`}>
            <span className="mono small muted">{ticketNumber(t.number)}</span>
            <span className="support-row-main">
              <strong>{t.subject}</strong>
              <small className="muted">{t.topicLabel} · {formatDateTime(t.updatedAt)}</small>
            </span>
            {t.unread && <span className="support-new">Új válasz</span>}
            <span className={`status-pill ticket-status-${t.status}`}>{TICKET_STATUS_LABELS[t.status]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TicketView({ id }: { id: string }) {
  const { refresh } = useCustomer();
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    supportApi.ticket(id)
      .then((d) => { setDetail(d); refresh().catch(() => undefined); })
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? 'Ez a ticket nem található.' : 'Nem sikerült betölteni a ticketet.'));
  }, [id, refresh]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      supportApi.ticket(id).then(setDetail).catch(() => undefined);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [id, load]);

  if (!detail) {
    return <section className="card">{error ? <p className="error-text">{error}</p> : <><Skeleton width="50%" /><Skeleton width="80%" style={{ marginTop: 12 }} /></>}</section>;
  }

  const t = detail.ticket;

  async function close() {
    if (!window.confirm('Lezárod a ticketet? Ha később újra segítség kell, újat nyithatsz.')) return;
    setBusy(true);
    try {
      setDetail(await supportApi.close(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült lezárni.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card support-ticket stagger-in">
      <div className="support-ticket-head">
        <div>
          <span className="mono small muted">{ticketNumber(t.number)} · {t.topicLabel}{detail.reference ? ` · ${detail.reference}` : ''}</span>
          <h2>{t.subject}</h2>
        </div>
        <span className={`status-pill ticket-status-${t.status}`}>{TICKET_STATUS_LABELS[t.status]}</span>
      </div>
      <TicketMessages messages={detail.messages} staff={false} />
      {t.status === 'closed' ? (
        <p className="muted small support-closed"><Icon name="lock" size={14} /> A ticket le van zárva. Ha újra segítség kell, <Link to="/tamogatas" className="text-link">nyiss újat</Link>.</p>
      ) : (
        <>
          <TicketComposer
            onSend={async (message, files) => { setDetail(await supportApi.reply(id, message, files)); }}
            placeholder={t.status === 'answered' ? 'Válaszolj a staffnak...' : 'Kiegészítés a ticketedhez...'}
          />
          <div className="support-ticket-actions">
            <span className="muted small">{t.status === 'open' ? 'A staff hamarosan válaszol. A válasz itt jelenik meg, és a fiókodban jelzést kapsz.' : 'A staff válaszolt. Ha megoldódott, zárd le a ticketet.'}</span>
            <button type="button" className="btn-ghost btn-tiny" onClick={close} disabled={busy}><Icon name="check" size={13} /> Megoldódott, lezárom</button>
          </div>
        </>
      )}
      {error && <p className="error-text error-in">{error}</p>}
    </section>
  );
}

export function SupportPage() {
  const { id } = useParams();
  const { isLoggedIn, refresh } = useCustomer();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SupportOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || id) return;
    let alive = true;
    supportApi.overview()
      .then((o) => { if (alive) setOverview(o); })
      .catch((err) => { if (alive) setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a ticketeket.'); });
    return () => { alive = false; };
  }, [isLoggedIn, id]);

  return (
    <main className="page store-page support-page">
      <header className="page-head stagger-in">
        <span className="eyebrow">Ügyfélszolgálat</span>
        <h1>{id ? 'Ticket' : 'Támogatás'}</h1>
        <p className="muted">{id ? <Link to="/tamogatas" className="text-link">← Vissza a ticketjeimhez</Link> : 'Kérdésed van a vásárlásról, az előfizetésről, vagy hibát találtál? Nyiss ticketet, és a staff itt válaszol.'}</p>
      </header>
      {!isLoggedIn ? <LoginPrompt /> : id ? <TicketView id={id} /> : (
        overview ? (
          <div className="support-grid">
            <NewTicket overview={overview} onCreated={(newId) => { refresh().catch(() => undefined); navigate(`/tamogatas/${newId}`); }} />
            <TicketList overview={overview} />
          </div>
        ) : <section className="card">{error ? <p className="error-text">{error}</p> : <Skeleton width="60%" />}</section>
      )}
    </main>
  );
}
