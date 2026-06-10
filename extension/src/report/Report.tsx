import { useEffect, useState } from 'react';
import {
  type LastSession,
  aggregateByDomain,
  countUiAttempts,
  getDistractionLevel,
} from '../types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

function levelClass(level: string): string {
  if (level === 'High') return 'badge-high';
  if (level === 'Medium') return 'badge-medium';
  return 'badge-low';
}

export function Report() {
  const [lastSession, setLastSession] = useState<LastSession | null | undefined>(
    undefined,
  );
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    void chrome.storage.local
      .get(['lastSession', 'isFocusMode'])
      .then(({ lastSession: session, isFocusMode: focus }) => {
        setLastSession(session ?? null);
        setIsFocusMode(Boolean(focus));
      });
  }, []);

  if (lastSession === undefined) {
    return (
      <div className="report">
        <p className="muted">Loading report…</p>
      </div>
    );
  }

  if (lastSession === null) {
    const message = isFocusMode
      ? 'Focus Mode is still active. End your session to see the report.'
      : 'No interruption attempts detected this session.';
    return (
      <div className="report">
        <h1>Focus Session Report</h1>
        <div className="empty-state">
          <p>{message}</p>
        </div>
        <p className="disclaimer">
          Push subscriptions initiated inside service workers may not be
          detected.
        </p>
      </div>
    );
  }

  const uiAttempts = countUiAttempts(lastSession.blockedLog);
  const duration = lastSession.sessionEnd - lastSession.sessionStart;
  const byDomain = aggregateByDomain(lastSession.blockedLog);
  const rows = [...byDomain.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="report">
      <h1>Focus Session Report</h1>
      <p className="muted">
        {uiAttempts} interruption attempt{uiAttempts === 1 ? '' : 's'}{' '}
        detected
      </p>

      <div className="summary-grid">
        <div className="stat-card">
          <div className="muted">Duration</div>
          <div className="stat-value">{formatDuration(duration)}</div>
        </div>
        <div className="stat-card">
          <div className="muted">Attempts</div>
          <div className="stat-value">{uiAttempts}</div>
        </div>
        <div className="stat-card">
          <div className="muted">Started</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
            {formatTime(lastSession.sessionStart)}
          </div>
        </div>
        <div className="stat-card">
          <div className="muted">Ended</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
            {formatTime(lastSession.sessionEnd)}
          </div>
        </div>
      </div>

      <h2>Sites that tried to reach you</h2>
      {rows.length === 0 ? (
        <p className="muted">No interruption attempts detected this session.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Attempts</th>
              <th>Distraction score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([domain, count]) => {
              const level = getDistractionLevel(count);
              return (
                <tr key={domain}>
                  <td>{domain}</td>
                  <td>{count}</td>
                  <td className={levelClass(level)}>{level}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="disclaimer">
        Push subscriptions initiated inside service workers may not be detected.
      </p>
    </div>
  );
}
