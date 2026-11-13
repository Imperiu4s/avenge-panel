import { API_BASE } from './config';
import { ApiError, clearStoredToken, getStoredToken, SESSION_EXPIRED_EVENT } from './client';

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
  models?: number;
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
  kind?: ProductKind;
}

export type ProductKind = 'plugin' | 'model';

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
  minecraftUsername: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
}

export interface CheckoutResult {
  orderId: string;
  checkoutUrl: string;
}

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
  tebexPackageId: string | null;
  kind?: ProductKind;
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
  tebexPackageId: string;
  kind: ProductKind;
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
  tebexCouponCode: string | null;
}

export interface DiscountUpsert {
  name: string;
  percent: number;
  productId: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  tebexCouponCode?: string | null;
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

export type InvoiceKind = 'purchase' | 'subscription' | 'refund';

export interface StoreInvoice {
  id: string;
  number: string;
  kind: InvoiceKind;
  title: string;
  total: number;
  currency: string;
  issuedAt: string;
  paidAt: string;
  buyerEmail: string;
  buyerName: string | null;
  customerId: string | null;
  orderId: string | null;
  subscriptionId: string | null;
  tebexTransactionId: string | null;
  refundOfInvoiceId: string | null;
  refundOfNumber: string | null;
  refundedByInvoiceId: string | null;
  refundedByNumber: string | null;
  reason: string | null;
  refundable: boolean;
  refundableUntil: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface RefundsOverview {
  recent: StoreInvoice[];
  history: StoreInvoice[];
  paymentsConfigured: boolean;
  windowDays: number;
}

export interface RefundResult {
  refund: StoreInvoice;
  warnings: string[];
}

export interface AdminCustomerDetail {
  customer: AdminCustomer;
  owned: { productId: string; productName: string; source: string; grantedAt: string; revokedAt: string | null }[];
  orders: AdminOrder[];
  subscriptions: AdminSubscription[];
  acceptedTermsVersion: string | null;
  acceptedTermsAt: string | null;
  invoices: StoreInvoice[];
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
  sellerName: string;
  sellerAddress: string;
  sellerTaxNumber: string;
  sellerEmail: string;
  receiptNote: string;
  tebexPublicToken: string;
  subscriptionPackageId: string;
  notice: string | null;
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
  tebexPrivateKey: string | null;
  tebexWebhookSecret: string | null;
  sellerName: string;
  sellerAddress: string;
  sellerTaxNumber: string;
  sellerEmail: string;
  receiptNote: string;
  tebexPublicToken: string;
  subscriptionPackageId: string;
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
  lastTebexError: string | null;
  lastTebexErrorAt: string | null;
}

export interface TebexTestResult {
  ok: boolean;
  status: number;
  message: string;
  tebexResponse: string;
}

export interface TebexConnectionTest {
  ok: boolean;
  auth: TebexTestResult;
  checkout: TebexTestResult | null;
}

export interface DiscordJob {
  running: boolean;
  kind: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  log: string[];
}

export interface DiscordSettings {
  hasToken: boolean;
  guildId: string | null;
  botId: string | null;
  botName: string | null;
  botError: string | null;
  guilds: { id: string; name: string }[];
  inviteUrl: string | null;
  postedMessages: number;
  lastRunAt: string | null;
  lastRunKind: string;
  lastRunLog: string;
  job: DiscordJob;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  type: string;
  receivedAt: string;
  result: string;
}

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
  }
}

export function clearCustomerToken() {
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
  }
}

export type AuthMode = 'none' | 'customer' | 'customer-optional' | 'staff';

