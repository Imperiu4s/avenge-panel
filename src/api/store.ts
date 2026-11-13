// Az áruház (Avenge Foundry) API-ja: nyilvános katalógus, vásárlói fiók (külön token),
// és a platform admin áruház-kezelése (a staff tokennel). A DTO-k a backend
// Endpoints/StoreEndpoints.cs és StoreAdminEndpoints.cs rekordjait követik.
import { API_BASE } from './config';
import { ApiError, clearStoredToken, getStoredToken, SESSION_EXPIRED_EVENT } from './client';

// ── Típusok ─────────────────────────────────────────────────────────────────

export interface StoreInfo {
  brandName: string;
  tagline: string;
  about: string;
  currency: string;
  storeEnabled: boolean;
  subscriptionEnabled: boolean;
  subscriptionName: string;
  subscriptionPrice: number;
  paymentsConfigured: boolean;
  plugins: number;
  sales: number;
  downloads: number;
}

export interface StoreProductCard {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  listPrice: number;
  price: number;
  discountPercent: number;
  discountName: string | null;
  discountEndsAt: string | null;
  supportedVersions: string;
  platforms: string[];
  iconAssetId: string | null;
  isFeatured: boolean;
  salesCount: number;
  downloadCount: number;
  latestVersion: string | null;
  updatedAt: string;
}

