# Focus mode activator project overview
_Exported on 10/06/2026 at 17:24:30 GMT+5 from Cursor (2.6.14)_

---

**User**

@frontend 
**Project: Focus Mode Activator — Chrome Extension**

Do not write any code yet. Read this fully and understand the scope so we can plan together.

---

**Tech Stack**

- Chrome Extension Manifest V3
- React + TypeScript — for popup UI and report page
- Vite + CRXJS — bundles React into static files the extension can load
- `chrome.storage.local` — replaces any database, stores all session data
- No backend, no server, no database needed

---

**What It Does**

A Chrome extension with a toolbar icon. User clicks it to toggle Focus Mode ON or OFF.

- **When ON** → all browser notifications from all sites are silenced. A list is maintained in the background tracking every site that tried to send a notification and how many times.
- **When OFF** → a full report tab automatically opens showing everything that was blocked during that session.

---

**The Report Tab**

When the user turns Focus Mode OFF, `chrome.tabs.create()` opens a dedicated full-page report. It shows:

- Total session duration
- Total notifications blocked
- A table of every site that tried to notify, with attempt count
- A distraction score per site (High / Medium / Low based on attempt count)
- Session start and end time

---

**All Features**

1. Toolbar icon toggles Focus Mode ON/OFF
2. While ON, block all notification permissions and push notifications via `chrome.contentSettings`
3. Log every blocked attempt — store domain + timestamp in `chrome.storage.local`
4. On toggle OFF, open a full report tab pulling data from storage
5. Keyboard shortcut to toggle Focus Mode without opening the popup
6. Auto-schedule: user sets daily hours, extension activates automatically using `chrome.alarms`
7. Per-domain distraction score in the report (calculated from attempt count)
8. Whitelist: certain sites marked safe are never blocked

---

**Chrome APIs Reference**

| Feature | Chrome API | Purpose |
|---|---|---|
| Block notifications | `chrome.contentSettings` | Deny notification permission globally while focus is ON |
| Block push endpoints | `chrome.declarativeNetRequest` | Block network-level push notification requests |
| Store session data | `chrome.storage.local` | Persist logs, whitelist, schedule, focus state |
| Open report tab | `chrome.tabs.create()` | Open full report page when focus turns OFF |
| Keyboard shortcut | `chrome.commands` | Toggle focus ON/OFF without opening popup |
| Auto-schedule | `chrome.alarms` | Fire ON/OFF triggers at user-set daily times |
| Intercept permission calls | Content Script | Override `Notification.requestPermission()` at page level |
| Toolbar icon state | `chrome.action` | Swap icon between on/off state, update badge text |
| Cross-context messaging | `chrome.runtime.sendMessage` | Popup and content scripts communicate with background |

---

**File Structure**

```
focus-mode-extension/
├── manifest.json
├── vite.config.ts
├── src/
│   ├── background/
│   │   └── background.ts        ← core logic, blocking, logging
│   ├── popup/
│   │   ├── Popup.tsx             ← toggle UI, whitelist, schedule settings
│   │   └── popup.html
│   ├── report/
│   │   ├── Report.tsx            ← full session report page
│   │   └── report.html
│   ├── content/
│   │   └── content.ts            ← intercepts notification permission requests
│   └── types/
│       └── index.ts              ← shared TS types
├── public/
│   └── icons/
│       ├── icon-on.png
│       └── icon-off.png
└── rules/
    └── block_rules.json          ← declarativeNetRequest rules
```

---

**Data Shapes (chrome.storage.local)**

```ts
// Focus state
{
  isFocusMode: boolean,
  sessionStart: number        // timestamp
}

// Blocked attempts log
{
  blockedLog: [
    { domain: string, timestamp: number }
  ]
}

// Whitelist
{
  whitelist: string[]         // e.g. ["gmail.com", "calendar.google.com"]
}

// Schedule
{
  schedule: {
    enabled: boolean,
    startTime: string,        // e.g. "09:00"
    endTime: string           // e.g. "12:00"
  }
}
```

---

**Core Flow**

