import {
  DEFAULT_STORAGE,
  type BlockedEntry,
  type ContentSettingValue,
  type FocusState,
  type LastSession,
  type SignalType,
  countUiAttempts,
  normalizeDomain,
} from '../types';
import { getNextOccurrence, isInScheduledRange } from '../utils/schedule';

const REPORT_URL = 'src/report/report.html';
const MIN_SESSION_MS = 60_000;
const CLEAR_GUARD_ALARM = 'clearReportGuard';
const SCHEDULE_ON_ALARM = 'schedule-on';
const SCHEDULE_OFF_ALARM = 'schedule-off';

async function getStorage() {
  const keys = Object.keys(DEFAULT_STORAGE) as (keyof typeof DEFAULT_STORAGE)[];
  const data = await chrome.storage.local.get(keys);
  return { ...DEFAULT_STORAGE, ...data };
}

async function snapshotGlobalContentSettings(): Promise<ContentSettingValue> {
  return new Promise((resolve) => {
    chrome.contentSettings.notifications.get(
      { primaryUrl: 'https://example.com' },
      (details) => {
        resolve((details.setting as ContentSettingValue) ?? 'ask');
      },
    );
  });
}

async function setGlobalContentSettings(setting: ContentSettingValue): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contentSettings.notifications.set(
      { primaryPattern: '<all_urls>', setting },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      },
    );
  });
}

async function setDomainContentSettings(
  domain: string,
  setting: ContentSettingValue,
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.contentSettings.notifications.set(
      { primaryPattern: `*://${domain}/*`, setting },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      },
    );
  });
}

async function applyWhitelistContentSettings(whitelist: string[]): Promise<void> {
  for (const domain of whitelist) {
    try {
      await setDomainContentSettings(domain, 'allow');
    } catch (e) {
      console.error('whitelist contentSettings failed', domain, e);
    }
  }
}

async function updateActionUi(isFocusMode: boolean, badgeText = ''): Promise<void> {
  const path = isFocusMode ? 'icons/icon-on.png' : 'icons/icon-off.png';
  await chrome.action.setIcon({ path });
  await chrome.action.setBadgeText({ text: badgeText });
  await chrome.action.setBadgeBackgroundColor({
    color: isFocusMode ? '#1a7f37' : '#6e7781',
  });
  await chrome.action.setTitle({
    title: isFocusMode ? 'Focus Mode: ON' : 'Focus Mode: OFF',
  });
}

export async function broadcastStateChanged(state: FocusState): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, { type: 'STATE_CHANGED', state })
          .catch(() => {});
      }
    }
  } catch {
    // fire-and-forget
  }
}

async function scheduleClearReportGuard(): Promise<void> {
  await chrome.alarms.create(CLEAR_GUARD_ALARM, { delayInMinutes: 1 });
}

async function clearReportGuardAlarm(): Promise<void> {
  await chrome.alarms.clear(CLEAR_GUARD_ALARM);
}

async function createScheduleAlarm(name: string, when: number): Promise<void> {
  try {
    await chrome.alarms.create(name, { when });
  } catch (e) {
    console.error(`failed to create alarm ${name}`, e);
    throw e;
  }
}

export async function scheduleAlarms(): Promise<void> {
  await chrome.alarms.clear(SCHEDULE_ON_ALARM);
  await chrome.alarms.clear(SCHEDULE_OFF_ALARM);

  const { schedule } = await getStorage();
  if (!schedule?.enabled) return;

  if (!schedule.startTime || !schedule.endTime) {
    console.warn('scheduleAlarms: missing startTime or endTime');
    return;
  }

  const now = new Date();
  const onWhen = getNextOccurrence(schedule.startTime, now);
  const offWhen = getNextOccurrence(schedule.endTime, now);

  await createScheduleAlarm(SCHEDULE_ON_ALARM, onWhen);
  await createScheduleAlarm(SCHEDULE_OFF_ALARM, offWhen);
}

async function checkImmediateScheduleActivation(): Promise<void> {
  const { schedule, isFocusMode } = await getStorage();
  if (
    schedule.enabled &&
    !isFocusMode &&
    isInScheduledRange(schedule.startTime, schedule.endTime, new Date())
  ) {
    await toggleFocusMode();
  }
}

