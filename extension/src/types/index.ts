export type SignalType = 'permission' | 'constructor' | 'push_subscribe';

export type DistractionLevel = 'Low' | 'Medium' | 'High';

export interface BlockedEntry {
  domain: string;
  timestamp: number;
  signal: SignalType;
}

export interface LastSession {
  sessionStart: number;
  sessionEnd: number;
  blockedLog: BlockedEntry[];
}

export interface Schedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface FocusState {
  isFocusMode: boolean;
  whitelist: string[];
}

export type ContentSettingValue = 'allow' | 'block' | 'ask';

export interface StorageState {
  isFocusMode: boolean;
  sessionStart: number | null;
  blockedLog: BlockedEntry[];
  isGeneratingReport: boolean;
  lastSession: LastSession | null;
  contentSettingsSnapshot: ContentSettingValue | null;
  whitelist: string[];
  schedule: Schedule;
}

export const DEFAULT_SCHEDULE: Schedule = {
  enabled: false,
  startTime: '09:00',
  endTime: '17:00',
};

export const DEFAULT_STORAGE: StorageState = {
  isFocusMode: false,
  sessionStart: null,
  blockedLog: [],
  isGeneratingReport: false,
  lastSession: null,
  contentSettingsSnapshot: null,
  whitelist: [],
  schedule: DEFAULT_SCHEDULE,
};

export const UI_SIGNALS: SignalType[] = ['permission', 'constructor'];

export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/^www\./, '');
  const slashIndex = value.indexOf('/');
  if (slashIndex !== -1) {
    value = value.slice(0, slashIndex);
  }
  const queryIndex = value.indexOf('?');
  if (queryIndex !== -1) {
    value = value.slice(0, queryIndex);
  }
  return value;
}

export function getDistractionLevel(count: number): DistractionLevel {
  if (count >= 10) return 'High';
  if (count >= 4) return 'Medium';
  return 'Low';
}

export function countUiAttempts(log: BlockedEntry[]): number {
  return log.filter((entry) => UI_SIGNALS.includes(entry.signal)).length;
}

export function aggregateByDomain(log: BlockedEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of log) {
    if (!UI_SIGNALS.includes(entry.signal)) continue;
    const domain = normalizeDomain(entry.domain);
    map.set(domain, (map.get(domain) ?? 0) + 1);
  }
  return map;
}