```
User clicks toolbar icon
→ Popup.tsx sends message to background.ts
→ background.ts sets isFocusMode: true in storage
→ contentSettings blocks notification permissions globally
→ Every blocked attempt logged to chrome.storage.local

User clicks icon again
→ background.ts sets isFocusMode: false
→ chrome.tabs.create() opens report/report.html
→ Report.tsx reads session data from storage and renders report
→ Storage cleared, ready for next session

Auto-schedule:
→ chrome.alarms fires at user-set start time → triggers focus ON
→ chrome.alarms fires at user-set end time → triggers focus OFF + opens report

Keyboard shortcut:
→ chrome.commands listener in background.ts
→ Same toggle logic as clicking the toolbar icon

Whitelist check:
→ Before logging or blocking, background.ts checks domain against whitelist
→ If domain is whitelisted, skip blocking entirely
```

---

**Distraction Score Logic**

```
1  - 3 attempts  → 🟢 Low
4  - 9 attempts  → 🟡 Medium
10+ attempts     → 🔴 High
```

---

**Known Technical Challenges**

1. **MV3 Service Worker** — background.ts runs as a service worker, it can sleep and lose state. Any in-memory data must be persisted to `chrome.storage.local` immediately.
2. **Push notification blocking** — `contentSettings` blocks permission prompts but already-granted sites can still push. `declarativeNetRequest` rules may be needed to block push endpoints.
3. **CRXJS + Vite config** — needs proper setup to output multiple entry points (popup, report, background, content script) correctly.
4. **Content script scope** — `content.ts` runs per page, needs to intercept `Notification.requestPermission()` calls at the page level.
5. **chrome.commands in manifest** — keyboard shortcut must be declared in `manifest.json` under the `commands` key, not just in code.
6. **chrome.alarms precision** — alarms have a minimum delay of 1 minute, not suitable for second-level precision but fine for scheduled hours.

---

**What I Want From You**

Do not write any code. I want you to:

1. Confirm you understand the full scope
2. Flag any challenges or limitations with this stack and MV3
3. Suggest a build order — which file or feature to tackle first
4. Ask me any clarifying questions before we begin

---

---

**Cursor**

Reviewing the frontend codebase to see what's already in place, then drafting a plan that covers scope, MV3 constraints, build order, and open questions.


The `frontend` folder is a standard React+Vite web app with no extension code yet. Asking two decisions that will shape the plan:


**Focus Mode Extension — Planning Decisions**

> **Where should the Chrome extension live? The current `frontend/` is a React web app (auth, router, axios).**
> - Replace/restructure `frontend/` entirely into the extension project
> - Create `frontend/focus-mode-extension/` alongside the existing web app
> - Create a new top-level folder (e.g. `focus-mode-extension/` at repo root)
>
> Answer: Create a new /extension folder at the root level, separate from /frontend and /backend. This is where the entire Chrome extension lives. It has its own package.json, its own vite.config.ts, and its own manifest.json. Do not touch the /frontend or /backend folders.

> **Chrome cannot reliably observe every real push notification from sites that already have permission (no MV3 event for "web notification blocked"). How should we handle the blocked-attempt log?**
> - Best-effort: log permission prompts + `new Notification()` via content script; document push-blocking as silent (counts may be under-reported)
> - Aggressive proxy: content script replaces `window.Notification` entirely and logs every construction attempt (still misses SW push)
> - MVP: only log `Notification.requestPermission()` calls; skip counting actual push deliveries
>
> Answer: We cannot reliably intercept already-delivered push notifications in MV3. Instead, the blocked-attempt log should track notification intent signals, not confirmed blocks. These signals are:

Permission requests — site called Notification.requestPermission() → log it
Service worker push registration — site called pushManager.subscribe() → log it
Notification constructor calls — site called new Notification(...) → content.ts overrides this and logs + cancels it

This means the report shows "these sites tried to reach you" not "these exact notifications were blocked." The UI copy should reflect this honestly:
Instead of: 47 notifications blocked
Say: 47 interruption attempts detected

Creating the plan from your decisions: a root-level `/extension` folder and intent-based logging with honest report copy.


