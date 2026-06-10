# Focus Mode Activator

Chrome Manifest V3 extension that toggles Focus Mode to silence notification permission prompts, log interruption intent signals, and open a session report when focus ends.

**Requires Chrome 111+** (`minimum_chrome_version` in manifest) for MAIN-world content scripts.

## Features

- Toolbar popup toggle for Focus Mode ON/OFF
- Blocks notification permission prompts via `chrome.contentSettings` and content-script API interception
- Logs interruption attempts (`permission` and `constructor` signals)
- Session report tab on focus OFF (when attempts > 0 or session > 60 seconds)
- Keyboard shortcut: `Ctrl+Shift+F` / `Cmd+Shift+F`
- Daily auto-schedule with overnight range support
- Domain whitelist (normalized at save time)

## Development

```bash
cd extension
npm install
npm run dev      # HMR — load unpacked from dist/
npm run build    # production build + unit tests
npm test         # run Vitest only
```

### Load in Chrome

1. Run `npm run build` or `npm run dev`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select the `extension/dist` folder

## Known limitations

### contentSettings (global snapshot only)

Before Focus Mode turns ON, the extension snapshots the **global** notification content setting (`<all_urls>`) and restores it when focus ends. Per-domain overrides you set manually in `chrome://settings/content/notifications` are outside our control and may interact unexpectedly with the global block.

### Push / service worker coverage

The report shows **interruption attempts detected**, not confirmed notification blocks. Push subscriptions initiated inside service workers may not be detected. The report UI includes this disclaimer.

`push_subscribe` is intercepted best-effort in the content script but is not shown in the report table because coverage is too limited.

### Report tab gate

If a session has zero UI-relevant attempts and lasted 60 seconds or less, no report tab opens. The toolbar badge shows `0` and the tooltip explains there were no attempts.

### Network blocking (DNR)

Aggressive declarativeNetRequest rules for push endpoints are **not enabled** by default. They may break unrelated app traffic and are deferred as an optional future enhancement.

## Project structure

```
extension/
├── manifest.json
├── src/
│   ├── background/background.ts   # toggle, storage, alarms, messaging
│   ├── content/content.ts         # MAIN-world API patches
│   ├── popup/                     # React popup UI
│   ├── report/                    # React session report
│   ├── types/                     # shared types + normalizeDomain
│   └── utils/                     # schedule helpers + tests
└── public/icons/
```
