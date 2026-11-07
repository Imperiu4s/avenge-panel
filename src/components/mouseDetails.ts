// A kliens (MacroDetail.Encode, DeviceSetting.Encode, ToolSettings) tabulátorral tagolt sorai.

export interface MacroDetailView {
  name: string;
  kind: string;
  trigger: string | null;
  repeat: string | null;
  clicks: number;
  minDelayMs: number | null;
  totalMs: number;
  clicksPerSecond: number | null;
  source: string;
  steps: string[];
  minClickIntervalMs: number | null;
}

export interface DeviceSettingView {
  group: string;
  path: string;
  value: string;
  warning: string | null;
}

export interface ProgramSettingView {
  name: string;
  value: string;
}

function lines(value: string | null | undefined): string[] {
  return value ? value.split('\n').filter(Boolean) : [];
}

function num(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseMacroDetails(value: string | null | undefined): MacroDetailView[] {
  return lines(value).flatMap((line) => {
    const [name, kind, trigger, repeat, clicks, minDelay, total, cps, source, steps, minInterval] = line.split('\t');
    if (!name) return [];
    return [{
      name,
      kind: kind ?? '',
      trigger: trigger || null,
      repeat: repeat || null,
      clicks: num(clicks) ?? 0,
      minDelayMs: num(minDelay),
      totalMs: num(total) ?? 0,
      clicksPerSecond: num(cps),
      source: source ?? '',
      steps: steps ? steps.split(' ¦ ').filter(Boolean) : [],
      minClickIntervalMs: num(minInterval)
    }];
  });
}

export function parseDeviceSettings(value: string | null | undefined): DeviceSettingView[] {
  return lines(value).flatMap((line) => {
    const [group, path, settingValue, warning] = line.split('\t');
    return group && settingValue !== undefined ? [{ group, path: path ?? '', value: settingValue, warning: warning || null }] : [];
  });
}

export function parseProgramSettings(value: string | null | undefined): ProgramSettingView[] {
  return lines(value).flatMap((line) => {
    const [name, settingValue] = line.split('\t');
    return name ? [{ name, value: settingValue ?? '' }] : [];
  });
}

/** Ezredmásodperc olvashatóan: 120000 → "2 perc", 1500 → "1,5 mp", 15 → "15 ms". */
export function formatMs(ms: number): string {
  if (ms >= 60_000) {
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.round((ms % 60_000) / 1000);
    return seconds > 0 ? `${minutes} perc ${seconds} mp` : `${minutes} perc`;
  }
  if (ms >= 1000) return `${(ms / 1000).toLocaleString('hu-HU', { maximumFractionDigits: 2 })} mp`;
  return `${ms} ms`;
}

export function formatCps(cps: number): string {
  return cps.toLocaleString('hu-HU', { maximumFractionDigits: cps < 1 ? 3 : 1 });
}

/** Autoclicker / recoil jellegű makró: piros kiemelés. */
export function isHotKind(kind: string): boolean {
  return /gyorskattint|visszarúgás/i.test(kind);
}
