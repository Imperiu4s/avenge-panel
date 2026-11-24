import { API_BASE } from './config';
import { ApiError, getStoredToken } from './client';
import { send } from './store';

export interface PluginKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  createdByEmail: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface PluginKeys {
  keys: PluginKey[];
  pluginAvailable: boolean;
  pluginFileName: string | null;
  pluginSize: number | null;
  pluginUpdatedAt: string | null;
  pluginOwned: boolean;
  storeSlug: string | null;
}

const P = '/api/admin/plugin';

export const pluginApi = {
  keys: () => send<PluginKeys>(`${P}/keys`, { auth: 'staff' }),
  create: (name: string) => send<{ key: string; view: PluginKey }>(`${P}/keys`, { method: 'POST', body: { name }, auth: 'staff' }),
  revoke: (id: string) => send<void>(`${P}/keys/${encodeURIComponent(id)}`, { method: 'DELETE', auth: 'staff' }),
  async download(): Promise<void> {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE}${P}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new ApiError(response.status, response.status === 404 ? 'A plugin még nincs feltöltve a szerverre.' : `Hiba (${response.status})`);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AvengeSS.jar';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
};
