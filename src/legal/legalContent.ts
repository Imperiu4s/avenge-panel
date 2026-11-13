import { useEffect, useState } from 'react';
import { API_BASE } from '../api/config';
import { ApiError, getStoredToken } from '../api/client';

export interface LegalHostingEntry {
  role: string;
  name: string;
  address: string;
  contact: string;
}

export interface LegalDocumentOverride {
  body: string;
  updated: string;
}

export interface LegalContentData {
  fields: Record<string, string>;
  hosting: LegalHostingEntry[] | null;
  documents: Record<string, LegalDocumentOverride>;
  updatedAt: string | null;
}

export const LEGAL_FIELDS: { key: string; label: string; group: string; hint?: string }[] = [
  { key: 'szolgaltato.nev', label: 'Szolgáltató neve', group: 'Szolgáltató' },
  { key: 'szolgaltato.jogallas', label: 'Jogállás', group: 'Szolgáltató', hint: 'pl. magánszemély, egyéni vállalkozó, Kft.' },
  { key: 'szolgaltatas.nev', label: 'A szolgáltatás neve', group: 'Szolgáltató' },
  { key: 'szolgaltato.cim', label: 'Cím', group: 'Szolgáltató' },
  { key: 'szolgaltato.adoszam', label: 'Adószám', group: 'Szolgáltató', hint: 'Üresen nem jelenik meg.' },
  { key: 'szolgaltato.nyilvantartas', label: 'Nyilvántartási / cégjegyzékszám', group: 'Szolgáltató', hint: 'Üresen nem jelenik meg.' },
  { key: 'kapcsolat.email', label: 'E-mail', group: 'Kapcsolat' },
  { key: 'kapcsolat.discord', label: 'Discord (ticket)', group: 'Kapcsolat' },
  { key: 'weboldal', label: 'Weboldal', group: 'Kapcsolat' },
  { key: 'viszontelado.nev', label: 'Cégnév', group: 'Viszonteladó (fizetés)' },
  { key: 'viszontelado.szekhely', label: 'Székhely', group: 'Viszonteladó (fizetés)' },
  { key: 'viszontelado.cegjegyzekszam', label: 'Cégjegyzékszám', group: 'Viszonteladó (fizetés)' },
  { key: 'viszontelado.adoszam', label: 'Adószám', group: 'Viszonteladó (fizetés)' },
  { key: 'viszontelado.feltetelek', label: 'Vásárlói feltételek', group: 'Viszonteladó (fizetés)' },
  { key: 'naplo.megorzes', label: 'Naplók megőrzése', group: 'Adatkezelés' }
];

export const DEFAULT_FIELDS: Record<string, string> = {
  'szolgaltato.nev': 'Kiss Lajos',
  'szolgaltato.jogallas': 'magánszemély',
  'szolgaltatas.nev': 'Avenge',
  'szolgaltato.cim': 'Kecskemét, Magyarország',
  'szolgaltato.adoszam': '',
  'szolgaltato.nyilvantartas': '',
  'kapcsolat.email': 'solarynnetwork@gmail.com',
  'kapcsolat.discord': 'dc.avenge.hu',
  weboldal: 'avenge.hu',
  'viszontelado.nev': 'Tebex Limited',
  'viszontelado.szekhely': '5.2 Central House, 1 Ballards Lane, London, N3 1LQ, Egyesült Királyság',
  'viszontelado.cegjegyzekszam': '08129184 (Anglia és Wales)',
  'viszontelado.adoszam': 'GB167189962, EU372035465',
  'viszontelado.feltetelek': 'https://checkout.tebex.io/terms',
  'naplo.megorzes':
    'A szerver működési naplóját (benne a kérések IP-címével) nem archiváljuk: csak a tárhelyszolgáltató konzolján látható átmenetileg, és a szerver újraindításakor törlődik. A staff műveleteit a szervezet tevékenységnaplója IP-címmel együtt a szervezet törléséig őrzi; a vizsgálatokhoz tartozó IP-cím a vizsgálat eredményével együtt törlődik.'
};

export const DEFAULT_HOSTING: LegalHostingEntry[] = [
  { role: 'Szerver (API, adatbázis, letöltések)', name: 'HexaVerse', address: '', contact: '' }
];