export interface StoreRelease {
  id: string;
  version: string;
  changelog: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface StoreProductDetail {
  card: StoreProductCard;
  description: string;
  gallery: string[];
  releases: StoreRelease[];
  owned: boolean;
}

export interface CustomerToken {
  token: string;
  expiresAt: string;
}

export interface CustomerOrder {
  id: string;
  status: 'Pending' | 'Paid' | 'Refunded' | 'Chargeback' | 'Cancelled' | 'Declined';
  total: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  items: string[];
}

export interface CustomerOwned {
  productId: string;
  slug: string;
  name: string;
  iconAssetId: string | null;
  grantedAt: string;
  releases: StoreRelease[];
}

export type SubscriptionStatus = 'Pending' | 'Active' | 'CancelPending' | 'Ended' | 'Failed';

export interface CustomerSubscription {
  id: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  hasPanelAccess: boolean;
  note: string | null;
}

export interface CustomerMe {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  owned: CustomerOwned[];
  orders: CustomerOrder[];
  subscription: CustomerSubscription | null;
}

export interface CheckoutResult {
  orderId: string;
  checkoutUrl: string;
}

// Admin

export interface AdminAsset {
  id: string;
  kind: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: number;
  effectivePrice: number;
  discountPercent: number;
  supportedVersions: string;
  platforms: string;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  iconAssetId: string | null;
  salesCount: number;
  downloadCount: number;
  owners: number;
  createdAt: string;
  updatedAt: string;
  releases: StoreRelease[];
  gallery: AdminAsset[];
}

export interface ProductUpsert {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  price: number;
  supportedVersions: string;
  platforms: string;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface AdminDiscount {
  id: string;
  name: string;
  percent: number;
  productId: string | null;
  productName: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isRunning: boolean;
}

export interface DiscountUpsert {
  name: string;
  percent: number;
  productId: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface AdminCustomer {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  products: number;
  paidOrders: number;
  spent: number;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionEnd: string | null;
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  listPrice: number;
  discountPercent: number;
  discountName: string | null;
}

export interface AdminOrder {
  id: string;
  customerId: string | null;
  customerEmail: string;
  status: CustomerOrder['status'];
  total: number;
  currency: string;
  tebexTransactionId: string | null;
  createdAt: string;
  paidAt: string | null;
  items: AdminOrderItem[];
}

export interface AdminSubscription {
  id: string;
  customerId: string;
  customerEmail: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  tebexReference: string | null;
  createdAt: string;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  endedAt: string | null;
  note: string | null;
}

export interface AdminCustomerDetail {
  customer: AdminCustomer;
  owned: { productId: string; productName: string; source: string; grantedAt: string; revokedAt: string | null }[];
  orders: AdminOrder[];
  subscriptions: AdminSubscription[];
  acceptedTermsVersion: string | null;
  acceptedTermsAt: string | null;
}

export interface AdminStoreSettings {
  brandName: string;
  tagline: string;
  about: string;
  currency: string;
  storeEnabled: boolean;
  subscriptionEnabled: boolean;
  subscriptionName: string;
  subscriptionPrice: number;
  tebexProjectId: string | null;
  hasPrivateKey: boolean;
  hasWebhookSecret: boolean;
  webhookUrl: string;
  updatedAt: string;
}

export interface StoreSettingsUpdate {
  brandName: string;
  tagline: string;
  about: string;
  currency: string;
  storeEnabled: boolean;
  subscriptionEnabled: boolean;
  subscriptionName: string;
  subscriptionPrice: number;
  tebexProjectId: string | null;
  /// null = marad, "" = törlés, más = csere
  tebexPrivateKey: string | null;
  tebexWebhookSecret: string | null;
}

export interface StoreOverview {
  products: number;
  published: number;
  customers: number;
  banned: number;
  paidOrders: number;
  pendingOrders: number;
  activeSubscriptions: number;
  revenue: { currency: string; total: number; last30Days: number }[];
  paymentsConfigured: boolean;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  type: string;
  receivedAt: string;
  result: string;
}

// ── Vásárlói token ──────────────────────────────────────────────────────────

const CUSTOMER_TOKEN_KEY = 'avenge_customer_token';
export const CUSTOMER_EXPIRED_EVENT = 'avenge:customer-expired';

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeCustomerToken(token: string) {
  try {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  } catch {
    /* privát mód: csak a munkamenet idejére marad bent */
  }
}

export function clearCustomerToken() {
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    /* nincs teendő */
  }
}

type AuthMode = 'none' | 'customer' | 'customer-optional' | 'staff';

async function send<T>(path: string, options: { method?: string; body?: unknown; form?: FormData; auth?: AuthMode } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const mode = options.auth ?? 'none';
  const token = mode === 'staff' ? getStoredToken() : mode === 'customer' || mode === 'customer-optional' ? getCustomerToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined)
  });

  if (!response.ok) {
    if (response.status === 401 && token && mode === 'customer') {
      clearCustomerToken();
      window.dispatchEvent(new Event(CUSTOMER_EXPIRED_EVENT));
      throw new ApiError(401, 'A bejelentkezésed lejárt, lépj be újra.');
    }
    if (response.status === 401 && token && mode === 'staff') {
      clearStoredToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError(401, 'A munkameneted lejárt, jelentkezz be újra.');
    }
    if (response.status === 401 && token && mode === 'customer-optional') {
      // Lejárt vásárlói token egy nyilvános oldalon: kiléptetjük, és név nélkül próbáljuk újra.
      clearCustomerToken();
      window.dispatchEvent(new Event(CUSTOMER_EXPIRED_EVENT));
      return send<T>(path, { ...options, auth: 'none' });
    }
    let message = `Hiba (${response.status})`;
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? errorBody?.title ?? message;
    } catch {
      // nem JSON
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ── Nyilvános + vásárló ─────────────────────────────────────────────────────

export const storeApi = {
  info: () => send<StoreInfo>('/api/store/info'),
  products: () => send<StoreProductCard[]>('/api/store/products'),
  product: (slug: string) => send<StoreProductDetail>(`/api/store/products/${encodeURIComponent(slug)}`, { auth: 'customer-optional' }),

  register: (email: string, password: string, displayName: string, acceptTerms: boolean) =>
    send<CustomerToken>('/api/store/auth/register', { method: 'POST', body: { email, password, displayName, acceptTerms } }),
  login: (email: string, password: string) =>
    send<CustomerToken>('/api/store/auth/login', { method: 'POST', body: { email, password } }),

  me: () => send<CustomerMe>('/api/store/me', { auth: 'customer' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    send<CustomerToken>('/api/store/me/password', { method: 'POST', body: { currentPassword, newPassword }, auth: 'customer' }),
  deleteAccount: (password: string) =>
    send<void>('/api/store/me/delete', { method: 'POST', body: { password }, auth: 'customer' }),

  checkout: (productIds: string[], consentImmediateDelivery: boolean) =>
    send<CheckoutResult>('/api/store/checkout', { method: 'POST', body: { productIds, consentImmediateDelivery }, auth: 'customer' }),
  order: (id: string) => send<CustomerOrder>(`/api/store/orders/${encodeURIComponent(id)}`, { auth: 'customer' }),

  subscriptionCheckout: () => send<CheckoutResult>('/api/store/subscription/checkout', { method: 'POST', auth: 'customer' }),
  subscriptionCancel: () => send<void>('/api/store/subscription/cancel', { method: 'POST', auth: 'customer' }),
  panelToken: () => send<CustomerToken>('/api/store/subscription/panel-token', { method: 'POST', auth: 'customer' }),

  downloadTicket: (releaseId: string) =>
    send<{ ticket: string }>(`/api/store/downloads/${encodeURIComponent(releaseId)}/ticket`, { method: 'POST', auth: 'customer' })
};

export function storeAssetUrl(id: string): string {
  return `${API_BASE}/api/store/assets/${encodeURIComponent(id)}`;
}

export function storeDownloadUrl(releaseId: string, ticket: string): string {
  return `${API_BASE}/api/store/downloads/${encodeURIComponent(releaseId)}?ticket=${encodeURIComponent(ticket)}`;
}

// ── Platform admin ──────────────────────────────────────────────────────────

const A = '/api/admin/store';

export const storeAdminApi = {
  overview: () => send<StoreOverview>(`${A}/overview`, { auth: 'staff' }),

  products: () => send<AdminProduct[]>(`${A}/products`, { auth: 'staff' }),
  createProduct: (body: ProductUpsert) => send<{ id: string; slug: string }>(`${A}/products`, { method: 'POST', body, auth: 'staff' }),
  updateProduct: (id: string, body: ProductUpsert) =>
    send<{ id: string; slug: string }>(`${A}/products/${id}`, { method: 'PUT', body, auth: 'staff' }),
  deleteProduct: (id: string) => send<void>(`${A}/products/${id}`, { method: 'DELETE', auth: 'staff' }),
  uploadRelease: (id: string, file: File, version: string, changelog: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('version', version);
    form.append('changelog', changelog);
    return send<StoreRelease>(`${A}/products/${id}/releases`, { method: 'POST', form, auth: 'staff' });
  },
  deleteRelease: (id: string) => send<void>(`${A}/releases/${id}`, { method: 'DELETE', auth: 'staff' }),
  uploadAsset: (id: string, file: File, kind: 'icon' | 'gallery') => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return send<AdminAsset>(`${A}/products/${id}/assets`, { method: 'POST', form, auth: 'staff' });
  },
  deleteAsset: (id: string) => send<void>(`${A}/assets/${id}`, { method: 'DELETE', auth: 'staff' }),

  discounts: () => send<AdminDiscount[]>(`${A}/discounts`, { auth: 'staff' }),
  createDiscount: (body: DiscountUpsert) => send<{ id: string }>(`${A}/discounts`, { method: 'POST', body, auth: 'staff' }),
  updateDiscount: (id: string, body: DiscountUpsert) => send<void>(`${A}/discounts/${id}`, { method: 'PUT', body, auth: 'staff' }),
  deleteDiscount: (id: string) => send<void>(`${A}/discounts/${id}`, { method: 'DELETE', auth: 'staff' }),

  customers: (q = '') => send<AdminCustomer[]>(`${A}/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`, { auth: 'staff' }),
  customer: (id: string) => send<AdminCustomerDetail>(`${A}/customers/${id}`, { auth: 'staff' }),
  ban: (id: string, reason: string) => send<void>(`${A}/customers/${id}/ban`, { method: 'POST', body: { reason }, auth: 'staff' }),
  unban: (id: string) => send<void>(`${A}/customers/${id}/unban`, { method: 'POST', auth: 'staff' }),
  deleteCustomer: (id: string) => send<void>(`${A}/customers/${id}`, { method: 'DELETE', auth: 'staff' }),
  grant: (id: string, productId: string) => send<void>(`${A}/customers/${id}/grant`, { method: 'POST', body: { productId }, auth: 'staff' }),
  revoke: (id: string, productId: string) => send<void>(`${A}/customers/${id}/revoke`, { method: 'POST', body: { productId }, auth: 'staff' }),
  grantSubscription: (id: string, days: number) =>
    send<void>(`${A}/customers/${id}/subscription`, { method: 'POST', body: { days }, auth: 'staff' }),

  orders: (status = '') => send<AdminOrder[]>(`${A}/orders${status ? `?status=${status}` : ''}`, { auth: 'staff' }),
  subscriptions: () => send<AdminSubscription[]>(`${A}/subscriptions`, { auth: 'staff' }),
  cancelSubscription: (id: string, immediate: boolean) =>
    send<void>(`${A}/subscriptions/${id}/cancel`, { method: 'POST', body: { immediate }, auth: 'staff' }),

  settings: () => send<AdminStoreSettings>(`${A}/settings`, { auth: 'staff' }),
  updateSettings: (body: StoreSettingsUpdate) => send<AdminStoreSettings>(`${A}/settings`, { method: 'PUT', body, auth: 'staff' }),
  webhooks: () => send<WebhookLog[]>(`${A}/webhooks`, { auth: 'staff' })
};