---

**User**

1- Before setting up Vite + CRXJS, confirm which version of CRXJS supports our Vite version. If CRXJS is incompatible, use vite-plugin-web-extension instead — it is actively maintained and supports Vite 5+ with React and multiple entry points.
2- Add a Chrome version check in manifest.json using "minimum_chrome_version": "111". This prevents the extension from loading on unsupported versions rather than silently failing.
3- Document this gap clearly in the report UI. Add a one-line note under the report: "Push subscriptions initiated inside service workers may not be detected." Do not overstate coverage.
4- Before applying the global block on focus ON, snapshot the current contentSettings state and save it to chrome.storage.local. On focus OFF, restore from that snapshot instead of blindly setting everything back to allow.
5- In toggleFocusMode(), add a guard flag isGeneratingReport: boolean in storage. Set it to true before opening the report tab, set it back to false after. If isGeneratingReport is already true, skip the chrome.tabs.create() call.
6- Move the storage clear responsibility from Report.tsx to background.ts. When focus turns OFF, background should immediately snapshot the session data into a separate lastSession key, clear the live session keys, then open the report tab. Report reads from lastSession instead of live session keys.
7- The domain normalizer in types/index.ts must handle all these cases:

Strip protocol (https://, http://)
Strip www.
Strip paths and query strings (everything after first /)
Lowercase the result
Test cases: https://www.YouTube.com/watch?v=123 → youtube.com
8- In the alarm scheduling logic, handle overnight ranges explicitly:
if endTime < startTime → range crosses midnight
  active when: currentTime >= startTime OR currentTime < endTime
if endTime > startTime → same day range
  active when: currentTime >= startTime AND currentTime < endTime
Write this as a standalone isInScheduledRange(start, end, now) utility function and unit test it.
9- Do not block FCM (fcm.googleapis.com) or Mozilla push endpoints broadly. Instead, only block the specific push subscription registration endpoints, not all traffic to those domains. Or better — leave DNR rules as a Phase 6 enhancement with a clear warning in the UI that aggressive network blocking may break some apps.
10- Handle the empty state in Report.tsx from the beginning, not Phase 10. A report tab that opens blank with no explanation looks like a bug. Show: "No interruption attempts detected this session." from day one.
11- In manifest.json, define the keyboard shortcut as a custom named command, not _execute_action:
json"commands": {
  "toggle-focus": {
    "suggested_key": { "default": "Ctrl+Shift+F" },
    "description": "Toggle Focus Mode"
  }
}
Then listen for "toggle-focus" in chrome.commands.onCommand in background.ts.

Before writing any code, apply these corrections to the plan:

Verify CRXJS + Vite version compatibility, use vite-plugin-web-extension as fallback
Add "minimum_chrome_version": "111" to manifest.json
Add service worker push gap disclaimer to report UI
Snapshot contentSettings before focus ON, restore from snapshot on OFF
Add isGeneratingReport guard to prevent double report tabs
Move storage clear to background.ts using a lastSession key pattern
Strengthen domain normalizer to handle full URLs not just hostnames
Implement isInScheduledRange() utility handling overnight ranges
Do not broadly block FCM — only target push subscription endpoints or defer DNR to later
Implement empty state in Report.tsx from Phase 5, not Phase 10
Use a custom named command "toggle-focus" not "_execute_action" in manifest commands

---

**Cursor**

Verifying CRXJS/Vite compatibility, then updating the plan with your 11 corrections.


Updating the plan document with all 11 corrections.


All 11 corrections are in the plan. Summary of what changed:

### Build tooling (item 1)
**CRXJS is compatible** with our target stack: `@crxjs/vite-plugin@2.4.0` peers on Vite `^3` through `^8`. Phase 1 starts with a smoke build before app code. If that fails, we switch to **`vite-plugin-web-extension`** (React plugin first, then web-extension plugin).

### Manifest (items 2 & 11)
- `"minimum_chrome_version": "111"` for MAIN-world content scripts
- Custom command `"toggle-focus"` with `Ctrl+Shift+F` / `Cmd+Shift+F` — **not** `_execute_action`

### Report UI (items 3 & 10)
- Empty state from **Phase 5**: *"No interruption attempts detected this session."*
- Persistent disclaimer: *"Push subscriptions initiated inside service workers may not be detected."*

### Background session lifecycle (items 4, 5, 6)
- **contentSettings snapshot** before focus ON; restore from snapshot on OFF (no blind global `allow`)
- **`isGeneratingReport`** guard to avoid duplicate report tabs
- **Background owns storage**: on OFF → write `lastSession` → clear live session → open report. **Report.tsx is read-only** (reads `lastSession` only)

### Utilities (items 7 & 8)
- **`normalizeDomain()`** handles protocol, `www`, paths, query strings, lowercase — with unit tests including `https://www.YouTube.com/watch?v=123` → `youtube.com`
- **`isInScheduledRange(start, end, now)`** with explicit overnight vs same-day logic — unit tested with Vitest

### DNR (item 9)
- **No broad FCM/Mozilla blocking** in MVP
- DNR moved to **Phase 9 optional** — narrow subscription-endpoint rules only, plus popup warning about aggressive blocking

### Updated build order
Phases reordered: Whitelist → Commands → Schedule → optional DNR → Polish (empty state removed from polish; icons/README remain).

The full updated plan is at `.cursor/plans/focus_mode_extension_4359c3ce.plan.md`. Say when you want to start implementation.

---

**User**

1- chrome.contentSettings.notifications.get() only accepts a single URL, not a wildcard. You cannot read all existing per-domain settings at once. Change the snapshot strategy:

Only snapshot the global default setting (<all_urls>)
On restore, set global default back to what it was
Accept that per-domain overrides the user had manually set in Chrome settings are outside our control
Document this limitation in README
2- Add a timeout reset for isGeneratingReport. After setting it to true, schedule a fallback:
tssetTimeout(() => {
  chrome.storage.local.set({ isGeneratingReport: false });
}, 5000);
Also on extension startup (chrome.runtime.onStartup and onInstalled), always reset isGeneratingReport to false.
3- In Report.tsx, when lastSession is null, show two different messages:

If isFocusMode is currently ON → "Focus Mode is still active. End your session to see the report."
If isFocusMode is OFF and no data → "No interruption attempts detected this session."
4- In content.ts, patch the APIs immediately on inject regardless of focus state. Then send GET_STATE to background. If focus is OFF, the patches become pass-throughs. This avoids the race condition where a notification fires before the state check resolves:
ts// Patch immediately, decide behavior after state resolves
const originalRequestPermission = Notification.requestPermission.bind(Notification);
Notification.requestPermission = async (...args) => {
  const state = await getState(); // GET_STATE message
  if (state.isFocusMode && !state.whitelist.includes(domain)) {
    logAttempt('permission');
    return 'denied';
  }
  return originalRequestPermission(...args);
};
5- Before opening the report tab, check if blockedLog.length > 0 OR if session duration was more than 60 seconds. If neither condition is met, skip opening the report tab and just reset state silently. Optionally show a badge message like "No attempts" instead.
6- In Phase 2, add a placeholder whitelist check in LOG_ATTEMPT handler:
tsconst { whitelist } = await chrome.storage.local.get('whitelist');
if ((whitelist ?? []).includes(normalizeDomain(domain))) return;
This is safe even before the whitelist UI exists — it just reads an empty array.
7- In scheduleAlarms() and chrome.runtime.onStartup, after setting up alarms, immediately call isInScheduledRange() with the current time. If we are inside a scheduled window and focus is currently OFF, auto-activate focus mode right away.
8- Remove push_subscribe from the reported signal types in the UI to avoid showing a metric that will always be zero. Keep the interception attempt in code as best-effort, but only surface permission and constructor signals in the report table. Add a code comment explaining why push_subscribe coverage is limited.

---

**Cursor**

Updating the plan with all eight refinements.


All eight refinements are in the plan. Summary:

### 1. contentSettings snapshot (global only)
Only snapshot/restore the **global default** (`<all_urls>`). Per-domain overrides in Chrome settings are out of scope — documented in README.

### 2. `isGeneratingReport` resilience
- 5-second `setTimeout` fallback to reset the flag
- Always reset to `false` on `chrome.runtime.onStartup` and `onInstalled`

### 3. Report dual empty states
When `lastSession` is null:
- Focus still ON → *"Focus Mode is still active. End your session to see the report."*
- Focus OFF, no data → *"No interruption attempts detected this session."*

### 4. Content script race fix
Patch APIs **on inject**; each call awaits `GET_STATE` and pass-throughs when focus is OFF or domain is whitelisted.

### 5. Report tab gate
Open report only if **UI attempts > 0** (permission + constructor) **OR session > 60 seconds**. Otherwise silent reset + optional `"No attempts"` badge.

### 6. Whitelist in Phase 2
`LOG_ATTEMPT` checks `whitelist` (empty array safe) before logging — no UI required yet.

### 7. Schedule immediate activation
After `scheduleAlarms()` and on startup/install: if schedule enabled, inside range, and focus OFF → auto-activate.

### 8. `push_subscribe` hidden from UI
Still logged best-effort in code (with SW coverage comment), but report counts/table only use **`permission`** and **`constructor`**.

Ready to implement when you are.

---

**User**

1- Replace the setTimeout fallback for isGeneratingReport with a chrome.alarms one-shot alarm instead:
tschrome.alarms.create('clearReportGuard', { delayInMinutes: 1 });
In the alarm handler, check if alarm name is clearReportGuard and reset isGeneratingReport: false. This survives SW sleep. Delete the setTimeout approach entirely.
2- Cache the focus state locally inside the content script. On inject, fetch state once and store it in a local variable. Listen for state-change messages from background to update the cache:
tslet cachedState = { isFocusMode: false, whitelist: [] };
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
  cachedState = state;
});
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_CHANGED') cachedState = msg.state;
});
Background broadcasts STATE_CHANGED whenever toggleFocusMode() runs. Use cachedState in the patches instead of awaiting GET_STATE each time.
3- Normalize whitelist entries once at save time (when user adds a domain in the popup), not at read time. Store them already normalized in chrome.storage.local. Then the check becomes simply:
tswhitelist.includes(normalizeDomain(domain))
4- Make sure lastSession write fully resolves before opening the tab:
tsawait chrome.storage.local.set({ lastSession: ... });
await chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
Both must be awaited in sequence, not fired in parallel.
5- Use short badge text only. Replace "No attempts" with "—" or "0". Use chrome.action.setTitle() to set the full tooltip text "No interruption attempts this session" which appears on hover.
6- In the schedule UI, before saving to storage, validate:

