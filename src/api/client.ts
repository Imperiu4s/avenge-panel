import type {
  AdminUserView,
  BannedHwidView,
  ClientReleaseView,
  CreateBannedHwidRequest,
  CreateSessionResponse,
  CreateSignatureRequest,
  CreateUserRequest,
  CurrentUserView,
  DownloadStatusView,
  DownloadTicketView,
  LoginResponse,
  ScanResultView,
  SessionListItem,
  SignatureDto,
  UpdateSignatureRequest,
  UpdateUserRequest
} from './types';
import { API_BASE } from './config';

const TOKEN_STORAGE_KEY = 'avenge_staff_token';

/// A szerver 401-et adott egy tokennel küldött kérésre (lejárt a 8 órás
/// munkamenet, vagy közben jelszót váltottak) - az AuthContext erre kilépteti
/// a felhasználót, különben az oldal bent ragadna, és minden gomb 401-et kapna.
export const SESSION_EXPIRED_EVENT = 'avenge:session-expired';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = options.auth !== false ? getStoredToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearStoredToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError(401, 'A munkameneted lejárt, jelentkezz be újra.');
    }
    let message = `Hiba (${response.status})`;
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? errorBody?.title ?? message;
    } catch {
      // a válasz nem JSON - a generikus üzenetnél maradunk
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  me: () => request<CurrentUserView>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<LoginResponse>('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    }),

  createSession: () => request<CreateSessionResponse>('/api/sessions', { method: 'POST', body: {} }),

  listSessions: (page = 1, pageSize = 20) =>
    request<SessionListItem[]>(`/api/sessions?page=${page}&pageSize=${pageSize}`),

  getScanResult: (resultId: string) => request<ScanResultView>(`/api/scan-results/${encodeURIComponent(resultId)}`),

  getLatestRelease: () => request<ClientReleaseView>('/api/client/latest', { auth: false }),

  createDownloadTicket: () =>
    request<DownloadTicketView>('/api/client/download-ticket', { method: 'POST', body: {} }),

  getDownloadStatus: (code: string) =>
    request<DownloadStatusView>(`/api/client/download-status?code=${encodeURIComponent(code)}`, { auth: false }),

  listAdminUsers: () => request<AdminUserView[]>('/api/admin/users'),

  createAdminUser: (body: CreateUserRequest) =>
    request<AdminUserView>('/api/admin/users', { method: 'POST', body }),

  updateAdminUser: (id: string, body: UpdateUserRequest) =>
    request<AdminUserView>(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body }),

  deleteAdminUser: (id: string) =>
    request<void>(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  resetAdminUserPassword: (id: string, newPassword: string) =>
    request<void>(`/api/admin/users/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: { newPassword }
    }),

  listAdminUserSessions: (id: string, page = 1, pageSize = 20) =>
    request<SessionListItem[]>(
      `/api/admin/users/${encodeURIComponent(id)}/sessions?page=${page}&pageSize=${pageSize}`
    ),

  listAdminSignatures: () => request<SignatureDto[]>('/api/admin/signatures'),

  createAdminSignature: (body: CreateSignatureRequest) =>
    request<SignatureDto>('/api/admin/signatures', { method: 'POST', body }),

  updateAdminSignature: (id: string, body: UpdateSignatureRequest) =>
    request<SignatureDto>(`/api/admin/signatures/${encodeURIComponent(id)}`, { method: 'PATCH', body }),

  deleteAdminSignature: (id: string) =>
    request<void>(`/api/admin/signatures/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  listAdminBannedHwids: () => request<BannedHwidView[]>('/api/admin/banned-hwids'),

  createAdminBannedHwid: (body: CreateBannedHwidRequest) =>
    request<BannedHwidView>('/api/admin/banned-hwids', { method: 'POST', body }),

  deleteAdminBannedHwid: (id: string) =>
    request<void>(`/api/admin/banned-hwids/${encodeURIComponent(id)}`, { method: 'DELETE' })
};

/// A böngésző natív letöltőjének szánt URL - a Panel letöltési jegyével, vagy a
/// játékos esetén a staff által generált session kóddal.
export function clientDownloadUrl(access: { ticket: string } | { code: string }): string {
  const query = 'ticket' in access
    ? `ticket=${encodeURIComponent(access.ticket)}`
    : `code=${encodeURIComponent(access.code)}`;
  return `${API_BASE}/api/client/download?${query}`;
}
