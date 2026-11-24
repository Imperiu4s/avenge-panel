import type { AdminSessionPage } from './types';
import { send } from './store';

export interface AdminOrganizationRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  isPlatform: boolean;
  isSubscription: boolean;
  ownerEmail: string | null;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  hasAccess: boolean;
  members: number;
  scans: number;
  lastScanAt: string | null;
  pluginOwned: boolean;
  activePluginKeys: number;
  deletesAt: string | null;
}

export interface AdminOrgOwner {
  id: string;
  email: string;
  displayName: string | null;
  minecraftUsername: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  isBanned: boolean;
}

export interface AdminOrgSubscription {
  status: string;
  price: number;
  currency: string;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  endedAt: string | null;
}

export interface AdminOrgMember {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isPlatformAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  scans: number;
}

export interface AdminOrgKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface AdminOrgAudit {
  action: string;
  userEmail: string | null;
  createdAt: string;
  ipAddress: string | null;
}

export interface AdminOrgStats {
  total: number;
  completed: number;
  legit: number;
  unlegit: number;
  inconclusive: number;
  interrupted: number;
  expired: number;
  last30Days: number;
}

export interface AdminOrganizationDetail {
  summary: AdminOrganizationRow;
  owner: AdminOrgOwner | null;
  subscription: AdminOrgSubscription | null;
  stats: AdminOrgStats;
  members: AdminOrgMember[];
  pluginKeys: AdminOrgKey[];
  audit: AdminOrgAudit[];
}

const O = '/api/admin/organizations';

export const organizationsApi = {
  list: () => send<AdminOrganizationRow[]>(O, { auth: 'staff' }),
  detail: (id: string) => send<AdminOrganizationDetail>(`${O}/${encodeURIComponent(id)}`, { auth: 'staff' }),
  sessions: (id: string, params: { page: number; q?: string; verdict?: string }) => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: '25' });
    if (params.q) query.set('q', params.q);
    if (params.verdict) query.set('verdict', params.verdict);
    return send<AdminSessionPage>(`${O}/${encodeURIComponent(id)}/sessions?${query.toString()}`, { auth: 'staff' });
  },
  rename: (id: string, name: string) => send<void>(`${O}/${encodeURIComponent(id)}`, { method: 'PUT', body: { name }, auth: 'staff' }),
  remove: (id: string, confirm: string) => send<void>(`${O}/${encodeURIComponent(id)}?confirm=${encodeURIComponent(confirm)}`, { method: 'DELETE', auth: 'staff' }),
  updateMember: (id: string, userId: string, change: { role?: string; isActive?: boolean }) =>
    send<void>(`${O}/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`, { method: 'POST', body: change, auth: 'staff' }),
  revokeKey: (id: string, keyId: string) => send<void>(`${O}/${encodeURIComponent(id)}/keys/${encodeURIComponent(keyId)}/revoke`, { method: 'POST', auth: 'staff' })
};
