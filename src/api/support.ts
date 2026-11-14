import { API_BASE } from './config';
import { getStoredToken } from './client';
import { getCustomerToken, send } from './store';

export type TicketStatus = 'open' | 'answered' | 'closed';

export interface SupportTopic {
  key: string;
  label: string;
  description: string;
}

export interface SupportAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface SupportMessage {
  id: string;
  authorType: 'customer' | 'staff' | 'system';
  authorName: string;
  body: string;
  createdAt: string;
  attachments: SupportAttachment[];
}

export interface SupportTicketSummary {
  id: string;
  number: number;
  topic: string;
  topicLabel: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  unread: boolean;
  assignedName: string | null;
  cooldownWaived: boolean;
  customerEmail?: string | null;
  minecraftName?: string | null;
}

export interface SupportCustomer {
  id: string;
  email: string;
  minecraftName: string | null;
  subscriptionStatus: string | null;
  paidOrders: number;
  tickets: number;
}

export interface SupportTicketDetail {
  ticket: SupportTicketSummary;
  reference: string | null;
  messages: SupportMessage[];
  customer?: SupportCustomer | null;
}

export interface SupportOverview {
  tickets: SupportTicketSummary[];
  enabled: boolean;
  cooldownHours: number;
  canOpen: boolean;
  blockedReason: string | null;
  nextOpenAt: string | null;
  topics: SupportTopic[];
}

export interface AdminTicketList {
  items: SupportTicketSummary[];
  open: number;
  answered: number;
  closed: number;
  enabled: boolean;
  cooldownHours: number;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Válaszra vár',
  answered: 'Megválaszolva',
  closed: 'Lezárva'
};

export function ticketNumber(n: number): string {
  return `#${String(n).padStart(4, '0')}`;
}

function form(fields: Record<string, string | undefined>, files: File[]): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) data.append(key, value);
  }
  for (const file of files) data.append('files', file, file.name);
  return data;
}

const C = '/api/store/tickets';
const A = '/api/admin/tickets';

export const supportApi = {
  overview: () => send<SupportOverview>(C, { auth: 'customer' }),
  create: (body: { topic: string; subject: string; message: string; reference: string }, files: File[]) =>
    send<SupportTicketDetail>(C, { method: 'POST', form: form(body, files), auth: 'customer' }),
  ticket: (id: string) => send<SupportTicketDetail>(`${C}/${encodeURIComponent(id)}`, { auth: 'customer' }),
  reply: (id: string, message: string, files: File[]) =>
    send<SupportTicketDetail>(`${C}/${encodeURIComponent(id)}/messages`, { method: 'POST', form: form({ message }, files), auth: 'customer' }),
  close: (id: string) => send<SupportTicketDetail>(`${C}/${encodeURIComponent(id)}/close`, { method: 'POST', auth: 'customer' })
};

export const supportAdminApi = {
  list: (status: string, q: string) =>
    send<AdminTicketList>(`${A}?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`, { auth: 'staff' }),
  summary: () => send<{ waiting: number }>(`${A}/summary`, { auth: 'staff' }),
  ticket: (id: string) => send<SupportTicketDetail>(`${A}/${encodeURIComponent(id)}`, { auth: 'staff' }),
  reply: (id: string, message: string, files: File[], close: boolean) =>
    send<SupportTicketDetail>(`${A}/${encodeURIComponent(id)}/messages`, { method: 'POST', form: form({ message, close: close ? 'true' : 'false' }, files), auth: 'staff' }),
  assign: (id: string, assign: boolean) => send<SupportTicketDetail>(`${A}/${encodeURIComponent(id)}/assign`, { method: 'POST', body: { assign }, auth: 'staff' }),
  close: (id: string) => send<SupportTicketDetail>(`${A}/${encodeURIComponent(id)}/close`, { method: 'POST', auth: 'staff' }),
  reopen: (id: string) => send<SupportTicketDetail>(`${A}/${encodeURIComponent(id)}/reopen`, { method: 'POST', auth: 'staff' }),
  waive: (id: string) => send<SupportTicketDetail>(`${A}/${encodeURIComponent(id)}/waive`, { method: 'POST', auth: 'staff' }),
  settings: (body: { enabled?: boolean; cooldownHours?: number }) => send<void>(`${A}/settings`, { method: 'PUT', body, auth: 'staff' })
};

export async function attachmentUrl(id: string, staff: boolean): Promise<string> {
  const token = staff ? getStoredToken() : getCustomerToken();
  const response = await fetch(`${API_BASE}${staff ? A : C}/attachments/${encodeURIComponent(id)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error(String(response.status));
  return URL.createObjectURL(await response.blob());
}
