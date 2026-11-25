import { t } from '../../i18n';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { storeApi, type DiscordLink } from '../../api/store';
import { Icon } from '../../components/Icon';
import { useCustomer } from '../../store/CustomerAuth';

export function DiscordCallbackPage() {
  const [params] = useSearchParams();
  const { isLoggedIn } = useCustomer();
  const [result, setResult] = useState<DiscordLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const code = params.get('code');
  const state = params.get('state');
  const denied = params.get('error');

  useEffect(() => {
    if (started.current || !isLoggedIn || !code || !state || denied) return;
    started.current = true;
    storeApi.discordCallback(code, state)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('Nem sikerült összekapcsolni.')));
  }, [isLoggedIn, code, state, denied]);

  let body;
  if (denied) {
    body = <p className="muted">{t('Megszakítottad az összekapcsolást, a Discord-fiókod nem lett hozzáadva.')}</p>;
  } else if (!isLoggedIn) {
    body = <p className="muted">{t('Az összekapcsoláshoz be kell lépned az avenge.hu fiókodba. Lépj be, és kezdd újra a Fiókom oldalon.')}</p>;
  } else if (!code || !state) {
    body = <p className="muted">{t('Hiányzó adatok: kezdd újra az összekapcsolást a Fiókom oldalon.')}</p>;
  } else if (error) {
    body = <p className="error-text">{error}</p>;
  } else if (!result) {
    body = <p className="muted">{t('Összekapcsolás folyamatban…')}</p>;
  } else {
    body = (
      <>
        <p className="success-text"><Icon name="check" size={16} />{' '}{t('Összekapcsolva:')}{' '}<strong>{result.username}</strong></p>
        {result.inGuild === true && <p className="muted">{t('A szerepköreidet az Avenge Discordon már be is állítottuk.')}</p>}
        {result.inGuild === false && (
          <>
            <p className="muted">{t('Még nem vagy tagja az Avenge Discordnak. Lépj be, és a szerepköreidet pár percen belül megkapod.')}</p>
            {result.inviteUrl && <a className="btn-secondary" href={result.inviteUrl} target="_blank" rel="noreferrer"><Icon name="external" size={15} />{' '}{t('Belépés az Avenge Discordra')}</a>}
          </>
        )}
      </>
    );
  }

  return (
    <main className="page store-page">
      <section className="card discord-callback stagger-in">
        <h1 className="card-title"><Icon name="discord" size={20} />{' '}{t('Discord-összekapcsolás')}</h1>
        {body}
        <Link to="/store/fiok" className="btn-primary">{t('Vissza a fiókomhoz')}</Link>
      </section>
    </main>
  );
}
