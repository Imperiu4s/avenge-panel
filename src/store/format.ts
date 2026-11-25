import { t, locale } from '../i18n';
export function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return t('Ingyenes');
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'HUF' ? 0 : 2,
      maximumFractionDigits: currency === 'HUF' ? 0 : 2
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function timeLeft(until: string | null, now = Date.now()): string | null {
  if (!until) return null;
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return t('{0} nap {1} óra', days, hours);
  if (hours > 0) return t('{0} óra {1} perc', hours, minutes % 60);
  return t('{0} perc', Math.max(1, minutes));
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  Pending: t('Fizetésre vár'),
  Paid: t('Fizetve'),
  Refunded: t('Visszatérítve'),
  Chargeback: t('Visszaterhelés'),
  Cancelled: t('Megszakítva'),
  Declined: t('Elutasítva')
};

export const INVOICE_KIND_LABELS: Record<string, string> = {
  purchase: t('Plugin vásárlás'),
  subscription: t('Előfizetés'),
  refund: t('Visszatérítés')
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  Pending: t('Fizetésre vár'),
  Active: t('Aktív'),
  CancelPending: t('Lemondva (az időszak végéig él)'),
  Ended: t('Lejárt'),
  Failed: t('Sikertelen fizetés')
};
