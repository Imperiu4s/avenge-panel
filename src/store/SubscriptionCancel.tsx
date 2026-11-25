import { t } from '../i18n';
import { useState } from 'react';
import { ApiError } from '../api/client';
import { storeApi, type CustomerSubscription } from '../api/store';
import { Icon } from '../components/Icon';
import { formatDate } from './format';

const TEBEX_MANAGE_URL = 'https://checkout.tebex.io/payment-history';

export function SubscriptionCancel({ subscription, onChanged }: { subscription: CustomerSubscription; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [manageUrl, setManageUrl] = useState<string | null>(null);

  async function cancel() {
    if (!window.confirm(t('Lemondod az előfizetést? {0}-ig még használhatod, utána nem terhelünk többet. A lejárat után (3 nap türelmi idővel) a szervezeted minden vizsgálatával együtt törlődik.', formatDate(subscription.currentPeriodEnd)))) return;
    setBusy(true);
    setError(null);
    try {
      const result = await storeApi.subscriptionCancel();
      setMessage(result.message);
      setManageUrl(result.manageUrl);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült lemondani. Próbáld újra.'));
    } finally {
      setBusy(false);
    }
  }

  const tebexLink = manageUrl ?? (subscription.tebexCancelPending ? TEBEX_MANAGE_URL : null);

  return (
    <div className="sub-cancel">
      {subscription.status === 'Active' && (
        <button type="button" className={`btn-ghost btn-block btn-danger ${busy ? 'is-loading' : ''}`} onClick={cancel} disabled={busy}>
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          <Icon name="x" size={15} />{' '}{t('Előfizetés lemondása')}</button>
      )}
      {subscription.status === 'CancelPending' && !message && (
        <p className="muted small"><Icon name="check" size={14} />{' '}{t('Lemondva.')}{' '}{formatDate(subscription.currentPeriodEnd)}{t('-ig még használhatod, utána nem terhelünk többet.')}</p>
      )}
      {message && <p className={tebexLink ? 'notice-text' : 'success-text'}><Icon name={tebexLink ? 'info' : 'check'} size={15} /> {message}</p>}
      {tebexLink && (
        <div className="sub-cancel-tebex">
          {!message && <p className="muted small">{t('A Tebexnél az automatikus megújítást még le kell állítani. Ha mégis terhelés érkezne, automatikusan visszatérítjük.')}</p>}
          <a href={tebexLink} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-block">
            <Icon name="external" size={14} />{' '}{t('Megújítás leállítása a Tebexnél')}</a>
        </div>
      )}
      {error && <p className="error-text error-in">{error}</p>}
    </div>
  );
}
