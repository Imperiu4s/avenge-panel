import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { AdminSessionPage, AdminUserView, ScanVerdict } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Várakozik',
  ClientConnected: 'Kliens csatlakozott',
  Scanning: 'Folyamatban',
  Completed: 'Sikeres',
  Interrupted: 'Megszakadt',
  Expired: 'Lejárt'
};

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'Nem egyértelmű'
};

const AGE_OPTIONS = [
  { value: 0, label: 'bármikor' },
  { value: 7, label: '7 napnál régebbi' },
  { value: 14, label: '14 napnál régebbi' },
  { value: 30, label: '30 napnál régebbi' },
  { value: 90, label: '90 napnál régebbi' },
  { value: 180, label: '180 napnál régebbi' },
  { value: 365, label: '1 évnél régebbi' }
];

interface Props {
  users: AdminUserView[];
  initialUserId?: string;
  onChanged?: () => void;
}

export function AdminScansTab({ users, initialUserId = '', onChanged }: Props) {
  const { can } = useAuth();
  const canDelete = can('scans.delete.all');
  const canPurge = can('scans.purge');
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(initialUserId);
  const [verdict, setVerdict] = useState<ScanVerdict | ''>('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminSessionPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [purgeUser, setPurgeUser] = useState('');
  const [purgeAge, setPurgeAge] = useState(30);
  const [purgeVerdict, setPurgeVerdict] = useState<ScanVerdict | ''>('');
  const [purgeUnfinished, setPurgeUnfinished] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => setUserId(initialUserId), [initialUserId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await api.listAdminSessions({ page, pageSize: PAGE_SIZE, userId, verdict, status, q: query }));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError('Nem sikerült betölteni a vizsgálatokat.');
    } finally {
      setIsLoading(false);
    }
  }, [page, userId, verdict, status, query]);

  useEffect(() => {
    const timer = window.setTimeout(load, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  useEffect(() => setSelected(new Set()), [page, userId, verdict, status, query]);

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const allSelected = items.length > 0 && items.every((s) => selected.has(s.code));

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((s) => s.code)));
  }

  async function deleteCodes(codes: string[]) {
    if (codes.length === 0) return;
    const text = codes.length === 1 ? `a #${codes[0]} vizsgálatot` : `${codes.length} vizsgálatot`;
    if (!window.confirm(`Törlöd ${text} az eredményekkel és a megosztó linkekkel együtt? Ez nem vonható vissza.`)) return;
    try {
      const { deleted } = await api.deleteAdminSessions(codes);
      setNotice(`${deleted} vizsgálat törölve.`);
      setSelected(new Set());
      onChanged?.();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült törölni.');
    }
  }

  function describePurge(): string {
    const parts: string[] = [];
    const who = users.find((u) => u.id === purgeUser);
    parts.push(who ? `${who.email} vizsgálatai` : 'mindenki vizsgálatai');
    const age = AGE_OPTIONS.find((o) => o.value === purgeAge);
    if (purgeAge > 0 && age) parts.push(age.label);
    if (purgeVerdict) parts.push(`csak ${VERDICT_LABELS[purgeVerdict]}`);
    if (purgeUnfinished) parts.push('csak a befejezetlenek (lejárt / megszakadt kódok)');
    return parts.join(', ');
  }

  async function handlePurge(e: FormEvent) {
    e.preventDefault();
    const hasFilter = Boolean(purgeUser) || purgeAge > 0 || Boolean(purgeVerdict) || purgeUnfinished;
    if (!hasFilter) {
      setError('Adj meg legalább egy feltételt, vagy használd az összes előzmény törlését lent.');
      return;
    }
    if (!window.confirm(`Törlés: ${describePurge()}. Ez nem vonható vissza. Folytatod?`)) return;
    await runPurge({
      userId: purgeUser || undefined,
      olderThanDays: purgeAge > 0 ? purgeAge : undefined,
      verdict: purgeVerdict || undefined,
      onlyUnfinished: purgeUnfinished
    });
  }

  async function handlePurgeAll() {
    const answer = window.prompt('A szervezet ÖSSZES vizsgálata törlődik, minden staffé. A megerősítéshez írd be: TÖRLÉS');
    if (answer?.trim().toUpperCase() !== 'TÖRLÉS') return;
    await runPurge({ all: true });
  }

  async function runPurge(body: Parameters<typeof api.purgeAdminHistory>[0]) {
    setIsPurging(true);
    setError(null);
    try {
      const { deleted } = await api.purgeAdminHistory(body);
      setNotice(`${deleted} vizsgálat törölve.`);
      onChanged?.();
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült törölni.');
    } finally {
      setIsPurging(false);
    }
  }

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="history" size={18} /> Összes vizsgálat</h2>
          <span className="muted small">{data ? `${data.total} találat` : ''}</span>
        </div>

        <div className="admin-filters">
          <input
            type="search"
            placeholder="Kód, eredmény, Minecraft név, gépnév vagy staff..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label="Keresés"
          />
          <select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} aria-label="Staff">
            <option value="">Minden staff</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
          <select value={verdict} onChange={(e) => { setVerdict(e.target.value as ScanVerdict | ''); setPage(1); }} aria-label="Eredmény">
            <option value="">Minden eredmény</option>
            <option value="Unlegit">UNLEGIT</option>
            <option value="Inconclusive">Nem egyértelmű</option>
            <option value="Legit">LEGIT</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Állapot">
            <option value="">Minden állapot</option>
            <option value="Completed">Sikeres</option>
            <option value="unfinished">Befejezetlen</option>
          </select>
        </div>

        {canDelete && (
          <div className="bulk-bar">
            <span className="muted small">{selected.size > 0 ? `${selected.size} kijelölve` : 'Jelöld ki, amit törölni szeretnél.'}</span>
            <button
              type="button"
              className="btn-ghost btn-tiny btn-danger"
              disabled={selected.size === 0}
              onClick={() => deleteCodes([...selected])}
            >
              <Icon name="trash" size={14} /> Kijelöltek törlése
            </button>
          </div>
        )}

        {notice && <p className="notice-text">{notice}</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="table-scroll">
          <table className="data-table admin-scans-table">
            <thead>
              <tr>
                <th className="check-col">
                  {canDelete && <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Összes kijelölése ezen az oldalon" />}
                </th>
                <th>Kód</th>
                <th>Időpont</th>
                <th>Staff</th>
                <th>Játékos / gép</th>
                <th className="align-right">Találat</th>
                <th>Eredmény</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`sk-${i}`}><td colSpan={8}><Skeleton width="100%" /></td></tr>
                ))}
              {items.map((s, i) => (
                <tr key={s.code} className={`row-in ${selected.has(s.code) ? 'row-selected' : ''}`} style={{ animationDelay: `${Math.min(i, 15) * 25}ms` }}>
                  <td className="check-col">
                    {canDelete && <input type="checkbox" checked={selected.has(s.code)} onChange={() => toggle(s.code)} aria-label={`#${s.code} kijelölése`} />}
                  </td>
                  <td className="mono">
                    {s.resultIdHash ? <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link> : <>#{s.code}</>}
                  </td>
                  <td className="muted small">{formatSecond(s.createdAt)}</td>
                  <td className="mono small">{s.createdByEmail ?? 'törölt felhasználó'}</td>
                  <td className="small">
                    {s.minecraftUsername ?? '-'}
                    {s.hostname && <span className="muted"> · {s.hostname}</span>}
                  </td>
                  <td className="align-right mono">{s.verdict ? s.findingCount : '-'}</td>
                  <td>
                    {s.verdict ? (
                      <span className={`verdict-badge verdict-${s.verdict.toLowerCase()}`}>{VERDICT_LABELS[s.verdict]}</span>
                    ) : (
                      <span className={`status-badge status-${s.status.toLowerCase()}`}>{STATUS_LABELS[s.status] ?? s.status}</span>
                    )}
                  </td>
                  <td>
                    {canDelete && (
                      <button type="button" className="icon-button row-delete" onClick={() => deleteCodes([s.code])} aria-label={`#${s.code} törlése`} title="Törlés">
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={8} className="muted empty-row">Nincs ilyen vizsgálat.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button className="btn-ghost btn-tiny" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Előző</button>
          <span className="mono small pager-page">{page} / {totalPages}</span>
          <button className="btn-ghost btn-tiny" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Következő</button>
        </div>
      </section>

      {canPurge && (
        <section className="card section-gap stagger-in" style={{ animationDelay: '80ms' }}>
          <h2 className="card-title"><Icon name="trash" size={18} /> Előzmények tömeges törlése</h2>
          <p className="muted small">A feltételek együtt érvényesek. A törölt vizsgálatok az eredményükkel és a megosztó linkjeikkel együtt tűnnek el; a tevékenységnaplóban megmarad, ki és mikor törölte.</p>
          <form className="purge-form" onSubmit={handlePurge}>
            <label>
              <span className="field-label">Kié</span>
              <select value={purgeUser} onChange={(e) => setPurgeUser(e.target.value)}>
                <option value="">Mindenkié</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Mikori</span>
              <select value={purgeAge} onChange={(e) => setPurgeAge(Number(e.target.value))}>
                {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Eredmény</span>
              <select value={purgeVerdict} onChange={(e) => setPurgeVerdict(e.target.value as ScanVerdict | '')}>
                <option value="">Bármilyen</option>
                <option value="Legit">Csak LEGIT</option>
                <option value="Inconclusive">Csak nem egyértelmű</option>
                <option value="Unlegit">Csak UNLEGIT</option>
              </select>
            </label>
            <label className="check-label">
              <input type="checkbox" checked={purgeUnfinished} onChange={(e) => setPurgeUnfinished(e.target.checked)} />
              Csak a befejezetlenek (lejárt, fel nem használt vagy megszakadt kódok)
            </label>
            <div className="purge-actions">
              <button type="submit" className="btn-secondary" disabled={isPurging}>
                <Icon name="trash" size={15} /> {isPurging ? 'Törlés...' : 'Törlés a feltételek szerint'}
              </button>
              <button type="button" className="btn-ghost btn-danger" onClick={handlePurgeAll} disabled={isPurging}>
                Összes előzmény törlése
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
