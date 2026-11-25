import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { storeApi, type DiscordLink } from '../api/store';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/motion';
import { formatDate } from './format';

export function DiscordLinkCard() {
  const [link, setLink] = useState<DiscordLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLink(await storeApi.discord());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await storeApi.discordStart();
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
      setBusy(false);
    }
  }

  async function unlink() {
    if (!window.confirm('Leválasztod a Discord-fiókodat? Az Avenge Discordon kapott szerepköreidet a bot leveszi.')) return;
    setBusy(true);
    setError(null);
    try {
      await storeApi.discordUnlink();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stagger-in discord-link-card" style={{ animationDelay: '35ms' }}>
      <h2 className="card-title"><Icon name="discord" size={18} /> Discord</h2>
      {!link && !error && <><Skeleton width="70%" /><Skeleton width="45%" style={{ marginTop: 8 }} /></>}
      {link && link.linked && (
        <>
          <div className="discord-link-who">
            <span className="discord-link-badge"><Icon name="discord" size={18} /></span>
            <div>
              <strong>{link.username ?? 'Discord-fiók'}</strong>
              {link.linkedAt && <span className="muted small">Összekapcsolva: {formatDate(link.linkedAt)}</span>}
            </div>
          </div>
          {link.inGuild === true && <p className="muted small">Az Avenge Discordon a vásárlásaid és az előfizetésed alapján automatikusan megkapod a szerepköreidet.</p>}
          {link.inGuild === false && (
            <>
              <p className="muted small">Még nem vagy tagja az Avenge Discordnak. Lépj be, és a szerepköreidet pár percen belül megkapod.</p>
              {link.inviteUrl && <a className="btn-secondary btn-block" href={link.inviteUrl} target="_blank" rel="noreferrer"><Icon name="external" size={15} /> Belépés az Avenge Discordra</a>}
            </>
          )}
          <p className="muted small">Az Avenge bot az alkalmazásaid között van: a <span className="mono">/mcverzio</span> parancsot bárhol használhatod.</p>
          <button type="button" className="btn-ghost btn-tiny" onClick={unlink} disabled={busy}><Icon name="x" size={13} /> Leválasztás</button>
        </>
      )}
      {link && !link.linked && (
        <>
          <p className="muted small">Kapcsold össze a Discord-fiókodat: az Avenge bot az alkalmazásaid közé kerül, az Avenge Discordon pedig automatikusan megkapod az Előfizető vagy a Plugin vásárló szerepkört.</p>
          {link.available
            ? <button type="button" className={`btn-discord btn-block ${busy ? 'is-loading' : ''}`} onClick={connect} disabled={busy}><Icon name="discord" size={17} /> Discord összekapcsolása</button>
            : <p className="muted small">A Discord-összekapcsolás hamarosan elérhető.</p>}
        </>
      )}
      {error && <p className="error-text error-in">{error}</p>}
    </section>
  );
}
