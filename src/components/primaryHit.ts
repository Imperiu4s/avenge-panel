import type { FindingDto } from '../api/types';
import { parseEvents } from './timeline';

export type HitKind = 'cheat' | 'autoclicker' | 'other';

export interface PrimaryHit {
  finding: FindingDto;
  kind: HitKind;
  name: string;
  reason: string | null;
  when: string | null;
  whenLabel: string;
  downloadedFrom: string | null;
  runningNow: boolean;
  score: number;
}

export const HIT_KIND_LABELS: Record<HitKind, string> = {
  cheat: 'Csalás',
  autoclicker: 'Autoclicker',
  other: 'Egyéb'
};

const SEVERITY_RANK: Record<FindingDto['severity'], number> = {
  Critical: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Info: 1
};

const CANDIDATE_CATEGORIES = new Set<FindingDto['category']>([
  'CheatSignature',
  'Injector',
  'SuspiciousSavedFile',
  'SuspiciousDeletedFile',
  'XrayTexturePack',
  'MouseSoftware',
  'TamperAttempt'
]);

const CATEGORY_BONUS: Partial<Record<FindingDto['category'], number>> = {
  CheatSignature: 20,
  Injector: 18,
  SuspiciousSavedFile: 10,
  MouseSoftware: 8,
  XrayTexturePack: 6,
  SuspiciousDeletedFile: 5,
  TamperAttempt: 0
};

const AUTOCLICKER =
  /auto.?click|clicker\b|jitter|butterfly|drag.?click|gyorskattint|kattint\S*\s+makr|ismétlődő egérkattint|click.?macro|\bcps\b|timer.?click|murgee|macro.?recorder|autohotkey|\bahk\b|autoit/i;

function searchableText(f: FindingDto): string {
  const details = f.details ?? {};
  return [
    f.label,
    f.source,
    f.filePath ?? '',
    details['Indoklás'] ?? '',
    details['Makró típusa'] ?? '',
    details['Program'] ?? '',
    details['Fenyegetés'] ?? ''
  ].join(' \n ');
}

export function hitKind(f: FindingDto): HitKind {
  if (f.category === 'TamperAttempt') return 'other';
  if (f.category === 'MouseSoftware') {
    const kind = f.details?.['Makró típusa'] ?? '';
    if (/visszarúgás/i.test(kind)) return 'cheat';
    return 'autoclicker';
  }
  return AUTOCLICKER.test(searchableText(f)) ? 'autoclicker' : 'cheat';
}

function lastName(label: string): string {
  const index = label.lastIndexOf(': ');
  return index >= 0 ? label.slice(index + 2).trim() : label;
}

function fileName(path: string | null): string | null {
  if (!path) return null;
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function displayName(f: FindingDto): string {
  const details = f.details ?? {};
  if (details['Csalás']) {
    const file = fileName(f.filePath);
    return file ? `${details['Csalás']} (${file})` : details['Csalás'];
  }
  if (f.category === 'MouseSoftware') {
    if (details['Makró neve']) {
      return details['Program'] ? `${details['Makró neve']} (${details['Program']})` : details['Makró neve'];
    }
    return f.label.split(' · ')[0];
  }
  if (/:\s/.test(f.label)) return lastName(f.label);
  return fileName(f.filePath) ?? f.label;
}

function reasonOf(f: FindingDto): string | null {
  const details = f.details ?? {};
  if (details['Indoklás']) return details['Indoklás'];
  if (details['Makró típusa']) {
    const parts = [details['Makró típusa']];
    if (details['Kattintások']) parts.push(`${details['Kattintások']} kattintás`);
    if (details['Legkisebb késleltetés']) parts.push(`legkisebb késleltetés ${details['Legkisebb késleltetés']}`);
    if (details['Ismétlődik'] === 'igen') parts.push('ismétlődik');
    return parts.join(', ');
  }
  if (details['Figyelmeztetések']) return details['Figyelmeztetések'].split('\n')[0];
  if (details['Fenyegetés']) return `Defender: ${details['Fenyegetés']}`;
  return null;
}

function isRunning(f: FindingDto): boolean {
  if (/futó folyamat/i.test(f.source)) return true;
  return parseEvents(f.details?.['Események']).some((e) => /vizsgálatkor is futott/i.test(e.action));
}

function lastRun(f: FindingDto): string | null {
  const runs = parseEvents(f.details?.['Események']).filter((e) => /^Elindítva/i.test(e.action));
  if (runs.length > 0) return runs[0].time;
  return f.details?.['Utolsó futás'] && !Number.isNaN(Date.parse(f.details['Utolsó futás'])) ? f.details['Utolsó futás'] : null;
}

function scoreOf(f: FindingDto, scanTime: string): number {
  let score = SEVERITY_RANK[f.severity] * 100 + (CATEGORY_BONUS[f.category] ?? 0);
  if (isRunning(f)) score += 30;
  const time = lastRun(f) ?? f.foundAt;
  if (time) {
    const age = new Date(scanTime).getTime() - new Date(time).getTime();
    if (age >= 0 && age < 86_400_000) score += 10;
    else if (age >= 0 && age < 7 * 86_400_000) score += 5;
  }
  return score;
}

function toHit(f: FindingDto, scanTime: string): PrimaryHit {
  const run = lastRun(f);
  const events = parseEvents(f.details?.['Események']);
  const latest = events[0] ?? null;
  const download = events.find((e) => e.action === 'Letöltve');
  const when = run ?? f.foundAt ?? latest?.time ?? null;
  const whenLabel = isRunning(f)
    ? 'A vizsgálatkor is futott'
    : run
      ? 'Utoljára elindítva'
      : f.foundAt
        ? 'Időpont'
        : latest?.action ?? 'Időpont';
  return {
    finding: f,
    kind: hitKind(f),
    name: displayName(f),
    reason: reasonOf(f),
    when,
    whenLabel,
    downloadedFrom: download ? download.text.replace(/^innen:\s*/i, '') : null,
    runningNow: isRunning(f),
    score: scoreOf(f, scanTime)
  };
}

export function rankHits(findings: FindingDto[], scanTime: string): PrimaryHit[] {
  return findings
    .filter((f) => CANDIDATE_CATEGORIES.has(f.category))
    .filter((f) => f.category !== 'MouseSoftware' || f.severity !== 'Low' || Boolean(f.details?.['Makró típusa']))
    .map((f) => toHit(f, scanTime))
    .sort((a, b) => {
      const aOther = a.kind === 'other' ? 1 : 0;
      const bOther = b.kind === 'other' ? 1 : 0;
      if (aOther !== bOther && SEVERITY_RANK[a.finding.severity] === SEVERITY_RANK[b.finding.severity]) return aOther - bOther;
      return b.score - a.score;
    });
}

export function isSignal(hit: PrimaryHit): boolean {
  return SEVERITY_RANK[hit.finding.severity] >= SEVERITY_RANK.Medium;
}