Both startTime and endTime must be non-empty
They must not be equal to each other
Show an inline error message if validation fails, do not save

---

**Cursor**

Updating the plan with these six refinements.


All six refinements are in the plan. Summary:

### 1. `isGeneratingReport` fallback → `chrome.alarms`
Replaced `setTimeout` with a one-shot alarm:
```ts
chrome.alarms.create('clearReportGuard', { delayInMinutes: 1 });
```
Handler resets `isGeneratingReport: false` when `alarm.name === 'clearReportGuard'`. Cancel the alarm when the report flow completes successfully. Survives service worker sleep.

### 2. Content script cached state
- On inject: one `GET_STATE` → `cachedState`
- Listen for `STATE_CHANGED` from background
- Background broadcasts `STATE_CHANGED` after every `toggleFocusMode()`
- Patches use `cachedState` synchronously (no per-call await)

### 3. Whitelist normalize at save time
Popup runs `normalizeDomain()` when adding domains. Storage holds pre-normalized values. Read-time check:
```ts
whitelist.includes(normalizeDomain(domain))
```

### 4. Sequential `lastSession` + tab open
```ts
await chrome.storage.local.set({ lastSession: ... });
await chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
```

### 5. Badge vs tooltip
- Badge: `"0"` or `"—"` only
- Full message via `chrome.action.setTitle({ title: 'No interruption attempts this session' })`

