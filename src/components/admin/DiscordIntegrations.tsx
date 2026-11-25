import { t } from '../../i18n';
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
      setError(err instanceof ApiError ? err.message : t('Nem sikerült.'));
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
      return t('Kliens titok elmentve a szerveren.');
    });
  };

  const setChannel = (id: string) => run('mc-channel', async () => {
    await discordAdminApi.update({ mcChannelId: id });
    await onChanged();
    return id ? t('Az értesítő csatornája beállítva.') : t('Az értesítő kikapcsolva.');
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
          <h2 className="card-title"><Icon name="discord" size={18} />{' '}{t('Fiók-összekapcsolás')}</h2>
          <span className={`status-pill ${link?.hasClientSecret ? 'status-active' : 'status-pending'}`}>
            {link?.hasClientSecret ? t('Bekapcsolva · {0} összekapcsolt fiók', link.linkedAccounts) : t('Nincs beállítva')}
          </span>
        </div>
        <p className="muted small">{t('A vásárlók a Fiókom oldalon összekapcsolhatják a Discord-fiókjukat: az Avenge bot az alkalmazásaik közé kerül, az Avenge Discordon pedig automatikusan megkapják az Előfizető vagy a Plugin vásárló szerepkört (lejáratkor, visszatérítéskor és leválasztáskor a bot leveszi).')}</p>
        <ol className="setup-steps small muted">
          <li>{t('Developer Portal →')}{' '}<b>{t('OAuth2')}</b>{' '}{t('→ Redirects: add hozzá ezt a címet:')}{' '}
            <button type="button" className="btn-ghost btn-tiny mono" onClick={copyRedirect} title={t('Másolás')}>
              {link?.redirectUri ?? 'https://avenge.hu/discord/callback'} <Icon name={copied ? 'check' : 'copy'} size={12} />
            </button>
          </li>
          <li>{t('Ugyanott a')}{' '}<b>{t('Client Secret')}</b>{' '}{t('(Reset Secret) értékét másold be ide.')}</li>
          <li><b>{t('Installation')}</b>{' '}{t('→ Installation Contexts: kapcsold be a')}{' '}<b>{t('User Install')}</b>{' '}{t('lehetőséget (a Guild Install maradjon bekapcsolva).')}</li>
          <li>{t('Szerverbeállítások → Szerepkörök: a bot szerepköre legyen az Előfizető és a Plugin vásárló felett.')}</li>
        </ol>
        <form className="inline-form discord-token-form" onSubmit={saveSecret}>
          <input
            type="password"
            autoComplete="new-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={link?.hasClientSecret ? t('•••••••• (beállítva, csak cseréhez írd be újra)') : 'Client Secret'}
            aria-label={t('Client Secret')}
          />
          <button type="submit" className={`btn-primary btn-tiny ${busy === 'secret' ? 'is-loading' : ''}`} disabled={busy !== null || secret.trim().length < 16}>{t('Mentés')}</button>
          {link?.hasClientSecret && (
            <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={busy !== null}
              onClick={() => window.confirm(t('Kikapcsolod a Discord-összekapcsolást? A már összekapcsolt fiókok megmaradnak.')) && run('secret', async () => {
                await discordAdminApi.update({ clientSecret: '' });
                await onChanged();
                return t('A Discord-összekapcsolás kikapcsolva.');
              })}>{t('Kikapcsolás')}</button>
          )}
        </form>
        {link?.applicationId && <p className="muted small">{t('Alkalmazás-azonosító (Client ID):')}{' '}<span className="mono">{link.applicationId}</span></p>}
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '100ms' }}>
        <div className="scans-head">
          <h2 className="card-title"><Icon name="cube" size={18} />{' '}{t('Minecraft-verzió értesítő')}</h2>
          <span className={`status-pill ${mc?.channelId ? 'status-active' : 'status-pending'}`}>{mc?.channelId ? t('Bekapcsolva') : t('Kikapcsolva')}</span>
        </div>
        <p className="muted small">{t('Ha új Minecraft-verzió jelenik meg, a bot szép embedben szól a kiválasztott (akár privát) csatornába, hogy frissítsd a pluginokat; és külön szól, amikor a Paper is támogatja. Discordon is állítható:')}{' '}<span className="mono">{t('/mcertesito csatorna')}</span>, <span className="mono">{t('/mcertesito snapshotok')}</span>,{' '}
          <span className="mono">{t('/mcertesito teszt')}</span>{t('. Bárhol:')}{' '}<span className="mono">/mcverzio</span>.
        </p>
        <div className="mc-notifier-grid">
          <label className="mc-channel">
            <span className="field-label">{t('Csatorna')}</span>
            <select value={mc?.channelId ?? ''} onChange={(e) => setChannel(e.target.value)} disabled={busy !== null || channels === null} aria-label={t('Értesítő csatorna')}>
              <option value="">{t('Kikapcsolva')}</option>
              {mc?.channelId && channels && !channels.some((c) => c.id === mc.channelId) && <option value={mc.channelId}>#{mc.channelId}</option>}
              {(channels ?? []).map((c) => <option key={c.id} value={c.id}>{c.category ? `${c.category} / ` : ''}#{c.name}</option>)}
            </select>
          </label>
          <label className="check-label mc-snap">
            <input type="checkbox" checked={mc?.includeSnapshots ?? false} onChange={(e) => setSnapshots(e.target.checked)} disabled={busy !== null} />
            <span>{t('Snapshotokról és előzetes verziókról is')}</span>
          </label>
        </div>
        <dl className="mini-facts">
          <div><dt>{t('Legújabb kiadás')}</dt><dd className="mono">{mc?.lastRelease ?? '-'}</dd></div>
          <div><dt>{t('Legújabb snapshot')}</dt><dd className="mono">{mc?.lastSnapshot ?? '-'}</dd></div>
          <div><dt>{t('Paper')}</dt><dd>{mc?.lastRelease ? (mc.paperSupported ? t('Már támogatja') : t('Még nem támogatja')) : '-'}</dd></div>
          <div><dt>{t('Utolsó ellenőrzés')}</dt><dd>{mc?.lastCheckAt ? formatDateTime(mc.lastCheckAt) : '-'}</dd></div>
        </dl>
        {mc?.lastError && <p className="error-text small">{mc.lastError}</p>}
        <div className="discord-actions">
          <button type="button" className={`btn-secondary btn-tiny ${busy === 'mc-test' ? 'is-loading' : ''}`} disabled={busy !== null || !mc?.channelId}
            onClick={() => run('mc-test', async () => {
              await discordAdminApi.minecraftTest();
              return t('Próbaüzenet elküldve{0}.', channelName(mc?.channelId ?? null) ? t(' ide: #{0}', channelName(mc?.channelId ?? null)) : '');
            })}>
            <Icon name="message" size={13} />{' '}{t('Próbaüzenet')}</button>
          <button type="button" className={`btn-ghost btn-tiny ${busy === 'mc-check' ? 'is-loading' : ''}`} disabled={busy !== null}
            onClick={() => run('mc-check', async () => {
              await discordAdminApi.minecraftCheck();
              await onChanged();
              return t('Ellenőrizve.');
            })}>
            <Icon name="refresh" size={13} />{' '}{t('Ellenőrzés most')}</button>
        </div>
      </section>
      {notice && <p className="success-text small"><Icon name="check" size={14} /> {notice}</p>}
      {error && <p className="error-text error-in small">{error}</p>}
    </>
  );
}
