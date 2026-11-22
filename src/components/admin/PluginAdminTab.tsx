import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { pluginApi, type PluginKeys } from '../../api/plugin';
import { formatBytes, formatDateTime } from '../../store/format';
import { Icon } from '../Icon';
import { useCopyFeedback } from '../motion';

const COMMANDS: [string, string][] = [
  ['/ss <játékos>', 'SS indítása: átküldi az SS szerverre, befagyasztja, és Avenge-kódot kér neki'],
  ['/ss release <játékos>', 'felengedés (rövidebben: /unss <játékos>)'],
  ['/ss code <játékos>', 'új Avenge-kód, ha a régi lejárt'],
  ['/ss list', 'a folyamatban lévő SS-ek'],
  ['/ss reload', 'a config.yml és a messages.yml újratöltése']
];

const PERMISSIONS: [string, string][] = [
  ['avengess.use', 'SS indítása, felengedése, kódkérés'],
  ['avengess.notify', 'értesítés minden SS-eseményről (állapot, eredmény, kilépés)'],
  ['avengess.admin', '/ss reload'],
  ['avengess.exempt', 'őt nem lehet SS-re hívni']
];

export function PluginAdminTab() {
  const [data, setData] = useState<PluginKeys | null>(null);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { copiedKey, copy } = useCopyFeedback();

  const load = useCallback(() => {
    pluginApi.keys().then(setData).catch((err) => setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(null);
    }
  }

  function create(e: FormEvent) {
    e.preventDefault();
    run('create', async () => {
      const result = await pluginApi.create(name.trim());
      setCreated(result.key);
      setName('');
    });
  }

  const active = data?.keys.filter((k) => !k.revokedAt) ?? [];

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="package" size={18} /> Avenge SS - Velocity plugin</h2>
          <button
            type="button"
            className={`btn-primary btn-tiny ${busy === 'download' ? 'is-loading' : ''}`}
            disabled={busy !== null || !data?.pluginAvailable}
            onClick={() => run('download', () => pluginApi.download())}
          >
            <Icon name="download" size={14} /> AvengeSS.jar letöltése
          </button>
        </div>
        <p className="muted small">
          A <b>/ss</b> paranccsal SS-re hívhatod a játékost. A plugin átküldi az SS szerverre, ott befagyasztja, és megjeleníti az utasításokat (cím, bossbar, akciósáv, chat).
          Ha megadsz egy kulcsot, automatikusan Avenge-kódot is kér neki, és a chatben élőben látod a vizsgálat állapotát és az eredményt.
          Minecraft 1.19.4 - 1.21.x, Velocity 3.3 vagy újabb.
          {data?.pluginAvailable && data.pluginSize !== null && ` · ${formatBytes(data.pluginSize)}${data.pluginUpdatedAt ? `, frissítve: ${formatDateTime(data.pluginUpdatedAt)}` : ''}`}
        </p>

        <ol className="setup-steps small plugin-steps">
          <li>Tedd az <code>AvengeSS.jar</code>-t a <b>Velocity proxy</b> <code>plugins</code> mappájába, és indítsd újra a proxyt.</li>
          <li>A <code>velocity.toml</code>-ban legyen egy SS szerver (pl. <code>ss = "127.0.0.1:30070"</code>), és a nevét írd a <code>plugins/avengess/config.yml</code> <code>ss-server</code> sorába.</li>
          <li>Ugyanezt a jart tedd fel az <b>SS szerverre</b> (Paper 1.19.4+) is. Ez fagyasztja be ténylegesen a játékost: a proxy önmagában nem tudja megállítani a mozgást.</li>
          <li>Hozz létre lent egy kulcsot, írd a config <code>avenge.api-key</code> mezőjébe, majd <code>/ss reload</code>.</li>
          <li>Az üzeneteket a <code>plugins/avengess/messages.yml</code>-ben írhatod át (MiniMessage vagy &-es színkódok).</li>
        </ol>

        <div className="plugin-reference">
          <div>
            <span className="field-label">Parancsok</span>
            <dl className="plugin-list">
              {COMMANDS.map(([cmd, text]) => <div key={cmd}><dt className="mono">{cmd}</dt><dd>{text}</dd></div>)}
            </dl>
          </div>
          <div>
            <span className="field-label">Jogosultságok</span>
            <dl className="plugin-list">
              {PERMISSIONS.map(([perm, text]) => <div key={perm}><dt className="mono">{perm}</dt><dd>{text}</dd></div>)}
            </dl>
          </div>
        </div>
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="key" size={18} /> Plugin-kulcsok</h2>
        <p className="muted small">A kulccsal a plugin a szervezeted nevében kér vizsgálati kódot. Szerverenként érdemes külön kulcsot létrehozni; a kulcsot csak most, egyszer mutatjuk meg.</p>
        <form className="inline-form plugin-key-form" onSubmit={create}>
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="A kulcs neve, pl. Fő proxy" aria-label="A kulcs neve" />
          <button type="submit" className={`btn-secondary btn-tiny ${busy === 'create' ? 'is-loading' : ''}`} disabled={busy !== null || name.trim().length < 2}>
            <Icon name="plus" size={13} /> Új kulcs
          </button>
        </form>

        {created && (
          <div className="credentials-card plugin-created">
            <p className="small"><Icon name="alert" size={14} /> Másold ki most: ez a kulcs többé nem jeleníthető meg.</p>
            <code className="plugin-key-value">{created}</code>
            <div className="plugin-created-actions">
              <button type="button" className="btn-secondary btn-tiny" onClick={() => copy('plugin-key', created)}>
                <Icon name={copiedKey === 'plugin-key' ? 'check' : 'copy'} size={13} /> {copiedKey === 'plugin-key' ? 'Másolva' : 'Másolás'}
              </button>
              <button type="button" className="btn-ghost btn-tiny" onClick={() => setCreated(null)}>Kész</button>
            </div>
          </div>
        )}

        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Név</th><th>Kulcs</th><th>Létrehozta</th><th>Utoljára használva</th><th>Állapot</th><th /></tr></thead>
            <tbody>
              {data?.keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td className="mono small">{k.prefix}</td>
                  <td className="small muted">{k.createdByEmail ?? '-'}<br />{formatDateTime(k.createdAt)}</td>
                  <td className="small muted">{k.lastUsedAt ? formatDateTime(k.lastUsedAt) : 'még nem'}</td>
                  <td>{k.revokedAt ? <span className="status-pill status-ended">Visszavonva</span> : <span className="status-pill status-active">Aktív</span>}</td>
                  <td className="row-actions">
                    {!k.revokedAt && (
                      <button
                        type="button"
                        className="btn-ghost btn-tiny btn-danger"
                        disabled={busy !== null}
                        onClick={() => window.confirm(`Visszavonod a(z) „${k.name}” kulcsot? Az ezt használó plugin nem tud több kódot kérni.`) && run(`revoke-${k.id}`, () => pluginApi.revoke(k.id))}
                      >
                        Visszavonás
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.keys.length === 0 && <tr><td colSpan={6} className="muted empty-row">Még nincs kulcs.</td></tr>}
            </tbody>
          </table>
        </div>
        {data && active.length >= 10 && <p className="muted small">Legfeljebb 10 aktív kulcs lehet.</p>}
        {error && <p className="error-text error-in">{error}</p>}
      </section>
    </>
  );
}
