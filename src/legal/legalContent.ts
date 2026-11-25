import { t } from '../i18n';
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
  { key: 'szolgaltato.nev', label: t('Szolgáltató neve'), group: t('Szolgáltató') },
  { key: 'szolgaltato.jogallas', label: t('Jogállás'), group: t('Szolgáltató'), hint: t('pl. magánszemély, egyéni vállalkozó, Kft.') },
  { key: 'szolgaltatas.nev', label: t('A szolgáltatás neve'), group: t('Szolgáltató') },
  { key: 'szolgaltato.cim', label: t('Cím'), group: t('Szolgáltató') },
  { key: 'szolgaltato.adoszam', label: t('Adószám'), group: t('Szolgáltató'), hint: t('Üresen nem jelenik meg.') },
  { key: 'szolgaltato.nyilvantartas', label: t('Nyilvántartási / cégjegyzékszám'), group: t('Szolgáltató'), hint: t('Üresen nem jelenik meg.') },
  { key: 'kapcsolat.email', label: 'E-mail', group: t('Kapcsolat') },
  { key: 'kapcsolat.discord', label: t('Discord szerver'), group: t('Kapcsolat') },
  { key: 'weboldal', label: 'Weboldal', group: t('Kapcsolat') },
  { key: 'viszontelado.nev', label: t('Cégnév'), group: t('Viszonteladó (fizetés)') },
  { key: 'viszontelado.szekhely', label: t('Székhely'), group: t('Viszonteladó (fizetés)') },
  { key: 'viszontelado.cegjegyzekszam', label: t('Cégjegyzékszám'), group: t('Viszonteladó (fizetés)') },
  { key: 'viszontelado.adoszam', label: t('Adószám'), group: t('Viszonteladó (fizetés)') },
  { key: 'viszontelado.feltetelek', label: t('Vásárlói feltételek'), group: t('Viszonteladó (fizetés)') },
  { key: 'naplo.megorzes', label: t('Naplók megőrzése'), group: t('Adatkezelés') }
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
  { token: t('{{kapcsolat}}'), text: t('E-mail és Discord egy mondatban') },
  { token: '{{szolgaltato.tabla}}', text: t('A szolgáltató adatai táblázatban') },
  { token: '{{viszontelado.tabla}}', text: t('A viszonteladó adatai táblázatban') },
  { token: '{{tarhely.tabla}}', text: t('A tárhelyszolgáltatók táblázata') },
  { token: '{{tarhely.lista}}', text: t('A tárhelyszolgáltatók felsorolásként') }
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
  const f = Object.fromEntries(Object.entries(resolvedFields(content)).map(([key, value]) => [key, t(value)]));
  const hosting = resolvedHosting(content).map((h) => ({ ...h, role: t(h.role) }));
  const jogallas = f['szolgaltato.jogallas'] ? ` (${f['szolgaltato.jogallas']})` : '';
  const web = f.weboldal ? (f.weboldal.startsWith('http') ? f.weboldal : `https://${f.weboldal}`) : '';
  const discord = f['kapcsolat.discord'];
  const special: Record<string, string> = {
    kapcsolat: [f['kapcsolat.email'] ? t('a **{0}** e-mail címen', f['kapcsolat.email']) : '', t('ticketben a weboldal **Támogatás** oldalán (avenge.hu/tamogatas)'), discord ? t('a Discord szerverünkön (**{0}**)', discord) : '']
      .filter(Boolean).join(', ').replace(/, ([^,]*)$/, t(' vagy $1')),
    'szolgaltato.tabla': table([
      [t('Szolgáltató'), `${f['szolgaltato.nev']}${jogallas}`],
      [t('A szolgáltatás neve'), f['szolgaltatas.nev']],
      [t('Cím'), f['szolgaltato.cim']],
      [t('Adószám'), f['szolgaltato.adoszam']],
      [t('Nyilvántartási szám'), f['szolgaltato.nyilvantartas']],
      ['E-mail', f['kapcsolat.email']],
      [t('Ügyfélszolgálat'), t('ticket a weboldalon: {0}{1}', web ? `${web}/tamogatas` : t('Támogatás oldal'), discord ? `, Discord: ${discord}` : '')],
      [t('Weboldal'), web]
    ]),
    'viszontelado.tabla': table([
      [t('Cégnév'), f['viszontelado.nev']],
      [t('Székhely'), f['viszontelado.szekhely']],
      [t('Cégjegyzékszám'), f['viszontelado.cegjegyzekszam']],
      [t('Adószám'), f['viszontelado.adoszam']],
      [t('Vásárlói feltételek'), f['viszontelado.feltetelek']]
    ]),
    'tarhely.tabla': hosting.length === 0
      ? '-'
      : [t('| Feladat | Szolgáltató | Cím | Elérhetőség |'), '|---|---|---|---|',
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
    let message = t('Hiba ({0})', response.status);
    try {
      message = (await response.json())?.message ?? message;
    } catch {
      message = t('Hiba ({0})', response.status);
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export const legalAdminApi = {
  get: () => adminRequest<LegalContentData>('GET'),
  save: (content: Omit<LegalContentData, 'updatedAt'>) => adminRequest<LegalContentData>('PUT', content)
};
