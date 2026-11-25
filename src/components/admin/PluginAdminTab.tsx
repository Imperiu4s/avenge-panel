import { t } from '../../i18n';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { pluginApi, type PluginKeys } from '../../api/plugin';
import { formatBytes, formatDateTime } from '../../store/format';
import { Icon } from '../Icon';
import { useCopyFeedback } from '../motion';

const COMMANDS: [string, string][] = [
  [t('/ss <játékos>'), t('PC Check indítása: befagyasztja, megnyitja a PC Check chatet, és Avenge-kódot kér neki (ugyanez: /pccheck)')],
  [t('/ss release <játékos>'), t('felengedés (rövidebben: /unss <játékos>)')],
  [t('/ss code <játékos>'), t('új Avenge-kód, ha a régi lejárt')],
  [t('/ss chat [játékos]'), t('a chated váltása a PC Check chat és a közös chat között')],
  [t('/ssc [játékos] <üzenet>'), t('írás a PC Check chatbe')],
  ['/ss spy', t('a többi PC Check chat figyelésének ki- és bekapcsolása')],
  ['/ss list', t('a folyamatban lévő PC Checkek')],
  ['/ss reload', t('a config.yml és a messages.yml újratöltése')]
];

const PERMISSIONS: [string, string][] = [
  ['avengess.use', t('PC Check indítása, felengedés, kódkérés, PC Check chat (az automatikus kitiltáshoz a kitiltó parancs joga is kell)')],
  ['avengess.spy', t('belelát a többi staff PC Check chatjébe')],
  ['avengess.notify', t('értesítés minden PC Check-eseményről (elkezdte, befejezte, megtagadta, kilépett)')],
  ['avengess.admin', '/ss reload'],
  ['avengess.exempt', t('őt nem lehet PC Checkre hívni')]
];