### 6. Schedule UI validation
Before save: both times non-empty, `startTime !== endTime`. Inline error on failure; do not write to storage.

Ready to implement when you say go.

---

**User**

1- Wrap the STATE_CHANGED broadcast in a try-catch. It is fire-and-forget — errors should be silently swallowed:
tstry {
  chrome.runtime.sendMessage({ type: 'STATE_CHANGED', state: { isFocusMode, whitelist } });
} catch (_) {}
Also use chrome.tabs.query to broadcast to all content scripts via chrome.tabs.sendMessage instead of chrome.runtime.sendMessage — content scripts don't receive runtime.sendMessage from background in MV3.
2- In background.ts, after every toggleFocusMode(), broadcast to all tabs like this:
tsconst tabs = await chrome.tabs.query({});
for (const tab of tabs) {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'STATE_CHANGED',
      state: { isFocusMode, whitelist }
    }).catch(() => {}); // tab may not have content script
  }
}
The .catch(() => {}) silently ignores tabs without content scripts injected.
3- Initialize cachedState as null instead of { isFocusMode: false }. In the patched APIs, if cachedState is null, block by default until state resolves:
tslet cachedState: State | null = null;

Notification.requestPermission = async (...args) => {
  if (cachedState === null) return 'denied'; // block until state known
  if (cachedState.isFocusMode && !cachedState.whitelist.includes(domain)) {
    logAttempt('permission');
    return 'denied';
  }
  return originalRequestPermission(...args);
};
4- In the alarm listener, always handle each alarm name in its own isolated try-catch block:
tschrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'clearReportGuard') {
    try { await chrome.storage.local.set({ isGeneratingReport: false }); }
    catch (e) { console.error('clearReportGuard failed', e); }
  }
  if (alarm.name === 'schedule-on') {
    try { await toggleFocusMode(); }
    catch (e) { console.error('schedule-on failed', e); }
  }
  // etc.
});
5- The isFocusMode === true null state is only meaningful when someone manually navigates to report.html while focus is still ON. Keep the check but read isFocusMode directly from chrome.storage.local on mount — not from lastSession. The two reads happen independently:
tsconst { lastSession, isFocusMode } = await chrome.storage.local.get(['lastSession', 'isFocusMode']);
This way the null state messages are always accurate regardless of how the report page was opened.

