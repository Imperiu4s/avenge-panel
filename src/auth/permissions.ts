import type { CurrentUserView } from '../api/types';

export const ROLE_LABELS: Record<string, string> = { Owner: 'Tulajdonos', Admin: 'Admin', Staff: 'Staff' };

export const ADMIN_ENTRY_PERMISSIONS = [
  'admin.overview', 'admin.scans', 'users.view', 'users.create', 'settings.view', 'settings.edit', 'audit.view',
  'signatures.view', 'sharelinks.manage', 'scans.purge',
  'platform.signatures', 'platform.store', 'platform.discord', 'platform.legal', 'platform.theme', 'platform.tickets', 'roles.manage'
];

export function can(user: CurrentUserView | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (!user.permissions) return user.role === 'Admin' || user.role === 'Owner';
  return user.permissions.includes(permission);
}

export function canAny(user: CurrentUserView | null | undefined, permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}

export function canOpenAdmin(user: CurrentUserView | null | undefined): boolean {
  return canAny(user, ADMIN_ENTRY_PERMISSIONS);
}
