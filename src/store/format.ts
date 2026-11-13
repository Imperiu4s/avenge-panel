export function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return 'Ingyenes';
  try {
    return new Intl.NumberFormat('hu-HU', {
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
  return new Date(value).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
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
  if (days > 0) return `${days} nap ${hours} óra`;
  if (hours > 0) return `${hours} óra ${minutes % 60} perc`;
  return `${Math.max(1, minutes)} perc`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  Pending: 'Fizetésre vár',
  Paid: 'Fizetve',
  Refunded: 'Visszatérítve',
  Chargeback: 'Visszaterhelés',
  Cancelled: 'Megszakítva',
  Declined: 'Elutasítva'
};

export const INVOICE_KIND_LABELS: Record<string, string> = {
  purchase: 'Plugin vásárlás',
  subscription: 'Előfizetés',
  refund: 'Visszatérítés'
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  Pending: 'Fizetésre vár',
  Active: 'Aktív',
  CancelPending: 'Lemondva (az időszak végéig él)',
  Ended: 'Lejárt',
  Failed: 'Sikertelen fizetés'
};
