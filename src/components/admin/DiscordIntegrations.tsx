import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { discordAdminApi, type DiscordChannel, type DiscordSettings } from '../../api/store';
import { formatDateTime } from '../../store/format';
import { Icon } from '../Icon';

export function DiscordIntegrations({ settings, onChanged }: { settings: DiscordSettings; onChanged: () => Promise<void> }) {
  const [secret, setSecret] = useState('');
  const [channels, setChannels] = useState<DiscordChannel[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = settings.link;
  const mc = settings.minecraft;

  useEffect(() => {
    discordAdminApi.channels().then(setChannels).catch(() => setChannels([]));
  }, []);

  async function run(key: string, action: () => Promise<string | void>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const message = await action();
      if (message) setNotice(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(null);
    }
  }

  const saveSecret = (e: FormEvent) => {
    e.preventDefault();
    run('secret', async () => {
      await discordAdminApi.update({ clientSecret: secret.trim() });
      setSecret('');
      await onChanged();
      return 'Kliens titok elmentve a szerveren.';
    });
  };

  const setChannel = (id: string) => run('mc-channel', async () => {
    await discordAdminApi.update({ mcChannelId: id });
    await onChanged();
    return id ? 'Az értesítő csatornája beállítva.' : 'Az értesítő kikapcsolva.';
  });

  const setSnapshots = (value: boolean) => run('mc-snap', async () => {
    await discordAdminApi.update({ mcIncludeSnapshots: value });
    await onChanged();
  });

  const copyRedirect = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.redirectUri);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const channelName = (id: string | null) => channels?.find((c) => c.id === id)?.name;

  return (
    <>
      <section className="card section-gap stagger-in" style={{ animationDelay: '80ms' }}>
        <div className="scans-head">
          <h2 className="card-title"><Icon name="discord" size={18} /> Fiók-összekapcsolás</h2>
          <span className={`status-pill ${link?.hasClientSecret ? 'status-active' : 'status-pending'}`}>
            {link?.hasClientSecret ? `Bekapcsolva · ${link.linkedAccounts} összekapcsolt fiók` : 'Nincs beállítva'}
          </span>
        </div>
        <p className="muted small">
          A vásárlók a Fiókom oldalon összekapcsolhatják a Discord-fiókjukat: az Avenge bot az alkalmazásaik közé kerül, az Avenge Discordon pedig
          automatikusan megkapják az Előfizető vagy a Plugin vásárló szerepkört (lejáratkor, visszatérítéskor és leválasztáskor a bot leveszi).
        </p>
        <ol className="setup-steps small muted">
          <li>
            Developer Portal → <b>OAuth2</b> → Redirects: add hozzá ezt a címet:{' '}
            <button type="button" className="btn-ghost btn-tiny mono" onClick={copyRedirect} title="Másolás">
              {link?.redirectUri ?? 'https://avenge.hu/discord/callback'} <Icon name={copied ? 'check' : 'copy'} size={12} />
            </button>
          </li>
          <li>Ugyanott a <b>Client Secret</b> (Reset Secret) értékét másold be ide.</li>
          <li><b>Installation</b> → Installation Contexts: kapcsold be a <b>User Install</b> lehetőséget (a Guild Install maradjon bekapcsolva).</li>
          <li>Szerverbeállítások → Szerepkörök: a bot szerepköre legyen az Előfizető és a Plugin vásárló felett.</li>
        </ol>
        <form className="inline-form discord-token-form" onSubmit={saveSecret}>
          <input
            type="password"
            autoComplete="new-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={link?.hasClientSecret ? '•••••••• (beállítva, csak cseréhez írd be újra)' : 'Client Secret'}
            aria-label="Client Secret"
          />
          <button type="submit" className={`btn-primary btn-tiny ${busy === 'secret' ? 'is-loading' : ''}`} disabled={busy !== null || secret.trim().length < 16}>
            Mentés
          </button>
          {link?.hasClientSecret && (
            <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy !== null}
              onClick={() => window.confirm('Kikapcsolod a Discord-összekapcsolást? A már összekapcsolt fiókok megmaradnak.') && run('secret', async () => {
                await discordAdminApi.update({ clientSecret: '' });
                await onChanged();
                return 'A Discord-összekapcsolás kikapcsolva.';
              })}>
              Kikapcsolás
            </button>
          )}
        </form>
        {link?.applicationId && <p className="muted small">Alkalmazás-azonosító (Client ID): <span className="mono">{link.applicationId}</span></p>}
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '100ms' }}>
        <div className="scans-head">
          <h2 className="card-title"><Icon name="cube" size={18} /> Minecraft-verzió értesítő</h2>
          <span className={`status-pill ${mc?.channelId ? 'status-active' : 'status-pending'}`}>{mc?.channelId ? 'Bekapcsolva' : 'Kikapcsolva'}</span>
        </div>
        <p className="muted small">
          Ha új Minecraft-verzió jelenik meg, a bot szép embedben szól a kiválasztott (akár privát) csatornába, hogy frissítsd a pluginokat; és külön szól,
          amikor a Paper is támogatja. Discordon is állítható: <span className="mono">/mcertesito csatorna</span>, <span className="mono">/mcertesito snapshotok</span>,{' '}
          <span className="mono">/mcertesito teszt</span>. Bárhol: <span className="mono">/mcverzio</span>.
        </p>
        <div className="mc-notifier-grid">
          <label className="mc-channel">
            <span className="field-label">Csatorna</span>
            <select value={mc?.channelId ?? ''} onChange={(e) => setChannel(e.target.value)} disabled={busy !== null || channels === null} aria-label="Értesítő csatorna">
              <option value="">Kikapcsolva</option>
              {mc?.channelId && channels && !channels.some((c) => c.id === mc.channelId) && <option value={mc.channelId}>#{mc.channelId}</option>}
              {(channels ?? []).map((c) => <option key={c.id} value={c.id}>{c.category ? `${c.category} / ` : ''}#{c.name}</option>)}
            </select>
          </label>
          <label className="check-label mc-snap">
            <input type="checkbox" checked={mc?.includeSnapshots ?? false} onChange={(e) => setSnapshots(e.target.checked)} disabled={busy !== null} />
            <span>Snapshotokról és előzetes verziókról is</span>
          </label>
        </div>
        <dl className="mini-facts">
          <div><dt>Legújabb kiadás</dt><dd className="mono">{mc?.lastRelease ?? '-'}</dd></div>
          <div><dt>Legújabb snapshot</dt><dd className="mono">{mc?.lastSnapshot ?? '-'}</dd></div>
          <div><dt>Paper</dt><dd>{mc?.lastRelease ? (mc.paperSupported ? 'Már támogatja' : 'Még nem támogatja') : '-'}</dd></div>
          <div><dt>Utolsó ellenőrzés</dt><dd>{mc?.lastCheckAt ? formatDateTime(mc.lastCheckAt) : '-'}</dd></div>
        </dl>
        {mc?.lastError && <p className="error-text small">{mc.lastError}</p>}
        <div className="discord-actions">
          <button type="button" className={`btn-secondary btn-tiny ${busy === 'mc-test' ? 'is-loading' : ''}`} disabled={busy !== null || !mc?.channelId}
            onClick={() => run('mc-test', async () => {
              await discordAdminApi.minecraftTest();
              return `Próbaüzenet elküldve${channelName(mc?.channelId ?? null) ? ` ide: #${channelName(mc?.channelId ?? null)}` : ''}.`;
            })}>
            <Icon name="message" size={13} /> Próbaüzenet
          </button>
          <button type="button" className={`btn-ghost btn-tiny ${busy === 'mc-check' ? 'is-loading' : ''}`} disabled={busy !== null}
            onClick={() => run('mc-check', async () => {
              await discordAdminApi.minecraftCheck();
              await onChanged();
              return 'Ellenőrizve.';
            })}>
            <Icon name="refresh" size={13} /> Ellenőrzés most
          </button>
        </div>
      </section>
      {notice && <p className="success-text small"><Icon name="check" size={14} /> {notice}</p>}
      {error && <p className="error-text error-in small">{error}</p>}
    </>
  );
}
