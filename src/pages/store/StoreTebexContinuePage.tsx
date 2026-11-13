import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { tebexContinue } from '../../api/store';
import { Icon } from '../../components/Icon';
import { useCustomer } from '../../store/CustomerAuth';

export function StoreTebexContinuePage() {
  const [params] = useSearchParams();
  const order = params.get('order');
  const subscription = params.get('subscription');
  const { isLoggedIn } = useCustomer();
  const [error, setError] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const back = subscription ? '/elofizetes' : '/store';

  useEffect(() => {
    if (!isLoggedIn || (!order && !subscription)) return;
    let alive = true;
    tebexContinue({ order, subscription })
      .then((result) => {
        if (!alive) return;
        if ('checkoutUrl' in result) {
          window.location.href = result.checkoutUrl;
        } else {
          setLoginUrl(result.loginUrl);
          setError(result.message || 'A Tebex még nem látja a belépésedet.');
        }
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : 'Nem sikerült folytatni a fizetést.');
      });
    return () => { alive = false; };
  }, [isLoggedIn, order, subscription]);

  const here = `/store/tebex?${subscription ? `subscription=${encodeURIComponent(subscription)}` : `order=${encodeURIComponent(order ?? '')}`}`;

  return (
    <main className="page page-narrow store-page">
      <section className={`card thanks-card ${error ? 'thanks-failed' : 'thanks-waiting'} stagger-in`}>
        {!isLoggedIn ? (
          <>
            <span className="thanks-icon" aria-hidden="true"><Icon name="user" size={34} /></span>
            <h1>Lépj be a fiókodba</h1>
            <p className="muted">A fizetés folytatásához lépj be ugyanazzal a fiókkal, amellyel elindítottad.</p>
            <div className="thanks-actions"><Link to={`/store/fiok?vissza=${encodeURIComponent(here)}`} className="btn-primary">Belépés</Link></div>
          </>
        ) : error ? (
          <>
            <span className="thanks-icon" aria-hidden="true"><Icon name="alert" size={34} /></span>
            <h1>A fizetés nem folytatható</h1>
            <p className="muted">{error}</p>
            <div className="thanks-actions">
              {loginUrl && <a href={loginUrl} className="btn-primary">Belépés a Tebexben <Icon name="arrow-right" size={16} /></a>}
              <Link to={back} className={loginUrl ? 'btn-ghost' : 'btn-primary'}>Újrakezdem</Link>
            </div>
          </>
        ) : (
          <>
            <span className="thanks-icon thanks-spin" aria-hidden="true"><Icon name="refresh" size={34} /></span>
            <h1>Tovább a fizetéshez...</h1>
            <p className="muted">A kosaradat előkészítjük a Tebexben, és máris átirányítunk a biztonságos fizetési oldalra.</p>
          </>
        )}
      </section>
    </main>
  );
}
