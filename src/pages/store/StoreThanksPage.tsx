import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storeApi } from '../../api/store';
import { Icon } from '../../components/Icon';
import { useCustomer } from '../../store/CustomerAuth';

type State = 'waiting' | 'done' | 'failed' | 'slow' | 'login';

/**
 * A Tebex fizetés után ide tér vissza a vásárló. A jóváírást a Tebex webhookja végzi
 * (pár másodperc), ezért itt megvárjuk, amíg a rendelés / előfizetés aktív lesz.
 */
export function StoreThanksPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const subscriptionId = params.get('subscription');
  const { isLoggedIn, refresh } = useCustomer();
  const [state, setState] = useState<State>(isLoggedIn ? 'waiting' : 'login');

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      attempts++;
      try {
        if (orderId) {
          const order = await storeApi.order(orderId);
          if (order.status === 'Paid') return 'done';
          if (order.status === 'Declined' || order.status === 'Cancelled') return 'failed';
        } else if (subscriptionId) {
          const me = await storeApi.me();
          if (me.subscription?.id === subscriptionId && (me.subscription.status === 'Active' || me.subscription.status === 'CancelPending')) return 'done';
          if (me.subscription?.id === subscriptionId && me.subscription.status === 'Failed') return 'failed';
        } else {
          return 'done';
        }
      } catch {
        // átmeneti hiba: próbáljuk tovább
      }
      return attempts >= 40 ? 'slow' : null;
    };

    const loop = async () => {
      while (!cancelled) {
        const result = await check();
        if (cancelled) return;
        if (result) {
          setState(result);
          if (result === 'done') refresh().catch(() => undefined);
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
      }
    };
    loop();
    return () => { cancelled = true; };
  }, [isLoggedIn, orderId, subscriptionId, refresh]);

  const isSub = subscriptionId !== null;

  return (
    <main className="page page-narrow store-page">
      <section className={`card thanks-card thanks-${state} stagger-in`}>
        {state === 'waiting' && (
          <>
            <span className="thanks-icon thanks-spin" aria-hidden="true"><Icon name="refresh" size={34} /></span>
            <h1>Fizetés ellenőrzése...</h1>
            <p className="muted">A Tebex visszaigazolása általában néhány másodperc. Ne zárd be az oldalt.</p>
          </>
        )}
        {state === 'done' && (
          <>
            <span className="thanks-icon" aria-hidden="true"><Icon name="check" size={34} /></span>
            <h1>Köszönjük a vásárlást!</h1>
            <p className="muted">{isSub ? 'Az előfizetésed aktív. Az SS panelt a fiókodból egy kattintással megnyithatod; a staff belépésnél ugyanezzel az e-mail címmel és jelszóval is beléphetsz.' : 'A plugin a tiéd: a fiókodban bármikor letöltheted, a frissítéseivel együtt. A számlát a Tebex e-mailben küldi.'}</p>
            <div className="thanks-actions">
              <Link to="/store/fiok" className="btn-primary">{isSub ? 'Fiókom és SS panel' : 'Pluginjaim'} <Icon name="arrow-right" size={16} /></Link>
              <Link to="/store" className="btn-ghost">Vissza az áruházba</Link>
            </div>
          </>
        )}
        {state === 'failed' && (
          <>
            <span className="thanks-icon" aria-hidden="true"><Icon name="x" size={34} /></span>
            <h1>A fizetés nem sikerült</h1>
            <p className="muted">Nem terheltünk meg semmit. Próbáld újra, vagy válassz másik fizetési módot.</p>
            <div className="thanks-actions"><Link to={isSub ? '/elofizetes' : '/store'} className="btn-primary">Újrapróbálom</Link></div>
          </>
        )}
        {state === 'slow' && (
          <>
            <span className="thanks-icon" aria-hidden="true"><Icon name="clock" size={34} /></span>
            <h1>Még feldolgozás alatt</h1>
            <p className="muted">A Tebex még nem igazolta vissza a fizetést. Ez néha pár percig is eltarthat; amint megérkezik, a fiókodban megjelenik a vásárlás. Ha egy órán belül sem jelenik meg, írj nekünk.</p>
            <div className="thanks-actions"><Link to="/store/fiok" className="btn-primary">Fiókom</Link></div>
          </>
        )}
        {state === 'login' && (
          <>
            <span className="thanks-icon" aria-hidden="true"><Icon name="user" size={34} /></span>
            <h1>Lépj be a fiókodba</h1>
            <p className="muted">A vásárlásod a fiókodhoz kötődik - belépés után ott találod.</p>
            <div className="thanks-actions"><Link to="/store/fiok" className="btn-primary">Belépés</Link></div>
          </>
        )}
      </section>
    </main>
  );
}