---

**Cursor**

Updating the plan with these five messaging, state-cache, alarm, and report-read refinements.


All five refinements are in the plan. Summary:

### 1–2. `STATE_CHANGED` via `tabs.sendMessage`
- Replaced `chrome.runtime.sendMessage` with `broadcastStateChanged()` using `chrome.tabs.query({})` + per-tab `chrome.tabs.sendMessage`
- Per-tab `.catch(() => {})` for tabs without content scripts
- Outer `try/catch` on the whole broadcast — fire-and-forget, errors swallowed
- Called after every `toggleFocusMode()`

### 3. `cachedState` starts `null`
- `let cachedState: State | null = null`
- While `null`, patched APIs **block by default** (`return 'denied'`) until `GET_STATE` resolves
- Same null guard on `Notification` constructor

### 4. Isolated alarm try-catch
- Each alarm name (`clearReportGuard`, `schedule-on`, `schedule-off`) in its own `try/catch` with `console.error` on failure

### 5. Report independent storage reads
```ts
const { lastSession, isFocusMode } = await chrome.storage.local.get(['lastSession', 'isFocusMode']);
```
- `isFocusMode === true` + null `lastSession` covers manual navigation to `report.html` mid-session
- Two keys read independently — not derived from each other

Ready to implement when you give the go-ahead.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Implementing the Focus Mode extension per the plan. Starting with Phase 1 scaffold.


Creating the extension scaffold and core files.


The Focus Mode Activator extension is implemented in [`extension/`](extension/). All todos are complete.

## What was built

**Scaffold** — Vite 6 + `@crxjs/vite-plugin@2.4.0` (smoke build passed; no fallback needed), TypeScript, Vitest with 12 passing tests.

