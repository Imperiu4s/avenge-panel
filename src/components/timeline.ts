// A kliens két, tabulátorral tagolt formátuma (lásd client: ForensicEvents, ConfigHistory.Encode).

/** Egy esemény az idővonalon: "Változások" (egérprogram) vagy "Események" (minden más találat). */
export interface TimelineEvent {
  time: string;
  action: string;
  source: string;
  text: string;
  precision: 'pontos' | 'legkesobb' | 'kozott';
  notBefore: string | null;
}

/** Egy tartalmi változás (gomb, makró, profil, beállítás) és amit az idejéről tudunk. */
export interface TimedChange {
  kind: string;
  text: string;
  file: string;
  exact: string | null;
  notBefore: string | null;
  notAfter: string | null;
  basis: string;
}

export function parseEvents(value: string | null | undefined): TimelineEvent[] {
  if (!value) return [];
  return value.split('\n').flatMap((line) => {
    const [time, action, source, text, precision, notBefore] = line.split('\t');
    if (!time || !action || Number.isNaN(Date.parse(time))) return [];
    return [{
      time,
      action,
      source: source ?? '',
      text: text ?? '',
      precision: precision === 'legkesobb' || precision === 'kozott' ? precision : 'pontos',
      notBefore: notBefore || null
    }];
  });
}

export function parseChanges(value: string | null | undefined): TimedChange[] {
  if (!value) return [];
  return value.split('\n').flatMap((line) => {
    const [kind, text, file, exact, notBefore, notAfter, basis] = line.split('\t');
    if (!kind || !text) return [];
    return [{ kind, text, file: file ?? '', exact: exact || null, notBefore: notBefore || null, notAfter: notAfter || null, basis: basis ?? '' }];
  });
}

/** Mindig másodpercre: "2026. 11. 06. 14:32:07". */
export function formatSecond(iso: string): string {
  return new Date(iso).toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/** Az esemény a vizsgálathoz képest: ez a lényeg, nem csak a naptári időpont. */
export function beforeScan(eventIso: string, scanIso: string): string {
  const seconds = Math.round((new Date(scanIso).getTime() - new Date(eventIso).getTime()) / 1000);
  if (seconds < 0) return 'a vizsgálat közben';
  if (seconds < 60) return `${seconds} másodperccel a vizsgálat előtt`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} perccel a vizsgálat előtt`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} órával a vizsgálat előtt`;
  return `${Math.round(hours / 24)} nappal a vizsgálat előtt`;
}

export interface TimingLabel {
  /** Rövid jelző: pontos / időablak / legkésőbb / ismeretlen. */
  badge: string;
  tone: 'exact' | 'window' | 'unknown';
  text: string;
}

export function changeTiming(change: TimedChange): TimingLabel {
  if (change.exact) {
    return { badge: 'pontos', tone: 'exact', text: formatSecond(change.exact) };
  }
  if (change.notBefore && change.notAfter) {
    return { badge: 'időablak', tone: 'window', text: `${formatSecond(change.notBefore)} – ${formatSecond(change.notAfter)}` };
  }
  if (change.notAfter) {
    return { badge: 'legkésőbb', tone: 'window', text: formatSecond(change.notAfter) };
  }
  return { badge: 'ismeretlen', tone: 'unknown', text: 'az időpontot a program nem rögzíti' };
}

export function eventTiming(event: TimelineEvent): TimingLabel {
  if (event.precision === 'kozott' && event.notBefore) {
    return { badge: 'időablak', tone: 'window', text: `${formatSecond(event.notBefore)} – ${formatSecond(event.time)}` };
  }
  if (event.precision === 'legkesobb') {
    return { badge: 'legkésőbb', tone: 'window', text: formatSecond(event.time) };
  }
  return { badge: 'pontos', tone: 'exact', text: formatSecond(event.time) };
}

const ACTION_TONES: [RegExp, string][] = [
  [/törölve|eltávolította|karantén/i, 'tl-action-danger'],
  [/átnevezve|létrehozva|letöltve|lomtárba/i, 'tl-action-warm'],
  [/gomb|makró|profil|beállítás/i, 'tl-action-hot'],
  [/elindítva|telepítve/i, 'tl-action-ok'],
  [/módosult|módosítva|írás|tartalom/i, 'tl-action-info']
];

export function actionTone(action: string): string {
  return ACTION_TONES.find(([pattern]) => pattern.test(action))?.[1] ?? 'tl-action-muted';
}
