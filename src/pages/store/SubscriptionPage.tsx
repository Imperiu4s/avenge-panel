import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { storeApi } from '../../api/store';
import { useAuth } from '../../auth/AuthContext';
import { Icon, type IconName } from '../../components/Icon';
import { useCustomer } from '../../store/CustomerAuth';
import { useStoreInfo } from '../../store/StoreShell';
import { formatDate, formatPrice, SUBSCRIPTION_STATUS_LABELS } from '../../store/format';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'radar', title: 'Saját SS panel', text: 'Külön szervezet a szerverednek: a vizsgálatokat élőben követed, az eredmények csak nálatok látszanak.' },
  { icon: 'key', title: 'Korlátlan vizsgálati kód', text: 'Annyi játékost vizsgálsz, amennyit akarsz - nincs darabszám-korlát.' },
  { icon: 'users', title: 'Staff fiókok', text: 'Admin és Staff rangú csapattagokat hozhatsz létre, saját jogosultsági beállításokkal.' },
  { icon: 'share', title: 'Megosztható eredmény', text: '3 napig érvényes link az eredményhez, hogy a játékos vagy a vezetőség is lássa.' },
  { icon: 'bolt', title: 'Folyamatos frissítések', text: 'Az új csalások felismerése automatikusan érkezik, neked nincs teendőd.' },
  { icon: 'shield', title: 'Admin Panel', text: 'Előzmények, kitiltott gépek, napló és megőrzési idő - mind a te kezedben.' }
];

export function SubscriptionPage() {
  const { info } = useStoreInfo();
  const { isLoggedIn, me } = useCustomer();
  const staff = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = info?.currency ?? 'EUR';
  const sub = me?.subscription;
  const live = sub && (sub.status === 'Active' || sub.status === 'CancelPending');
  const available = (info?.subscriptionEnabled ?? false) && (info?.paymentsConfigured ?? false);

  async function subscribe() {
    if (!isLoggedIn) {
      navigate('/store/fiok?vissza=/elofizetes');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } = await storeApi.subscriptionCheckout();
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült elindítani a fizetést.');
      setBusy(false);
    }
  }

  async function openPanel() {
    setBusy(true);
    setError(null);
    try {
      const { token } = await storeApi.panelToken();
      staff.replaceToken(token);
      navigate('/panel');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült belépni a panelbe.');
      setBusy(false);
    }
  }

  return (
    <main className="page store-page">
      <section className="sub-hero stagger-in">
        <div className="sub-hero-copy">
          <span className="eyebrow">Avenge SS tool</span>
          <h1>A saját screenshare panel<br /><em>a szerverednek</em>.</h1>
          <p className="muted">Ugyanaz az eszköz, amit mi is használunk: a játékos egy kóddal elindítja a vizsgálatot, te élőben látod, mit talál a gépén. Havi díjért, hűségidő nélkül.</p>
        </div>
        <aside className={`card price-card ${live ? 'price-card-live' : ''}`}>
          <span className="eyebrow">{info?.subscriptionName ?? 'Havi előfizetés'}</span>
          <p className="price-big">{info ? formatPrice(info.subscriptionPrice, currency) : '–'}<small>/hó</small></p>
          <ul className="check-list">
            <li><Icon name="check" size={15} /> Bármikor lemondható</li>
            <li><Icon name="check" size={15} /> A kifizetett hónap végéig él</li>
            <li><Icon name="check" size={15} /> Fizetés a Tebexen keresztül</li>
          </ul>

          {live && sub ? (
            <>
              <p className="success-text"><Icon name="check" size={15} /> {SUBSCRIPTION_STATUS_LABELS[sub.status]} · {sub.status === 'Active' ? 'megújul' : 'lejár'}: {formatDate(sub.currentPeriodEnd)}</p>
              {sub.hasPanelAccess && (
                <button type="button" className={`btn-primary btn-block btn-large ${busy ? 'is-loading' : ''}`} onClick={openPanel} disabled={busy}>
                  {busy && <span className="btn-spinner" aria-hidden="true" />}
                  <Icon name="radar" size={18} /> SS panel megnyitása
                </button>
              )}
              <Link to="/store/fiok" className="btn-ghost btn-block">Előfizetés kezelése</Link>
            </>
          ) : (
            <>
              <button type="button" className={`btn-primary btn-block btn-large ${busy ? 'is-loading' : ''}`} onClick={subscribe} disabled={busy || !available}>
                {busy && <span className="btn-spinner" aria-hidden="true" />}
                {isLoggedIn ? 'Előfizetek' : 'Belépés az előfizetéshez'} <Icon name="arrow-right" size={17} />
              </button>
              {!available && <p className="muted small">Az előfizetés hamarosan indul.</p>}
              <p className="muted small">Az előfizetéssel elfogadod az <Link to="/jogi/aszf" className="text-link">ÁSZF</Link>-et. A díjat havonta automatikusan terheli a Tebex, amíg le nem mondod.</p>
            </>
          )}
          {error && <p className="error-text error-in">{error}</p>}
        </aside>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f, i) => (
          <article className="card feature-card spot stagger-in" key={f.title} style={{ animationDelay: `${80 + i * 50}ms` }}>
            <Icon name={f.icon} size={22} />
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </article>
        ))}
      </section>

      <section className="card faq">
        <h2 className="card-title"><Icon name="info" size={18} /> Gyakori kérdések</h2>
        <details>
          <summary>Hogyan jutok be a panelbe?</summary>
          <p className="muted">Az első sikeres fizetés után automatikusan kapsz egy saját szervezetet és egy Admin fiókot ugyanazzal az e-mail címmel és jelszóval, mint a vásárlói fiókod. A fiókodból egy kattintással is beléphetsz.</p>
        </details>
        <details>
          <summary>Mi történik, ha lemondom?</summary>
          <p className="muted">A már kifizetett időszak végéig minden működik, utána nem generálhatsz új vizsgálati kódot. A korábbi eredményeid a beállított megőrzési ideig megmaradnak.</p>
        </details>
        <details>
          <summary>Mit lát a vizsgált játékos?</summary>
          <p className="muted">A vizsgálatot a játékos maga indítja el a kapott kóddal; a program jelzi neki, hogy a csatlakozással a vizsgálat elindul, és az eredményt a staff látja. Részletek az <Link to="/jogi/adatkezeles" className="text-link">adatkezelési tájékoztatóban</Link>.</p>
        </details>
        <details>
          <summary>Kaphatok számlát?</summary>
          <p className="muted">Igen: a fizetést a Tebex mint viszonteladó (merchant of record) bonyolítja, ő állítja ki és küldi el e-mailben a számlát minden terhelésről.</p>
        </details>
      </section>
    </main>
  );
}