export async function send<T>(path: string, options: { method?: string; body?: unknown; form?: FormData; auth?: AuthMode } = {}): Promise<T> {
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
      clearCustomerToken();
      window.dispatchEvent(new Event(CUSTOMER_EXPIRED_EVENT));
      return send<T>(path, { ...options, auth: 'none' });
    }
    let message = `Hiba (${response.status})`;
    let code: string | null = null;
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? errorBody?.title ?? message;
      code = typeof errorBody?.code === 'string' ? errorBody.code : null;
    } catch {
    }
    throw new ApiError(response.status, message, code);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function downloadFile(path: string, auth: AuthMode, fileName: string): Promise<void> {
  const token = auth === 'staff' ? getStoredToken() : getCustomerToken();
  const response = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    if (response.status === 401) throw new ApiError(401, 'A bejelentkezésed lejárt, lépj be újra.');
    throw new ApiError(response.status, response.status === 404 ? 'A bizonylat nem található.' : `Hiba (${response.status})`);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function invoiceFileName(invoice: Pick<StoreInvoice, 'number'>): string {
  return `Avenge-${invoice.number}.pdf`;
}

export const storeApi = {
  info: () => send<StoreInfo>('/api/store/info'),
  products: () => send<StoreProductCard[]>('/api/store/products'),
  product: (slug: string) => send<StoreProductDetail>(`/api/store/products/${encodeURIComponent(slug)}`, { auth: 'customer-optional' }),

  register: (email: string, password: string, minecraftUsername: string, acceptTerms: boolean) =>
    send<CustomerToken>('/api/store/auth/register', { method: 'POST', body: { email, password, displayName: minecraftUsername, minecraftUsername, acceptTerms } }),
  login: (email: string, password: string) =>
    send<CustomerToken>('/api/store/auth/login', { method: 'POST', body: { email, password } }),

  me: () => send<CustomerMe>('/api/store/me', { auth: 'customer' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    send<CustomerToken>('/api/store/me/password', { method: 'POST', body: { currentPassword, newPassword }, auth: 'customer' }),
  deleteAccount: (password: string) =>
    send<void>('/api/store/me/delete', { method: 'POST', body: { password }, auth: 'customer' }),

  checkout: (productIds: string[], consentImmediateDelivery: boolean, minecraftUsername?: string) =>
    send<CheckoutResult>('/api/store/checkout', { method: 'POST', body: { productIds, consentImmediateDelivery, minecraftUsername: minecraftUsername || null }, auth: 'customer' }),
  order: (id: string) => send<CustomerOrder>(`/api/store/orders/${encodeURIComponent(id)}`, { auth: 'customer' }),

  subscriptionCheckout: (minecraftUsername?: string) =>
    send<CheckoutResult>(`/api/store/subscription/checkout${minecraftUsername ? `?minecraftUsername=${encodeURIComponent(minecraftUsername)}` : ''}`, { method: 'POST', auth: 'customer' }),
  subscriptionCancel: () => send<void>('/api/store/subscription/cancel', { method: 'POST', auth: 'customer' }),
  panelToken: () => send<CustomerToken>('/api/store/subscription/panel-token', { method: 'POST', auth: 'customer' }),

  downloadTicket: (releaseId: string) =>
    send<{ ticket: string }>(`/api/store/downloads/${encodeURIComponent(releaseId)}/ticket`, { method: 'POST', auth: 'customer' }),

  invoices: () => send<StoreInvoice[]>('/api/store/me/invoices', { auth: 'customer' }),
  downloadInvoice: (invoice: StoreInvoice) =>
    downloadFile(`/api/store/me/invoices/${encodeURIComponent(invoice.id)}/pdf`, 'customer', invoiceFileName(invoice))
};

export function storeAssetUrl(id: string): string {
  return `${API_BASE}/api/store/assets/${encodeURIComponent(id)}`;
}

export function storeDownloadUrl(releaseId: string, ticket: string): string {
  return `${API_BASE}/api/store/downloads/${encodeURIComponent(releaseId)}?ticket=${encodeURIComponent(ticket)}`;
}

const A = '/api/admin/store';

export const storeAdminApi = {
  overview: () => send<StoreOverview>(`${A}/overview`, { auth: 'staff' }),

  products: () => send<AdminProduct[]>(`${A}/products`, { auth: 'staff' }),
  createProduct: (body: ProductUpsert) => send<{ id: string; slug: string; notice: string | null }>(`${A}/products`, { method: 'POST', body, auth: 'staff' }),
  updateProduct: (id: string, body: ProductUpsert) =>
    send<{ id: string; slug: string; notice: string | null }>(`${A}/products/${id}`, { method: 'PUT', body, auth: 'staff' }),
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

  invoices: (q = '', kind = '') => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (kind) params.set('kind', kind);
    const query = params.toString();
    return send<StoreInvoice[]>(`${A}/invoices${query ? `?${query}` : ''}`, { auth: 'staff' });
  },
  downloadInvoice: (invoice: StoreInvoice) => downloadFile(`${A}/invoices/${invoice.id}/pdf`, 'staff', invoiceFileName(invoice)),
  refunds: () => send<RefundsOverview>(`${A}/refunds`, { auth: 'staff' }),
  refund: (invoiceId: string, reason: string) => send<RefundResult>(`${A}/refunds`, { method: 'POST', body: { invoiceId, reason }, auth: 'staff' }),

  testTebex: () => send<TebexConnectionTest>(`${A}/tebex/test`, { method: 'POST', auth: 'staff' }),
  settings: () => send<AdminStoreSettings>(`${A}/settings`, { auth: 'staff' }),
  updateSettings: (body: StoreSettingsUpdate) => send<AdminStoreSettings>(`${A}/settings`, { method: 'PUT', body, auth: 'staff' }),
  webhooks: () => send<WebhookLog[]>(`${A}/webhooks`, { auth: 'staff' })
};

const D = '/api/admin/discord';

export const discordAdminApi = {
  get: () => send<DiscordSettings>(D, { auth: 'staff' }),
  update: (body: { botToken?: string | null; guildId?: string | null }) => send<void>(D, { method: 'PUT', body, auth: 'staff' }),
  job: () => send<DiscordJob>(`${D}/job`, { auth: 'staff' }),
  structure: () => send<{ lines: string[] }>(`${D}/structure`, { auth: 'staff' }),
  apply: () => send<DiscordJob>(`${D}/apply`, { method: 'POST', auth: 'staff' }),
  post: () => send<DiscordJob>(`${D}/post`, { method: 'POST', auth: 'staff' })
};

export type TebexContinueResult = { checkoutUrl: string } | { loginUrl: string; message: string };

export async function tebexContinue(target: { order?: string | null; subscription?: string | null }): Promise<TebexContinueResult> {
  const token = getCustomerToken();
  const response = await fetch(`${API_BASE}/api/store/tebex/continue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ order: target.order ?? null, subscription: target.subscription ?? null })
  });
  let body: { checkoutUrl?: string; loginUrl?: string; message?: string } = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (response.ok && body.checkoutUrl) return { checkoutUrl: body.checkoutUrl };
  if (response.status === 409 && body.loginUrl) return { loginUrl: body.loginUrl, message: body.message ?? '' };
  throw new ApiError(response.status, body.message ?? `Hiba (${response.status})`);
}