**Background** ([`extension/src/background/background.ts`](extension/src/background/background.ts))
- `toggleFocusMode()` with global `contentSettings` snapshot/restore
- `isGeneratingReport` guard + `clearReportGuard` one-shot alarm (1 min)
- Report gate: opens tab only if UI attempts > 0 or session > 60s
- Sequential `await set(lastSession)` → `await tabs.create()`
- `broadcastStateChanged()` via `tabs.query` + `tabs.sendMessage`
- `LOG_ATTEMPT` with whitelist check; `GET_STATE` / `GET_FULL_STATE`
- `toggle-focus` command; schedule alarms with isolated try/catch per alarm
- Startup/install: reset guard, schedule alarms, immediate range check

**Content script** ([`extension/src/content/content.ts`](extension/src/content/content.ts))
- MAIN world patches on inject; `cachedState: null` blocks until state loads
- `STATE_CHANGED` listener; permission + constructor logging
- Best-effort `push_subscribe` (not in report UI)

**Popup** ([`extension/src/popup/Popup.tsx`](extension/src/popup/Popup.tsx))
- Focus toggle, live attempt count, whitelist (normalize on save)
- Schedule UI with validation (non-empty, not equal times)

**Report** ([`extension/src/report/Report.tsx`](extension/src/report/Report.tsx))
- Independent reads of `lastSession` + `isFocusMode`
- Dual empty states, distraction scores, SW push disclaimer

**DNR** — Deferred per plan; limitations documented in README.

## Load in Chrome

```bash
cd extension
npm install
npm run build
```

Then **Load unpacked** from `extension/dist/` in `chrome://extensions` (Chrome 111+).

## Quick test flow

1. Click extension icon → **Turn Focus Mode ON**
2. Visit a site and trigger a notification permission prompt → attempt logged
3. Turn **OFF** → report tab opens (if attempts or session > 60s)
4. Try `Ctrl+Shift+F` / `Cmd+Shift+F` to toggle without opening popup

---

**User**

After clicking "Save schedule", chrome.alarms.getAll() returns empty. Check that scheduleAlarms() is being called in the popup after saving to storage, and that it correctly creates alarms using chrome.alarms.create() with the right when timestamp based on the next occurrence of startTime in local time.

---

**Cursor**

Investigating the schedule alarm flow from popup save through `scheduleAlarms()`.


Identifying issues: `scheduleAlarms()` uses `delayInMinutes` (Chrome prefers `when` for sub-minute scheduling) and may exit early when `schedule.enabled` is false. Switching to `when` timestamps and hardening alarm creation.


Fixed. Here’s what was going wrong and what changed:

### Root cause
`scheduleAlarms()` was using `delayInMinutes` instead of absolute `when` timestamps. Chrome’s alarm API is more reliable with `when` for scheduled local times (and `delayInMinutes` has a 1-minute minimum, which can skew or fail scheduling).

The popup → background path was already correct:
`Save schedule` → `UPDATE_SCHEDULE` → `handleUpdateSchedule()` → `scheduleAlarms()`

Alarms were also skipped when **`Enabled` was unchecked** (`schedule.enabled === false`), which clears alarms and returns early.

### Fixes

1. **`getNextOccurrence()`** in [`extension/src/utils/schedule.ts`](extension/src/utils/schedule.ts) — computes the next local `HH:mm` as an epoch timestamp.

2. **`scheduleAlarms()`** now creates alarms with `when`:
```ts
await chrome.alarms.create('schedule-on', { when: getNextOccurrence(schedule.startTime, now) });
await chrome.alarms.create('schedule-off', { when: getNextOccurrence(schedule.endTime, now) });
```

3. **Validation** — skips creation if `startTime`/`endTime` are missing, with a console warning.

4. **Popup** — explicit schedule payload on save; hint when disabled; error if `enabled` is true but no alarms were created.

### How to verify
1. Rebuild/reload the extension from `extension/dist`
2. Check **Enabled**, set start/end times, click **Save schedule**
3. In the service worker console:
   ```js
   chrome.alarms.getAll(console.log)
   ```
   You should see `schedule-on` and `schedule-off` with future `scheduledTime` values matching the next local occurrences of your start/end times.

