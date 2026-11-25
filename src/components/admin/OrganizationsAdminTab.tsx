import { t } from '../../i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { organizationsApi, type AdminOrganizationDetail, type AdminOrganizationRow } from '../../api/organizations';
import { storeAdminApi } from '../../api/store';
import type { AdminSessionPage } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { ROLE_LABELS } from '../../auth/permissions';
import { SUBSCRIPTION_STATUS_LABELS, formatDate, formatDateTime } from '../../store/format';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';
import { AUDIT_ACTION_LABELS } from './auditLabels';

const STATUS_LABELS: Record<string, string> = {
  Pending: t('Várakozik'),
  ClientConnected: t('Kliens csatlakozott'),
  Scanning: t('Folyamatban'),
  Completed: t('Sikeres'),
  Interrupted: t('Megszakadt'),
  Expired: t('Lejárt')
};

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: t('Nem egyértelmű')
};

function kindLabel(org: AdminOrganizationRow): string {
  if (org.isPlatform) return 'Platform';
  return org.isSubscription ? t('Előfizető') : t('Saját');
}

function OrganizationScans({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('');
  const [data, setData] = useState<AdminSessionPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      organizationsApi.sessions(id, { page, q: query.trim() || undefined, verdict: verdict || undefined })
        .then((d) => { if (alive) setData(d); })
        .catch((err) => { if (alive) setError(err instanceof ApiError ? err.message : t('Nem sikerült betölteni a vizsgálatokat.')); });
    }, query ? 250 : 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [id, page, query, verdict]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className="card section-gap stagger-in" style={{ animationDelay: '120ms' }}>
      <div className="scans-head">
        <h2 className="card-title"><Icon name="history" size={18} />{' '}{t('Vizsgálatok')}</h2>
        <span className="muted small">{data ? t('{0} találat', data.total) : ''}</span>
      </div>
      <div className="admin-filters">
        <input type="search" placeholder={t('Kód, Minecraft név, gépnév vagy staff...')} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} aria-label={t('Keresés')} />
        <select value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(1); }} aria-label={t('Eredmény')}>
          <option value="">{t('Minden eredmény')}</option>
          <option value="Unlegit">{t('UNLEGIT')}</option>
          <option value="Inconclusive">{t('Nem egyértelmű')}</option>
          <option value="Legit">{t('LEGIT')}</option>
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr><th>{t('Kód')}</th><th>{t('Időpont')}</th><th>{t('Staff')}</th><th>{t('Játékos / gép')}</th><th className="align-right">{t('Találat')}</th><th>{t('Eredmény')}</th></tr>
          </thead>
          <tbody>
            {!data && Array.from({ length: 4 }, (_, i) => <tr key={`sk-${i}`}><td colSpan={6}><Skeleton width="100%" /></td></tr>)}
            {data?.items.map((s) => (
              <tr key={s.code}>
                <td className="mono">{s.resultIdHash ? <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link> : <>#{s.code}</>}</td>
                <td className="muted small">{formatSecond(s.createdAt)}</td>
                <td className="mono small">{s.createdByEmail ?? t('törölt felhasználó')}</td>
                <td className="small">{s.minecraftUsername ?? '-'}{s.hostname && <span className="muted"> · {s.hostname}</span>}</td>
                <td className="align-right mono">{s.verdict ? s.findingCount : '-'}</td>
                <td>
                  {s.verdict
                    ? <span className={`verdict-badge verdict-${s.verdict.toLowerCase()}`}>{VERDICT_LABELS[s.verdict]}</span>
                    : <span className={`status-badge status-${s.status.toLowerCase()}`}>{STATUS_LABELS[s.status] ?? s.status}</span>}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={6} className="muted empty-row">{t('Nincs ilyen vizsgálat.')}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn-ghost btn-tiny" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('Előző')}</button>
        <span className="mono small pager-page">{page} / {totalPages}</span>
        <button className="btn-ghost btn-tiny" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('Következő')}</button>
      </div>
    </section>
  );
}

function OrganizationDetail({ id, onBack, onDeleted }: { id: string; onBack: () => void; onDeleted: () => void }) {
  const { can } = useAuth();
  const canManage = can('platform.organizations.manage');
  const canStore = can('platform.store');
  const [detail, setDetail] = useState<AdminOrganizationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState('');

  const load = useCallback(() => {
    organizationsApi.detail(id)
      .then((d) => { setDetail(d); setName(d.summary.name); })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('Nem sikerült betölteni a szervezetet.')));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function run(key: string, action: () => Promise<void>, done?: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült.'));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!detail) return;
    const typed = window.prompt(t('A(z) „{0}” szervezet MINDEN adatával együtt törlődik: tagok, {1} vizsgálat az eredményekkel, plugin-kulcsok, napló. Ez nem vonható vissza.{2}\n\nA megerősítéshez írd be pontosan a szervezet nevét:', detail.summary.name, detail.stats.total, detail.summary.hasAccess && detail.summary.isSubscription ? t(' Az előfizetése még él: a következő megújításkor új, üres szervezetet kap.') : ''));
    if (typed === null) return;
    setBusy('delete');
    setError(null);
    try {
      await organizationsApi.remove(id, typed);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült törölni.'));
      setBusy(null);
    }
  }

  const back = <button type="button" className="back-link org-back" onClick={onBack}><Icon name="arrow-right" size={15} className="flip-x" />{' '}{t('Vissza a szervezetekhez')}</button>;

  if (!detail) {
    return (
      <>
        {back}
        <section className="card">{error ? <p className="error-text">{error}</p> : <><Skeleton width="40%" /><Skeleton width="80%" style={{ marginTop: 12 }} /></>}</section>
      </>
    );
  }

  const { summary, owner, subscription, stats } = detail;
  const tiles = [
    { label: t('Vizsgálat összesen'), value: stats.total },
    { label: t('Az elmúlt 30 napban'), value: stats.last30Days },
    { label: 'LEGIT', value: stats.legit, tone: 'kpi-cool' },
    { label: 'UNLEGIT', value: stats.unlegit, tone: 'kpi-hot' },
    { label: t('Nem egyértelmű'), value: stats.inconclusive },
    { label: t('Megszakadt'), value: stats.interrupted }
  ];

  return (
    <>
      {back}
      {summary.deletesAt && (
        <p className="foreign-org-banner org-deletion-banner">
          <Icon name="alert" size={15} />{' '}{t('Az előfizetése lejárt: a szervezet')}{' '}{formatDateTime(summary.deletesAt)}{' '}{t('körül minden adatával automatikusan törlődik.')}{canStore && owner && t(' Ha meg akarod tartani, írj jóvá napokat az előfizetésére.')}
        </p>
      )}
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="layers" size={18} /> {summary.name}</h2>
          <span className={`status-pill ${summary.hasAccess ? 'status-active' : 'status-ended'}`}>{kindLabel(summary)} · {summary.hasAccess ? t('van hozzáférése') : t('nincs hozzáférése')}</span>
        </div>
        <dl className="org-facts">
          <div><dt>{t('Létrehozva')}</dt><dd>{formatDate(summary.createdAt)}</dd></div>
          <div><dt>{t('Tagok')}</dt><dd>{summary.members}</dd></div>
          <div><dt>{t('Utolsó vizsgálat')}</dt><dd>{summary.lastScanAt ? formatDateTime(summary.lastScanAt) : t('még nem volt')}</dd></div>
          <div><dt>{t('PC Check plugin')}</dt><dd>{summary.pluginOwned ? t('megvan · {0} aktív kulcs', summary.activePluginKeys) : t('nincs megvéve')}</dd></div>
          {owner && <div><dt>{t('Előfizető vásárló')}</dt><dd>{owner.email}{owner.minecraftUsername ? ` · ${owner.minecraftUsername}` : ''}{owner.isBanned ? t(' · kitiltva') : ''}</dd></div>}
          {owner && <div><dt>{t('Vásárlói fiók')}</dt><dd>{t('regisztrált:')}{' '}{formatDate(owner.createdAt)}{' '}{t('· utolsó belépés:')}{' '}{owner.lastLoginAt ? formatDateTime(owner.lastLoginAt) : '-'}</dd></div>}
          {subscription && (
            <div>
              <dt>{t('Előfizetés')}</dt>
              <dd>
                {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                {subscription.currentPeriodEnd ? t(' · időszak vége: {0}', formatDate(subscription.currentPeriodEnd)) : ''}
                {subscription.startedAt ? t(' · indult: {0}', formatDate(subscription.startedAt)) : ''}
              </dd>
            </div>
          )}
        </dl>

        {(canManage || (canStore && owner)) && (
          <div className="org-manage">
            {canManage && (
              <form className="inline-form" onSubmit={(e) => { e.preventDefault(); run('rename', () => organizationsApi.rename(id, name.trim()), t('A szervezet új neve elmentve.')); }}>
                <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label={t('A szervezet neve')} />
                <button type="submit" className={`btn-secondary btn-tiny ${busy === 'rename' ? 'is-loading' : ''}`} disabled={busy !== null || name.trim().length < 2 || name.trim() === summary.name}>{t('Átnevezés')}</button>
              </form>
            )}
            <div className="org-manage-actions">
              {canStore && owner && (
                <button type="button" className={`btn-secondary btn-tiny ${busy === 'grant' ? 'is-loading' : ''}`} disabled={busy !== null}
                  onClick={() => window.confirm(t('30 nap ingyenes PC Check-hozzáférést adsz {0} részére?', owner.email)) && run('grant', () => storeAdminApi.grantSubscription(owner.id, 30), t('30 nap jóváírva az előfizetésen.'))}>
                  <Icon name="plus" size={13} />{' '}{t('+30 nap előfizetés')}</button>
              )}
              {canManage && !summary.isPlatform && (
                <button type="button" className={`btn-ghost btn-tiny btn-danger ${busy === 'delete' ? 'is-loading' : ''}`} disabled={busy !== null} onClick={remove}>
                  <Icon name="trash" size={13} />{' '}{t('Szervezet törlése')}</button>
              )}
            </div>
          </div>
        )}
        {notice && <p className="notice-text">{notice}</p>}
        {error && <p className="error-text error-in">{error}</p>}
      </section>

      <div className="kpi-grid section-gap">
        {tiles.map((tile, index) => (
          <div key={tile.label} className={`card kpi stagger-in ${tile.tone ?? ''}`} style={{ animationDelay: `${index * 40}ms` }}>
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
          </div>
        ))}
      </div>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="users" size={18} />{' '}{t('Tagok')}</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>{t('E-mail')}</th><th>{t('Rang')}</th><th>{t('Állapot')}</th><th>{t('Utolsó belépés')}</th><th className="align-right">{t('Vizsgálat')}</th></tr></thead>
            <tbody>
              {detail.members.map((m) => {
                const editable = canManage && !m.isPlatformAdmin;
                return (
                  <tr key={m.id}>
                    <td className="mono small">{m.email}{m.isPlatformAdmin && <span className="muted">{' '}{t('· platform admin')}</span>}</td>
                    <td>
                      {editable ? (
                        <select value={m.role} disabled={busy !== null} aria-label={t('{0} rangja', m.email)}
                          onChange={(e) => {
                            const role = e.target.value;
                            if (window.confirm(t('{0} új rangja: {1}. Mented? (A fiók ezzel kijelentkezik.)', m.email, ROLE_LABELS[role]))) {
                              run(`role-${m.id}`, () => organizationsApi.updateMember(id, m.id, { role }), t('{0} rangja módosítva.', m.email));
                            }
                          }}>
                          {['Owner', 'Admin', 'Staff'].map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      ) : (ROLE_LABELS[m.role] ?? m.role)}
                    </td>
                    <td>
                      {editable ? (
                        <button type="button" className={`status-pill status-toggle ${m.isActive ? 'status-active' : 'status-ended'}`} disabled={busy !== null}
                          title={m.isActive ? t('Kattints a kikapcsoláshoz') : t('Kattints a bekapcsoláshoz')}
                          onClick={() => window.confirm(t('{0} fiókját {1}?', m.email, m.isActive ? t('kikapcsolod (azonnal kijelentkezik)') : t('újra bekapcsolod'))) &&
                            run(`active-${m.id}`, () => organizationsApi.updateMember(id, m.id, { isActive: !m.isActive }), m.isActive ? `${m.email} kikapcsolva.` : `${m.email} bekapcsolva.`)}>
                          {m.isActive ? t('Aktív') : t('Kikapcsolva')}
                        </button>
                      ) : m.isActive ? <span className="status-pill status-active">{t('Aktív')}</span> : <span className="status-pill status-ended">{t('Kikapcsolva')}</span>}
                    </td>
                    <td className="small muted">{m.lastLoginAt ? formatDateTime(m.lastLoginAt) : t('még nem')}</td>
                    <td className="align-right mono">{m.scans}</td>
                  </tr>
                );
              })}
              {detail.members.length === 0 && <tr><td colSpan={5} className="muted empty-row">{t('Nincs tagja.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <OrganizationScans id={id} />

      <section className="card section-gap stagger-in" style={{ animationDelay: '160ms' }}>
        <h2 className="card-title"><Icon name="key" size={18} />{' '}{t('Plugin-kulcsok')}</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>{t('Név')}</th><th>{t('Kulcs')}</th><th>{t('Létrehozva')}</th><th>{t('Utoljára használva')}</th><th>{t('Állapot')}</th><th /></tr></thead>
            <tbody>
              {detail.pluginKeys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td className="mono small">{k.prefix}</td>
                  <td className="small muted">{formatDateTime(k.createdAt)}</td>
                  <td className="small muted">{k.lastUsedAt ? formatDateTime(k.lastUsedAt) : t('még nem')}</td>
                  <td>{k.revokedAt ? <span className="status-pill status-ended">{t('Visszavonva')}</span> : <span className="status-pill status-active">{t('Aktív')}</span>}</td>
                  <td className="row-actions">
                    {canManage && !k.revokedAt && (
                      <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy !== null}
                        onClick={() => window.confirm(t('Visszavonod a(z) „{0}” kulcsot? Az ezt használó plugin nem tud több kódot kérni.', k.name)) && run(`key-${k.id}`, () => organizationsApi.revokeKey(id, k.id), t('Kulcs visszavonva.'))}>{t('Visszavonás')}</button>
                    )}
                  </td>
                </tr>
              ))}
              {detail.pluginKeys.length === 0 && <tr><td colSpan={6} className="muted empty-row">{t('Nincs plugin-kulcs.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '200ms' }}>
        <h2 className="card-title"><Icon name="clock" size={18} />{' '}{t('Tevékenységnapló')}</h2>
        <p className="muted small">{t('A szervezet legutóbbi 60 eseménye.')}</p>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>{t('Időpont')}</th><th>{t('Ki')}</th><th>{t('Mit')}</th></tr></thead>
            <tbody>
              {detail.audit.map((a, i) => (
                <tr key={`${a.createdAt}-${i}`}>
                  <td className="small muted">{formatSecond(a.createdAt)}</td>
                  <td className="mono small">{a.userEmail ?? '-'}</td>
                  <td className="small">{AUDIT_ACTION_LABELS[a.action] ?? a.action}</td>
                </tr>
              ))}
              {detail.audit.length === 0 && <tr><td colSpan={3} className="muted empty-row">{t('Még nincs esemény.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function OrganizationsAdminTab() {
  const [rows, setRows] = useState<AdminOrganizationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(window.location.search).get('org'));

  const load = useCallback(() => {
    organizationsApi.list().then(setRows).catch((err) => setError(err instanceof ApiError ? err.message : t('Nem sikerült betölteni a szervezeteket.')));
  }, []);

  useEffect(() => { load(); }, [load]);

  function open(id: string | null) {
    setSelected(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('org', id);
    else url.searchParams.delete('org');
    window.history.replaceState(window.history.state, '', url.toString());
    window.scrollTo({ top: 0 });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((o) =>
      (kind === 'all' || (kind === 'subscription' ? o.isSubscription : !o.isSubscription))
      && (!q || o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q) || (o.ownerEmail ?? '').toLowerCase().includes(q)));
  }, [rows, query, kind]);

  if (selected) return <OrganizationDetail id={selected} onBack={() => open(null)} onDeleted={() => { open(null); load(); }} />;

  const subscribers = rows?.filter((o) => o.isSubscription) ?? [];

  return (
    <section className="card stagger-in">
      <div className="scans-head">
        <h2 className="card-title"><Icon name="layers" size={18} />{' '}{t('Szervezetek')}</h2>
        <span className="muted small">{rows ? t('{0} szervezet · {1} előfizető · {2} élő előfizetés', rows.length, subscribers.length, subscribers.filter((o) => o.hasAccess).length) : ''}</span>
      </div>
      <p className="muted small">{t('Az összes szervezet, az előfizetők saját szervezeteivel együtt. Egy sorra kattintva látod a tagjait, a vizsgálatait (az eredményekkel), az előfizetését és a plugin-kulcsait. Csak megtekintés, és minden megnyitás bekerül a saját tevékenységnaplódba.')}</p>
      <div className="admin-filters">
        <input type="search" placeholder={t('Név vagy előfizető e-mail...')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('Keresés')} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label={t('Típus')}>
          <option value="all">{t('Minden szervezet')}</option>
          <option value="subscription">{t('Előfizetők')}</option>
          <option value="own">{t('Saját / platform')}</option>
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="table-scroll">
        <table className="data-table org-table">
          <thead>
            <tr><th>{t('Szervezet')}</th><th>{t('Típus')}</th><th>{t('Előfizetés')}</th><th className="align-right">{t('Tagok')}</th><th className="align-right">{t('Vizsgálat')}</th><th>{t('Utolsó vizsgálat')}</th><th>{t('Plugin')}</th></tr>
          </thead>
          <tbody>
            {!rows && Array.from({ length: 4 }, (_, i) => <tr key={`sk-${i}`}><td colSpan={7}><Skeleton width="100%" /></td></tr>)}
            {filtered.map((o) => (
              <tr key={o.id} className="org-row" tabIndex={0} onClick={() => open(o.id)} onKeyDown={(e) => { if (e.key === 'Enter') open(o.id); }}>
                <td>
                  <strong>{o.name}</strong>
                  {o.ownerEmail && <div className="mono small muted">{o.ownerEmail}</div>}
                </td>
                <td className="small">{kindLabel(o)}</td>
                <td className="small">
                  {o.isSubscription
                    ? <>{SUBSCRIPTION_STATUS_LABELS[o.subscriptionStatus ?? ''] ?? 'nincs'}{o.subscriptionEnd && <div className="muted">{formatDate(o.subscriptionEnd)}</div>}{o.deletesAt && <div className="org-deletes">{t('törlés:')}{' '}{formatDateTime(o.deletesAt)}</div>}</>
                    : <span className="muted">{t('nem kell')}</span>}
                </td>
                <td className="align-right mono">{o.members}</td>
                <td className="align-right mono">{o.scans}</td>
                <td className="small muted">{o.lastScanAt ? formatDateTime(o.lastScanAt) : '-'}</td>
                <td className="small">{o.pluginOwned ? t('megvan') + (o.activePluginKeys ? t(' · {0} kulcs', o.activePluginKeys) : '') : <span className="muted">{t('nincs')}</span>}</td>
              </tr>
            ))}
            {rows && filtered.length === 0 && <tr><td colSpan={7} className="muted empty-row">{t('Nincs ilyen szervezet.')}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
