import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { discordAdminApi, type DiscordJob, type DiscordSettings } from '../../api/store';
import { formatDateTime } from '../../store/format';
import { Icon } from '../Icon';

const KIND_LABELS: Record<string, string> = { apply: 'Szerver berendezése', post: 'Info-üzenetek' };

export function DiscordAdminTab() {
  const [settings, setSettings] = useState<DiscordSettings | null>(null);
  const [job, setJob] = useState<DiscordJob | null>(null);
  const [token, setToken] = useState('');
  const [guildId, setGuildId] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [structure, setStructure] = useState<string[] | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  const load = useCallback(async () => {
    try {
      const s = await discordAdminApi.get();
      setSettings(s);
      setJob(s.job);
      setGuildId(s.guildId ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a Discord-beállításokat.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!job?.running) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await discordAdminApi.job();
        setJob(next);
        if (!next.running) {
          window.clearInterval(timer);
          load();
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, [job?.running, load]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job?.log.length]);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(null);
    }
  }

  const saveToken = (e: FormEvent) => {
    e.preventDefault();
    run('token', async () => {
      await discordAdminApi.update({ botToken: token.trim() });
      setToken('');
      setNotice('Bot token elmentve a szerveren.');
      await load();
    });
  };

  const saveGuild = (id: string) => run('guild', async () => {
    setGuildId(id);
    await discordAdminApi.update({ guildId: id });
    setNotice('Szerver kiválasztva.');
    await load();
  });

  const start = (kind: 'apply' | 'post') => {
    const question = kind === 'apply'
      ? 'Berendezed a Discord szervert a terv szerint? Létrehozza a hiányzó rangokat és csatornákat, bekapcsolja a Community funkciót, és beállítja az ikont. Meglévő csatornát nem töröl.'
      : 'Kiküldöd (vagy frissíted) az info-üzeneteket az info-csatornákba?';
    if (!window.confirm(question)) return;
    run(kind, async () => {
      setJob(kind === 'apply' ? await discordAdminApi.apply() : await discordAdminApi.post());
    });
  };

  const showStructure = () => run('structure', async () => {
    setStructure((await discordAdminApi.structure()).lines);
  });

  if (!settings) {
    return <section className="card">{error ? <p className="error-text">{error}</p> : <p className="muted">Betöltés...</p>}</section>;
  }

  const connected = settings.hasToken && !settings.botError && settings.botId;
  const selected = settings.guilds.find((g) => g.id === settings.guildId);
  const running = job?.running ?? false;

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="message" size={18} /> Discord bot</h2>
          <span className="discord-bot-status">
            {connected
              ? <span className="status-pill status-active">Kapcsolódva{settings.botName ? `: ${settings.botName}` : ''}</span>
              : <span className="status-pill status-pending">{settings.hasToken ? 'Hibás kapcsolat' : 'Nincs beállítva'}</span>}
            {settings.gateway && (
              <span className={`status-pill ${settings.gateway.state === 'connected' ? 'status-active' : 'status-pending'}`} title="A bot folyamatos kapcsolata a Discorddal (online állapot)">
                {settings.gateway.state === 'connected' ? `Online${settings.gateway.latencyMs !== null ? ` · ${settings.gateway.latencyMs} ms` : ''}` : settings.gateway.state === 'no-token' ? 'Offline' : 'Csatlakozik...'}
              </span>
            )}
            {settings.hasToken && (
              <button type="button" className="btn-ghost btn-tiny" title="Bot újracsatlakoztatása" onClick={() => discordAdminApi.restartGateway().then(load).catch(() => undefined)}>
                <Icon name="refresh" size={13} />
              </button>
            )}
          </span>
        </div>
        {settings.botError && <p className="error-text">{settings.botError}</p>}
        {settings.gateway?.lastError && settings.gateway.state !== 'connected' && <p className="error-text small">{settings.gateway.lastError}</p>}

        <ol className="setup-steps small muted">
          <li>A <a className="text-link" href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">Discord Developer Portalon</a> hozz létre egy alkalmazást, a <b>Bot</b> fülön kérj új tokent (Reset Token), és másold be ide.</li>
          <li>Hívd meg a botot a szerveredre a lenti gombbal (Administrator joggal).</li>
          <li>Válaszd ki a szervert, majd indítsd a berendezést. A Szerverbeállítások → Szerepkörök alatt a bot szerepköre legyen a lista tetején.</li>
        </ol>

        <form className="inline-form discord-token-form" onSubmit={saveToken}>
          <input
            type="password"
            autoComplete="new-password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={settings.hasToken ? '•••••••• (beállítva, csak cseréhez írd be újra)' : 'Bot token'}
            aria-label="Bot token"
          />
          <button type="submit" className={`btn-primary btn-tiny ${busy === 'token' ? 'is-loading' : ''}`} disabled={busy !== null || token.trim().length < 20}>
            Mentés
          </button>
        </form>
        <p className="muted small">A token csak a szerverre kerül, a panel soha nem mutatja meg újra.</p>

        {settings.inviteUrl && (
          <a className="btn-secondary btn-tiny" href={settings.inviteUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={13} /> Bot meghívása a szerverre
          </a>
        )}

        {connected && (
          <div className="discord-guilds section-gap">
            <span className="field-label">Szerver</span>
            {settings.guilds.length === 0
              ? <p className="muted small">A bot még egy szerveren sincs bent. Hívd meg a fenti gombbal, majd frissítsd az oldalt.</p>
              : (
                <div className="inline-form">
                  <select value={guildId} onChange={(e) => saveGuild(e.target.value)} disabled={busy !== null || running} aria-label="Discord szerver">
                    <option value="">Válassz szervert...</option>
                    {settings.guilds.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button type="button" className="btn-ghost btn-tiny" onClick={() => load()} disabled={busy !== null}><Icon name="refresh" size={13} /> Frissítés</button>
                </div>
              )}
          </div>
        )}
      </section>

      {connected && selected && (
        <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
          <h2 className="card-title"><Icon name="settings" size={18} /> {selected.name}</h2>
          <div className="discord-actions">
            <button type="button" className={`btn-primary ${busy === 'apply' ? 'is-loading' : ''}`} onClick={() => start('apply')} disabled={busy !== null || running}>
              <Icon name="layers" size={15} /> Szerver berendezése
            </button>
            <button type="button" className={`btn-secondary ${busy === 'post' ? 'is-loading' : ''}`} onClick={() => start('post')} disabled={busy !== null || running}>
              <Icon name="message" size={15} /> Info-üzenetek {settings.postedMessages > 0 ? 'frissítése' : 'kiküldése'}
            </button>
            <button type="button" className="btn-ghost btn-tiny" onClick={showStructure} disabled={busy !== null || running}>
              <Icon name="eye" size={13} /> Jelenlegi felépítés
            </button>
          </div>
          <p className="muted small">
            A berendezés újrafuttatható: a meglévő elemeket frissíti, nem duplikál, és semmit nem töröl.
            {settings.lastRunAt && ` Utolsó futás: ${KIND_LABELS[settings.lastRunKind] ?? settings.lastRunKind}, ${formatDateTime(settings.lastRunAt)}.`}
          </p>

          {job && (job.running || job.log.length > 0) && (
            <div className="discord-log-wrap">
              <div className="discord-log-head">
                <span className="field-label">{KIND_LABELS[job.kind ?? ''] ?? 'Feladat'}</span>
                {job.running
                  ? <span className="status-pill status-pending"><span className="btn-spinner" aria-hidden="true" /> Fut...</span>
                  : job.error
                    ? <span className="status-pill status-failed">Hiba</span>
                    : <span className="status-pill status-active">Kész</span>}
              </div>
              <pre ref={logRef} className="discord-log mono small">{job.log.join('\n')}</pre>
            </div>
          )}

          {structure && (
            <div className="discord-log-wrap">
              <span className="field-label">Jelenlegi felépítés</span>
              <pre className="discord-log mono small">{structure.join('\n')}</pre>
            </div>
          )}
        </section>
      )}

      {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
      {error && <p className="error-text error-in">{error}</p>}
    </>
  );
}
