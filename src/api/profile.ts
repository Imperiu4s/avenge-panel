import { API_BASE } from './config';
import { send, type AuthMode } from './store';

export interface ProfileView {
  avatarUrl: string | null;
  theme: string | null;
  displayName?: string | null;
  minecraftUsername?: string | null;
}

export interface PermissionInfo {
  key: string;
  group: string;
  label: string;
  description: string;
  platform: boolean;
}

export interface RolePermissions {
  catalog: PermissionInfo[];
  owner: string[];
  admin: string[];
  staff: string[];
  adminCustomized: boolean;
  staffCustomized: boolean;
  platformOrg: boolean;
}

export function avatarSrc(url: string | null | undefined): string | null {
  return url ? `${API_BASE}${url}` : null;
}

function uploadAvatar(path: string, auth: AuthMode, image: Blob) {
  const form = new FormData();
  form.append('file', image, image.type === 'image/png' ? 'avatar.png' : 'avatar.webp');
  return send<ProfileView>(path, { method: 'POST', form, auth });
}

export const staffProfileApi = {
  uploadAvatar: (image: Blob) => uploadAvatar('/api/auth/me/avatar', 'staff', image),
  removeAvatar: () => send<void>('/api/auth/me/avatar', { method: 'DELETE', auth: 'staff' }),
  setTheme: (theme: string) => send<ProfileView>('/api/auth/me/preferences', { method: 'PUT', body: { theme }, auth: 'staff' })
};

export const customerProfileApi = {
  uploadAvatar: (image: Blob) => uploadAvatar('/api/store/me/avatar', 'customer', image),
  removeAvatar: () => send<void>('/api/store/me/avatar', { method: 'DELETE', auth: 'customer' }),
  update: (body: { minecraftUsername?: string; theme?: string }) =>
    send<ProfileView>('/api/store/me/profile', { method: 'PUT', body, auth: 'customer' })
};

export const rolesApi = {
  get: () => send<RolePermissions>('/api/admin/roles', { auth: 'staff' }),
  save: (body: { admin?: string[]; staff?: string[]; resetAdmin?: boolean; resetStaff?: boolean }) =>
    send<RolePermissions>('/api/admin/roles', { method: 'PUT', body, auth: 'staff' })
};
