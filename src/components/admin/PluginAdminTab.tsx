import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { pluginApi, type PluginKeys } from '../../api/plugin';
import { formatBytes, formatDateTime } from '../../store/format';
import { Icon } from '../Icon';
import { useCopyFeedback } from '../motion';

const COMMANDS: [string, string][] = [
  ['/ss <játékos>', 'PC Check indítása: befagyasztja, megnyitja a PC Check chatet, és Avenge-kódot kér neki (ugyanez: /pccheck)'],
  ['/ss release <játékos>', 'felengedés (rövidebben: /unss <játékos>)'],
  ['/ss code <játékos>', 'új Avenge-kód, ha a régi lejárt'],
  ['/ss chat [játékos]', 'a chated váltása a PC Check chat és a közös chat között'],
  ['/ssc [játékos] <üzenet>', 'írás a PC Check chatbe'],
  ['/ss spy', 'a többi PC Check chat figyelésének ki- és bekapcsolása'],
  ['/ss list', 'a folyamatban lévő PC Checkek'],
  ['/ss reload', 'a config.yml és a messages.yml újratöltése']
];

const PERMISSIONS: [string, string][] = [
  ['avengess.use', 'PC Check indítása, felengedés, kódkérés, PC Check chat (az automatikus kitiltáshoz a kitiltó parancs joga is kell)'],
  ['avengess.spy', 'belelát a többi staff PC Check chatjébe'],
  ['avengess.notify', 'értesítés minden PC Check-eseményről (elkezdte, befejezte, megtagadta, kilépett)'],
  ['avengess.admin', '/ss reload'],
  ['avengess.exempt', 'őt nem lehet PC Checkre hívni']
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
          <h2 className="card-title"><Icon name="package" size={18} /> Avenge PC Check - Velocity plugin</h2>
          {data && !data.pluginOwned ? (
            data.storeSlug ? (
              <Link to={`/store/${data.storeSlug}`} className="btn-primary btn-tiny">
                <Icon name="cart" size={14} /> Vásárlás
              </Link>
            ) : (
              <span className="muted small">Hamarosan az áruházban</span>
            )
          ) : (
            <button
              type="button"
              className={`btn-primary btn-tiny ${busy === 'download' ? 'is-loading' : ''}`}
              disabled={busy !== null || !data?.pluginAvailable}
              onClick={() => run('download', () => pluginApi.download())}
            >
              <Icon name="download" size={14} /> AvengeSS.jar letöltése
            </button>
          )}
        </div>
        {data && !data.pluginOwned && (
          <div className="plugin-buy">
            <p><b>A plugin az áruházban vásárolható meg.</b> A vásárlás után itt töltheted le, és itt hozhatod létre a plugin-kulcsokat is.</p>
            <p className="muted small">A vásárláshoz az előfizetésedhez tartozó vásárlói fiókkal lépj be az áruházban, hogy a plugin ehhez a szervezethez kerüljön.</p>
            {data.storeSlug && <Link to={`/store/${data.storeSlug}`} className="btn-secondary btn-tiny"><Icon name="cart" size={13} /> Tovább az áruházba</Link>}
          </div>
        )}
        <p className="muted small">
          A <b>/ss</b> (vagy <b>/pccheck</b>) paranccsal PC Checkre hívhatod a játékost. A plugin befagyasztja (mozgás, forgás, vakság), és megjeleníti az utasításokat (cím, bossbar, folyamatos akciósáv, chat).
          PC Check alatt a játékos és a staff külön chatben beszél, a játékos nem látja a közös chatet, a többi staff pedig spy módban belelát.
          Ha megadsz egy kulcsot, automatikusan Avenge-kódot is kér neki (kattintással másolható), és a chatben látod, ha elkezdte, befejezte vagy megtagadta a vizsgálatot. A részletek a panelen vannak.
          Ha a játékos 5 percen belül nem kezdi el a vizsgálatot, vagy közben bezárja a programot, a plugin a staff nevében automatikusan kitiltja (alapból <code>/tempban &lt;játékos&gt; SS-megtagadása</code>, LiteBans sablonnal).
          Minden PC Check-esemény az eredménnyel együtt (átment vagy megbukott) Discordra is naplózódik: az Avenge naplójába mindig, a saját szerveredére pedig a config <code>webhook.url</code> beállításával.
          Minecraft 1.19.4 - 1.21.x, Velocity 3.3 vagy újabb.
          {data?.pluginAvailable && data.pluginSize !== null && ` · ${formatBytes(data.pluginSize)}${data.pluginUpdatedAt ? `, frissítve: ${formatDateTime(data.pluginUpdatedAt)}` : ''}`}
        </p>

        <ol className="setup-steps small plugin-steps">
          <li>Tedd az <code>AvengeSS.jar</code>-t a <b>Velocity proxy</b> <code>plugins</code> mappájába, és indítsd újra a proxyt.</li>
          <li>PC Check szerver (nem kötelező): a <code>velocity.toml</code>-ban szereplő nevét írd a <code>plugins/avengess/config.yml</code> <code>ss-server.name</code> sorába, vagy kapcsold ki (<code>ss-server.enabled: false</code>), és a játékos a mostani szerverén marad. A visszaküldés és a fallback szerver a <code>return</code> részben kapcsolható.</li>
          <li>Ugyanezt a jart tedd fel azokra a <b>Paper szerverekre</b> (1.19.4+) is, ahol PC Checket tartasz. Ez fagyasztja be ténylegesen a játékost és kezeli a PC Check chatet: a proxy önmagában erre nem képes.</li>
          <li>Hozz létre lent egy kulcsot, írd a config <code>avenge.api-key</code> mezőjébe, majd <code>/ss reload</code>.</li>
          <li>Az üzeneteket a <code>plugins/avengess/messages.yml</code>-ben írhatod át (MiniMessage vagy &-es színkódok). Frissítéskor a régi config és messages fájlról mentés készül, a beállításaid megmaradnak.</li>
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
        {data && !data.pluginOwned && <p className="muted small"><Icon name="lock" size={13} /> Kulcsot a plugin megvásárlása után hozhatsz létre.</p>}
        {data?.pluginOwned && <form className="inline-form plugin-key-form" onSubmit={create}>
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="A kulcs neve, pl. Fő proxy" aria-label="A kulcs neve" />
          <button type="submit" className={`btn-secondary btn-tiny ${busy === 'create' ? 'is-loading' : ''}`} disabled={busy !== null || name.trim().length < 2}>
            <Icon name="plus" size={13} /> Új kulcs
          </button>
        </form>}

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
