import { normalizeDomain } from '../types';
import type { FocusState, SignalType } from '../types';

type State = FocusState;
let cachedState: State | null = null;

chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state: State | undefined) => {
  if (state) cachedState = state;
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_CHANGED') {
    cachedState = msg.state as State;
  }
});

function logAttempt(signal: SignalType): void {
  chrome.runtime.sendMessage({
    type: 'LOG_ATTEMPT',
    domain: location.hostname,
    signal,
  });
}

function isBlocked(domain: string): boolean {
  if (cachedState === null) return true;
  if (!cachedState.isFocusMode) return false;
  return !cachedState.whitelist.includes(domain);
}

const originalRequestPermission = Notification.requestPermission.bind(Notification);
Notification.requestPermission = async (
  ...args: Parameters<typeof Notification.requestPermission>
) => {
  const domain = normalizeDomain(location.hostname);
  if (cachedState === null || isBlocked(domain)) {
    if (cachedState !== null && cachedState.isFocusMode) {
      logAttempt('permission');
    }
    return 'denied';
  }
  return originalRequestPermission(...args);
};

const OriginalNotification = Notification;
function PatchedNotification(
  this: Notification,
  title: string,
  options?: NotificationOptions,
) {
  const domain = normalizeDomain(location.hostname);
  if (cachedState === null || isBlocked(domain)) {
    if (cachedState !== null && cachedState.isFocusMode) {
      logAttempt('constructor');
    }
    return {} as Notification;
  }
  return new OriginalNotification(title, options);
}
PatchedNotification.prototype = OriginalNotification.prototype;
PatchedNotification.requestPermission = Notification.requestPermission;
Object.defineProperty(window, 'Notification', {
  configurable: true,
  writable: true,
  value: PatchedNotification,
});

// push_subscribe: best-effort only — subscribe() is usually called inside
// the service worker, not the page, so this rarely fires. Not shown in report UI.
if ('serviceWorker' in navigator) {
  const originalRegister = navigator.serviceWorker.register.bind(
    navigator.serviceWorker,
  );
  navigator.serviceWorker.register = async (
    ...args: Parameters<typeof navigator.serviceWorker.register>
  ) => {
    const registration = await originalRegister(...args);
    const pushManager = registration.pushManager;
    if (pushManager) {
      const originalSubscribe = pushManager.subscribe.bind(pushManager);
      pushManager.subscribe = async (
        ...subArgs: Parameters<typeof pushManager.subscribe>
      ) => {
        const domain = normalizeDomain(location.hostname);
        if (cachedState !== null && cachedState.isFocusMode && isBlocked(domain)) {
          logAttempt('push_subscribe');
          throw new DOMException('Push blocked by Focus Mode', 'NotAllowedError');
        }
        return originalSubscribe(...subArgs);
      };
    }
    return registration;
  };
}
