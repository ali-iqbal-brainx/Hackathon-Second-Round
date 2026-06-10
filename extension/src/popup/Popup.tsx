import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SCHEDULE,
  type Schedule,
  type StorageState,
  countUiAttempts,
  normalizeDomain,
} from '../types';

function validateSchedule(schedule: Schedule): string | null {
  if (!schedule.startTime || !schedule.endTime) {
    return 'Start and end times are required.';
  }
  if (schedule.startTime === schedule.endTime) {
    return 'Start and end times cannot be the same.';
  }
  return null;
}

export function Popup() {
  const [state, setState] = useState<StorageState | null>(null);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = (await chrome.runtime.sendMessage({
      type: 'GET_FULL_STATE',
    })) as StorageState;
    setState(data);
    setSchedule(data.schedule ?? DEFAULT_SCHEDULE);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleFocus = async () => {
    await chrome.runtime.sendMessage({ type: 'TOGGLE_FOCUS' });
    await refresh();
  };

  const addWhitelist = async () => {
    if (!state || !whitelistInput.trim()) return;
    const domain = normalizeDomain(whitelistInput);
    if (!domain || state.whitelist.includes(domain)) {
      setWhitelistInput('');
      return;
    }
    const whitelist = [...state.whitelist, domain];
    await chrome.runtime.sendMessage({ type: 'UPDATE_WHITELIST', whitelist });
    setWhitelistInput('');
    await refresh();
  };

  const removeWhitelist = async (domain: string) => {
    if (!state) return;
    const whitelist = state.whitelist.filter((d) => d !== domain);
    await chrome.runtime.sendMessage({ type: 'UPDATE_WHITELIST', whitelist });
    await refresh();
  };

  const saveSchedule = async () => {
    const error = validateSchedule(schedule);
    if (error) {
      setScheduleError(error);
      return;
    }
    setScheduleError(null);
    const result = (await chrome.runtime.sendMessage({
      type: 'UPDATE_SCHEDULE',
      schedule: {
        enabled: schedule.enabled,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    })) as { ok?: boolean; alarmCount?: number } | undefined;
    if (result?.alarmCount === 0 && schedule.enabled) {
      setScheduleError('Schedule saved but no alarms were created. Try again.');
    }
    await refresh();
  };

  if (loading || !state) {
    return (
      <div className="popup">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const uiAttempts = countUiAttempts(state.blockedLog ?? []);

  return (
    <div className="popup">
      <h1>Focus Mode</h1>
      <p className="muted">
        {state.isFocusMode
          ? 'Notifications are silenced. Interruption attempts are being logged.'
          : 'Turn on Focus Mode to block notification prompts.'}
      </p>

      <button
        type="button"
        className={`toggle-btn ${state.isFocusMode ? 'on' : ''}`}
        onClick={() => void toggleFocus()}
      >
        {state.isFocusMode ? 'Turn Focus Mode OFF' : 'Turn Focus Mode ON'}
      </button>

      <div className="stats">
        <div className="stat-card">
          <div className="muted">Status</div>
          <div className="stat-value">{state.isFocusMode ? 'ON' : 'OFF'}</div>
        </div>
        <div className="stat-card">
          <div className="muted">Attempts</div>
          <div className="stat-value">{uiAttempts}</div>
        </div>
      </div>

      <div className="section">
        <h2>Whitelist</h2>
        <p className="muted">Safe domains are never blocked.</p>
        <div className="row">
          <input
            type="text"
            placeholder="e.g. gmail.com"
            value={whitelistInput}
            onChange={(e) => setWhitelistInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addWhitelist()}
          />
          <button type="button" onClick={() => void addWhitelist()}>
            Add
          </button>
        </div>
        <ul className="tag-list">
          {state.whitelist.map((domain) => (
            <li key={domain} className="tag">
              {domain}
              <button
                type="button"
                aria-label={`Remove ${domain}`}
                onClick={() => void removeWhitelist(domain)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h2>Auto-schedule</h2>
        <div className="schedule-row">
          <label>
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) =>
                setSchedule({ ...schedule, enabled: e.target.checked })
              }
            />
            Enabled
          </label>
        </div>
        {!schedule.enabled && (
          <p className="muted">Enable the schedule to create focus alarms.</p>
        )}
        <div className="row">
          <input
            type="time"
            value={schedule.startTime}
            onChange={(e) =>
              setSchedule({ ...schedule, startTime: e.target.value })
            }
          />
          <input
            type="time"
            value={schedule.endTime}
            onChange={(e) =>
              setSchedule({ ...schedule, endTime: e.target.value })
            }
          />
        </div>
        {scheduleError && <p className="error">{scheduleError}</p>}
        <button
          type="button"
          className="toggle-btn"
          style={{ marginTop: 8 }}
          onClick={() => void saveSchedule()}
        >
          Save schedule
        </button>
      </div>
    </div>
  );
}
