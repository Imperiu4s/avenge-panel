import { t } from '../../i18n';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { storeApi } from '../../api/store';
import { useAuth } from '../../auth/AuthContext';
import { Icon, type IconName } from '../../components/Icon';
import { useCustomer } from '../../store/CustomerAuth';
import { MinecraftNamePrompt, needsMinecraftName } from '../../store/MinecraftNamePrompt';
import { useStoreInfo } from '../../store/StoreShell';
import { SubscriptionCancel } from '../../store/SubscriptionCancel';
import { formatDate, formatPrice, SUBSCRIPTION_STATUS_LABELS } from '../../store/format';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'radar', title: t('Saját PC Check panel'), text: t('Külön szervezet a szerverednek: a vizsgálatokat élőben követed, az eredmények csak nálatok látszanak.') },
  { icon: 'key', title: t('Korlátlan vizsgálati kód'), text: t('Annyi játékost vizsgálsz, amennyit akarsz - nincs darabszám-korlát.') },
  { icon: 'users', title: t('Staff fiókok'), text: t('Tulajdonosként Admin és Staff rangú csapattagokat hozhatsz létre, és jogonként beállíthatod, mit tehetnek.') },
  { icon: 'share', title: t('Megosztható eredmény'), text: t('3 napig érvényes link az eredményhez, hogy a játékos vagy a vezetőség is lássa.') },
  { icon: 'bolt', title: t('Folyamatos frissítések'), text: t('Az új csalások felismerése automatikusan érkezik, neked nincs teendőd.') },
  { icon: 'shield', title: t('Admin Panel'), text: t('Előzmények, rangok és jogok, napló és megőrzési idő - mind a te kezedben.') }
];

export function SubscriptionPage() {
  const { info } = useStoreInfo();
  const { isLoggedIn, me, refresh } = useCustomer();
  const staff = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askName, setAskName] = useState(false);

  const currency = info?.currency ?? 'EUR';
  const sub = me?.subscription;
  const live = sub && (sub.status === 'Active' || sub.status === 'CancelPending');
  const available = (info?.subscriptionEnabled ?? false) && (info?.paymentsConfigured ?? false);

  async function subscribe(minecraftName?: string) {
    if (!isLoggedIn) {
      navigate('/store/fiok?vissza=/elofizetes');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } = await storeApi.subscriptionCheckout(minecraftName);
      window.location.assign(checkoutUrl);
    } catch (err) {
      if (needsMinecraftName(err)) setAskName(true);
      setError(err instanceof ApiError ? err.message : t('Nem sikerült elindítani a fizetést.'));
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
      setError(err instanceof ApiError ? err.message : t('Nem sikerült belépni a panelbe.'));
      setBusy(false);
    }
  }

  return (
    <main className="page store-page">
      <section className="sub-hero stagger-in">
        <div className="sub-hero-copy">
          <span className="eyebrow">{t('Avenge PC Check')}</span>
          <h1>{t('A saját PC Check panel')}<br /><em>{t('a szerverednek')}</em>.</h1>
          <p className="muted">{t('Ugyanaz az eszköz, amit mi is használunk: a játékos egy kóddal elindítja a vizsgálatot, te élőben látod, mit talál a gépén. Havi díjért, hűségidő nélkül.')}</p>
        </div>
        <aside className={`card price-card ${live ? 'price-card-live' : ''}`}>
          <span className="eyebrow">{info?.subscriptionName ? t(info.subscriptionName) : t('Havi előfizetés')}</span>
          <p className="price-big">{info ? formatPrice(info.subscriptionPrice, currency) : '–'}<small>{t('/hó')}</small></p>
          <ul className="check-list">
            <li><Icon name="check" size={15} />{' '}{t('Bármikor lemondható')}</li>
            <li><Icon name="check" size={15} />{' '}{t('A kifizetett hónap végéig él')}</li>
            <li><Icon name="check" size={15} />{' '}{t('Fizetés a Tebexen keresztül')}</li>
          </ul>

          {live && sub ? (
            <>
              <p className="success-text"><Icon name="check" size={15} /> {SUBSCRIPTION_STATUS_LABELS[sub.status]} · {sub.status === 'Active' ? t('megújul') : t('lejár')}: {formatDate(sub.currentPeriodEnd)}</p>
              {sub.hasPanelAccess && (
                <button type="button" className={`btn-primary btn-block btn-large ${busy ? 'is-loading' : ''}`} onClick={openPanel} disabled={busy}>
                  {busy && <span className="btn-spinner" aria-hidden="true" />}
                  <Icon name="radar" size={18} />{' '}{t('PC Check panel megnyitása')}</button>
              )}
              <SubscriptionCancel subscription={sub} onChanged={refresh} />
              <Link to="/store/fiok" className="btn-ghost btn-block">{t('Fiókom')}</Link>
            </>
          ) : (
            <>
              <button type="button" className={`btn-primary btn-block btn-large ${busy ? 'is-loading' : ''}`} onClick={() => subscribe()} disabled={busy || !available}>
                {busy && <span className="btn-spinner" aria-hidden="true" />}
                {isLoggedIn ? t('Előfizetek') : t('Belépés az előfizetéshez')} <Icon name="arrow-right" size={17} />
              </button>
              {!available && <p className="muted small">{t('Az előfizetés hamarosan indul.')}</p>}
              <p className="muted small">{t('Az előfizetéssel elfogadod az')}{' '}<Link to="/jogi/aszf" className="text-link">{t('ÁSZF')}</Link>{t('-et. A díjat havonta automatikusan terheli a Tebex, amíg le nem mondod.')}</p>
            </>
          )}
          {askName && !live && <MinecraftNamePrompt initial={me?.minecraftUsername ?? ''} busy={busy} onSubmit={(name) => subscribe(name)} />}
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
        <h2 className="card-title"><Icon name="info" size={18} />{' '}{t('Gyakori kérdések')}</h2>
        <details>
          <summary>{t('Hogyan jutok be a panelbe?')}</summary>
          <p className="muted">{t('Az első sikeres fizetés után automatikusan kapsz egy saját szervezetet és egy Tulajdonos rangú fiókot ugyanazzal az e-mail címmel és jelszóval, mint a vásárlói fiókod. A fiókodból egy kattintással is beléphetsz.')}</p>
        </details>
        <details>
          <summary>{t('Mi történik, ha lemondom?')}</summary>
          <p className="muted">{t('Egy gombbal lemondhatod itt vagy a Fiókom oldalon. A már kifizetett időszak végéig minden működik, utána nem generálhatsz új vizsgálati kódot, és nem terhelünk többet. A korábbi eredményeid a beállított megőrzési ideig megmaradnak.')}</p>
        </details>
        <details>
          <summary>{t('Mit lát a vizsgált játékos?')}</summary>
          <p className="muted">{t('A vizsgálatot a játékos maga indítja el a kapott kóddal; a program jelzi neki, hogy a csatlakozással a vizsgálat elindul, és az eredményt a staff látja. Részletek az')}{' '}<Link to="/jogi/adatkezeles" className="text-link">{t('adatkezelési tájékoztatóban')}</Link>.</p>
        </details>
        <details>
          <summary>{t('Kaphatok számlát?')}</summary>
          <p className="muted">{t('Igen: a fizetést a Tebex mint viszonteladó (merchant of record) bonyolítja, ő állítja ki és küldi el e-mailben a számlát minden terhelésről.')}</p>
        </details>
      </section>
    </main>
  );
}