export function PluginAdminTab() {
  const [data, setData] = useState<PluginKeys | null>(null);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { copiedKey, copy } = useCopyFeedback();

  const load = useCallback(() => {
    pluginApi.keys().then(setData).catch((err) => setError(err instanceof ApiError ? err.message : t('Nem sikerült betölteni.')));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült.'));
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
          <h2 className="card-title"><Icon name="package" size={18} />{' '}{t('Avenge PC Check - Velocity plugin')}</h2>
          {data && !data.pluginOwned ? (
            data.storeSlug ? (
              <Link to={`/store/${data.storeSlug}`} className="btn-primary btn-tiny">
                <Icon name="cart" size={14} />{' '}{t('Vásárlás')}</Link>
            ) : (
              <span className="muted small">{t('Hamarosan az áruházban')}</span>
            )
          ) : (
            <button
              type="button"
              className={`btn-primary btn-tiny ${busy === 'download' ? 'is-loading' : ''}`}
              disabled={busy !== null || !data?.pluginAvailable}
              onClick={() => run('download', () => pluginApi.download())}
            >
              <Icon name="download" size={14} />{' '}{t('AvengeSS.jar letöltése')}</button>
          )}
        </div>
        {data && !data.pluginOwned && (
          <div className="plugin-buy">
            <p><b>{t('A plugin az áruházban vásárolható meg.')}</b>{' '}{t('A vásárlás után itt töltheted le, és itt hozhatod létre a plugin-kulcsokat is.')}</p>
            <p className="muted small">{t('A vásárláshoz az előfizetésedhez tartozó vásárlói fiókkal lépj be az áruházban, hogy a plugin ehhez a szervezethez kerüljön.')}</p>
            {data.storeSlug && <Link to={`/store/${data.storeSlug}`} className="btn-secondary btn-tiny"><Icon name="cart" size={13} />{' '}{t('Tovább az áruházba')}</Link>}
          </div>
        )}
        <p className="muted small">{t('A')}{' '}<b>/ss</b>{' '}{t('(vagy')}{' '}<b>/pccheck</b>{t(') paranccsal PC Checkre hívhatod a játékost. A plugin befagyasztja (mozgás, forgás, vakság), és megjeleníti az utasításokat (cím, bossbar, folyamatos akciósáv, chat). PC Check alatt a játékos és a staff külön chatben beszél, a játékos nem látja a közös chatet, a többi staff pedig spy módban belelát. Ha megadsz egy kulcsot, automatikusan Avenge-kódot is kér neki (kattintással másolható), és a chatben látod, ha elkezdte, befejezte vagy megtagadta a vizsgálatot. A részletek a panelen vannak. Ha a játékos 5 percen belül nem kezdi el a vizsgálatot, vagy közben bezárja a programot, a plugin a staff nevében automatikusan kitiltja (alapból')}{' '}<code>{t('/tempban <játékos> SS-megtagadása')}</code>{t(', LiteBans sablonnal). Minden PC Check-esemény az eredménnyel együtt (átment vagy megbukott) Discordra is naplózódik: az Avenge naplójába mindig, a saját szerveredére pedig a config')}{' '}<code>webhook.url</code>{' '}{t('beállításával. Minecraft 1.19.4 - 1.21.x, Velocity 3.3 vagy újabb.')}{data?.pluginAvailable && data.pluginSize !== null && ` · ${formatBytes(data.pluginSize)}${data.pluginUpdatedAt ? t(', frissítve: {0}', formatDateTime(data.pluginUpdatedAt)) : ''}`}
        </p>

        <ol className="setup-steps small plugin-steps">
          <li>{t('Tedd az')}{' '}<code>AvengeSS.jar</code>{t('-t a')}{' '}<b>{t('Velocity proxy')}</b> <code>{t('plugins')}</code>{' '}{t('mappájába, és indítsd újra a proxyt.')}</li>
          <li>{t('PC Check szerver (nem kötelező): a')}{' '}<code>velocity.toml</code>{t('-ban szereplő nevét írd a')}{' '}<code>plugins/avengess/config.yml</code> <code>ss-server.name</code>{' '}{t('sorába, vagy kapcsold ki (')}<code>{t('ss-server.enabled: false')}</code>{t('), és a játékos a mostani szerverén marad. A visszaküldés és a fallback szerver a')}{' '}<code>{t('return')}</code>{' '}{t('részben kapcsolható.')}</li>
          <li>{t('Ugyanezt a jart tedd fel azokra a')}{' '}<b>{t('Paper szerverekre')}</b>{' '}{t('(1.19.4+) is, ahol PC Checket tartasz. Ez fagyasztja be ténylegesen a játékost és kezeli a PC Check chatet: a proxy önmagában erre nem képes.')}</li>
          <li>{t('Hozz létre lent egy kulcsot, írd a config')}{' '}<code>avenge.api-key</code>{' '}{t('mezőjébe, majd')}{' '}<code>{t('/ss reload')}</code>.</li>
          <li>{t('Az üzeneteket a')}{' '}<code>plugins/avengess/messages.yml</code>{t('-ben írhatod át (MiniMessage vagy &-es színkódok). Frissítéskor a régi config és messages fájlról mentés készül, a beállításaid megmaradnak.')}</li>
        </ol>

        <div className="plugin-reference">
          <div>
            <span className="field-label">{t('Parancsok')}</span>
            <dl className="plugin-list">
              {COMMANDS.map(([cmd, text]) => <div key={cmd}><dt className="mono">{cmd}</dt><dd>{text}</dd></div>)}
            </dl>
          </div>
          <div>
            <span className="field-label">{t('Jogosultságok')}</span>
            <dl className="plugin-list">
              {PERMISSIONS.map(([perm, text]) => <div key={perm}><dt className="mono">{perm}</dt><dd>{text}</dd></div>)}
            </dl>
          </div>
        </div>
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="key" size={18} />{' '}{t('Plugin-kulcsok')}</h2>
        <p className="muted small">{t('A kulccsal a plugin a szervezeted nevében kér vizsgálati kódot. Szerverenként érdemes külön kulcsot létrehozni; a kulcsot csak most, egyszer mutatjuk meg.')}</p>
        {data && !data.pluginOwned && <p className="muted small"><Icon name="lock" size={13} />{' '}{t('Kulcsot a plugin megvásárlása után hozhatsz létre.')}</p>}
        {data?.pluginOwned && <form className="inline-form plugin-key-form" onSubmit={create}>
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={t('A kulcs neve, pl. Fő proxy')} aria-label={t('A kulcs neve')} />
          <button type="submit" className={`btn-secondary btn-tiny ${busy === 'create' ? 'is-loading' : ''}`} disabled={busy !== null || name.trim().length < 2}>
            <Icon name="plus" size={13} />{' '}{t('Új kulcs')}</button>
        </form>}

        {created && (
          <div className="credentials-card plugin-created">
            <p className="small"><Icon name="alert" size={14} />{' '}{t('Másold ki most: ez a kulcs többé nem jeleníthető meg.')}</p>
            <code className="plugin-key-value">{created}</code>
            <div className="plugin-created-actions">
              <button type="button" className="btn-secondary btn-tiny" onClick={() => copy('plugin-key', created)}>
                <Icon name={copiedKey === 'plugin-key' ? 'check' : 'copy'} size={13} /> {copiedKey === 'plugin-key' ? t('Másolva') : t('Másolás')}
              </button>
              <button type="button" className="btn-ghost btn-tiny" onClick={() => setCreated(null)}>{t('Kész')}</button>
            </div>
          </div>
        )}

        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>{t('Név')}</th><th>{t('Kulcs')}</th><th>{t('Létrehozta')}</th><th>{t('Utoljára használva')}</th><th>{t('Állapot')}</th><th /></tr></thead>
            <tbody>
              {data?.keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td className="mono small">{k.prefix}</td>
                  <td className="small muted">{k.createdByEmail ?? '-'}<br />{formatDateTime(k.createdAt)}</td>
                  <td className="small muted">{k.lastUsedAt ? formatDateTime(k.lastUsedAt) : t('még nem')}</td>
                  <td>{k.revokedAt ? <span className="status-pill status-ended">{t('Visszavonva')}</span> : <span className="status-pill status-active">{t('Aktív')}</span>}</td>
                  <td className="row-actions">
                    {!k.revokedAt && (
                      <button
                        type="button"
                        className="btn-ghost btn-tiny btn-danger"
                        disabled={busy !== null}
                        onClick={() => window.confirm(t('Visszavonod a(z) „{0}” kulcsot? Az ezt használó plugin nem tud több kódot kérni.', k.name)) && run(`revoke-${k.id}`, () => pluginApi.revoke(k.id))}
                      >{t('Visszavonás')}</button>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.keys.length === 0 && <tr><td colSpan={6} className="muted empty-row">{t('Még nincs kulcs.')}</td></tr>}
            </tbody>
          </table>
        </div>
        {data && active.length >= 10 && <p className="muted small">{t('Legfeljebb 10 aktív kulcs lehet.')}</p>}
        {error && <p className="error-text error-in">{error}</p>}
      </section>
    </>
  );
}