export async function toggleFocusMode(): Promise<void> {
  const storage = await getStorage();
  const { isFocusMode, whitelist } = storage;

  if (isFocusMode) {
    if (storage.isGeneratingReport) return;

    await chrome.storage.local.set({ isGeneratingReport: true });
    await scheduleClearReportGuard();

    const sessionStart = storage.sessionStart ?? Date.now();
    const sessionEnd = Date.now();
    const sessionDuration = sessionEnd - sessionStart;
    const blockedLog = storage.blockedLog ?? [];
    const uiAttempts = countUiAttempts(blockedLog);

    if (storage.contentSettingsSnapshot !== null) {
      try {
        await setGlobalContentSettings(storage.contentSettingsSnapshot);
      } catch (e) {
        console.error('restore contentSettings failed', e);
      }
      await chrome.storage.local.set({ contentSettingsSnapshot: null });
    }

    await chrome.storage.local.set({
      isFocusMode: false,
      sessionStart: null,
      blockedLog: [],
    });

    const shouldOpenReport =
      uiAttempts > 0 || sessionDuration > MIN_SESSION_MS;

    if (shouldOpenReport) {
      const lastSession: LastSession = {
        sessionStart,
        sessionEnd,
        blockedLog,
      };
      await chrome.storage.local.set({ lastSession });
      await chrome.tabs.create({ url: chrome.runtime.getURL(REPORT_URL) });
      await updateActionUi(false, '');
      await chrome.storage.local.set({ isGeneratingReport: false });
      await clearReportGuardAlarm();
    } else {
      await chrome.storage.local.set({ lastSession: null });
      await updateActionUi(false, '0');
      await chrome.action.setTitle({
        title: 'No interruption attempts this session',
      });
      await chrome.storage.local.set({ isGeneratingReport: false });
      await clearReportGuardAlarm();
    }
  } else {
    const snapshot = await snapshotGlobalContentSettings();
    await chrome.storage.local.set({
      isFocusMode: true,
      sessionStart: Date.now(),
      blockedLog: [],
      lastSession: null,
      contentSettingsSnapshot: snapshot,
    });

    try {
      await setGlobalContentSettings('block');
      await applyWhitelistContentSettings(whitelist);
    } catch (e) {
      console.error('apply contentSettings block failed', e);
    }

    await updateActionUi(true, 'ON');
  }

  const updated = await getStorage();
  await broadcastStateChanged({
    isFocusMode: updated.isFocusMode,
    whitelist: updated.whitelist,
  });
}

async function handleLogAttempt(
  domain: string,
  signal: SignalType,
): Promise<void> {
  const storage = await getStorage();
  if (!storage.isFocusMode) return;

  const normalized = normalizeDomain(domain);
  const { whitelist } = storage;
  if ((whitelist ?? []).includes(normalized)) return;

  const entry: BlockedEntry = {
    domain: normalized,
    timestamp: Date.now(),
    signal,
  };

  const blockedLog = [...(storage.blockedLog ?? []), entry];
  await chrome.storage.local.set({ blockedLog });
}

async function handleGetState(): Promise<FocusState> {
  const { isFocusMode, whitelist } = await getStorage();
  return { isFocusMode, whitelist: whitelist ?? [] };
}

async function handleUpdateWhitelist(whitelist: string[]): Promise<void> {
  await chrome.storage.local.set({ whitelist });
  const { isFocusMode } = await getStorage();
  if (isFocusMode) {
    try {
      await applyWhitelistContentSettings(whitelist);
    } catch (e) {
      console.error('update whitelist contentSettings failed', e);
    }
  }
  await broadcastStateChanged({ isFocusMode, whitelist });
}

async function handleUpdateSchedule(
  schedule: typeof DEFAULT_STORAGE.schedule,
): Promise<void> {
  await chrome.storage.local.set({ schedule });
  // Re-read storage so scheduleAlarms uses the persisted schedule (enabled flag included).
  await scheduleAlarms();
  await checkImmediateScheduleActivation();
}

async function initializeExtension(): Promise<void> {
  const existing = await chrome.storage.local.get(null);
  const merged = { ...DEFAULT_STORAGE, ...existing };
  await chrome.storage.local.set({
    ...merged,
    isGeneratingReport: false,
  });
  await scheduleAlarms();
  await checkImmediateScheduleActivation();
  const { isFocusMode } = await getStorage();
  await updateActionUi(isFocusMode, isFocusMode ? 'ON' : '');
}

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeExtension();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CLEAR_GUARD_ALARM) {
    void (async () => {
      try {
        await chrome.storage.local.set({ isGeneratingReport: false });
      } catch (e) {
        console.error('clearReportGuard failed', e);
      }
    })();
  }

  if (alarm.name === SCHEDULE_ON_ALARM) {
    void (async () => {
      try {
        const { isFocusMode } = await getStorage();
        if (!isFocusMode) await toggleFocusMode();
        await scheduleAlarms();
      } catch (e) {
        console.error('schedule-on failed', e);
      }
    })();
  }

  if (alarm.name === SCHEDULE_OFF_ALARM) {
    void (async () => {
      try {
        const { isFocusMode } = await getStorage();
        if (isFocusMode) await toggleFocusMode();
        await scheduleAlarms();
      } catch (e) {
        console.error('schedule-off failed', e);
      }
    })();
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-focus') {
    void toggleFocusMode();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      case 'TOGGLE_FOCUS':
        await toggleFocusMode();
        return await handleGetState();
      case 'GET_STATE':
        return await handleGetState();
      case 'GET_FULL_STATE':
        return await getStorage();
      case 'LOG_ATTEMPT':
        await handleLogAttempt(message.domain, message.signal);
        return { ok: true };
      case 'UPDATE_WHITELIST':
        await handleUpdateWhitelist(message.whitelist);
        return { ok: true };
      case 'UPDATE_SCHEDULE':
        await handleUpdateSchedule(message.schedule);
        return {
          ok: true,
          alarmCount: (await chrome.alarms.getAll()).filter((a) =>
            [SCHEDULE_ON_ALARM, SCHEDULE_OFF_ALARM].includes(a.name),
          ).length,
        };
      default:
        return null;
    }
  };

  void handle().then(sendResponse);
  return true;
});

void initializeExtension();