export const PLACEHOLDER_HELP: { token: string; text: string }[] = [
  ...LEGAL_FIELDS.map((f) => ({ token: `{{${f.key}}}`, text: f.label })),
  { token: '{{kapcsolat}}', text: 'E-mail és Discord egy mondatban' },
  { token: '{{szolgaltato.tabla}}', text: 'A szolgáltató adatai táblázatban' },
  { token: '{{viszontelado.tabla}}', text: 'A viszonteladó adatai táblázatban' },
  { token: '{{tarhely.tabla}}', text: 'A tárhelyszolgáltatók táblázata' },
  { token: '{{tarhely.lista}}', text: 'A tárhelyszolgáltatók felsorolásként' }
];

export function resolvedFields(content: LegalContentData | null): Record<string, string> {
  return { ...DEFAULT_FIELDS, ...(content?.fields ?? {}) };
}

export function resolvedHosting(content: LegalContentData | null): LegalHostingEntry[] {
  return content?.hosting ?? DEFAULT_HOSTING;
}

function cell(value: string): string {
  return value.replace(/\|/g, '/').replace(/\n/g, ' ');
}

function table(rows: [string, string][]): string {
  const visible = rows.filter(([, value]) => value.trim().length > 0);
  return ['| | |', '|---|---|', ...visible.map(([label, value]) => `| ${cell(label)} | ${cell(value)} |`)].join('\n');
}

export function renderLegal(body: string, content: LegalContentData | null): string {
  const f = resolvedFields(content);
  const hosting = resolvedHosting(content);
  const jogallas = f['szolgaltato.jogallas'] ? ` (${f['szolgaltato.jogallas']})` : '';
  const web = f.weboldal ? (f.weboldal.startsWith('http') ? f.weboldal : `https://${f.weboldal}`) : '';
  const discord = f['kapcsolat.discord'];
  const special: Record<string, string> = {
    kapcsolat: [f['kapcsolat.email'] ? `a **${f['kapcsolat.email']}** e-mail címen` : '', discord ? `ticketben a Discord szerverünkön (**${discord}**)` : '']
      .filter(Boolean).join(' vagy '),
    'szolgaltato.tabla': table([
      ['Szolgáltató', `${f['szolgaltato.nev']}${jogallas}`],
      ['A szolgáltatás neve', f['szolgaltatas.nev']],
      ['Cím', f['szolgaltato.cim']],
      ['Adószám', f['szolgaltato.adoszam']],
      ['Nyilvántartási szám', f['szolgaltato.nyilvantartas']],
      ['E-mail', f['kapcsolat.email']],
      ['Ügyfélszolgálat', discord ? `ticket a Discord szerverünkön: ${discord}` : ''],
      ['Weboldal', web]
    ]),
    'viszontelado.tabla': table([
      ['Cégnév', f['viszontelado.nev']],
      ['Székhely', f['viszontelado.szekhely']],
      ['Cégjegyzékszám', f['viszontelado.cegjegyzekszam']],
      ['Adószám', f['viszontelado.adoszam']],
      ['Vásárlói feltételek', f['viszontelado.feltetelek']]
    ]),
    'tarhely.tabla': hosting.length === 0
      ? '-'
      : ['| Feladat | Szolgáltató | Cím | Elérhetőség |', '|---|---|---|---|',
        ...hosting.map((h) => `| ${cell(h.role || '-')} | ${cell(h.name)} | ${cell(h.address || '-')} | ${cell(h.contact || '-')} |`)].join('\n'),
    'tarhely.lista': hosting.map((h) => `- **${h.name}**${h.role ? ` - ${h.role}` : ''}${h.address ? `, ${h.address}` : ''}`).join('\n')
  };
  return body.replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/g, (all, key: string) => special[key] ?? f[key] ?? all);
}

let cache: Promise<LegalContentData> | null = null;

export function fetchLegalContent(force = false): Promise<LegalContentData> {
  if (!cache || force) {
    cache = fetch(`${API_BASE}/api/legal`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch(() => {
        cache = null;
        return { fields: {}, hosting: null, documents: {}, updatedAt: null };
      });
  }
  return cache;
}

export function useLegalContent(): LegalContentData | null {
  const [content, setContent] = useState<LegalContentData | null>(null);
  useEffect(() => {
    let alive = true;
    fetchLegalContent().then((c) => { if (alive) setContent(c); });
    return () => { alive = false; };
  }, []);
  return content;
}

async function adminRequest<T>(method: string, body?: unknown): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE}/api/admin/legal`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    let message = `Hiba (${response.status})`;
    try {
      message = (await response.json())?.message ?? message;
    } catch {
      message = `Hiba (${response.status})`;
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export const legalAdminApi = {
  get: () => adminRequest<LegalContentData>('GET'),
  save: (content: Omit<LegalContentData, 'updatedAt'>) => adminRequest<LegalContentData>('PUT', content)
};
