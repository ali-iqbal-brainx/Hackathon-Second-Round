import { describe, expect, it } from 'vitest';
import { getNextOccurrence, isInScheduledRange, msUntilNextTime } from './schedule';

function at(hours: number, minutes: number): Date {
  return new Date(2026, 5, 10, hours, minutes, 0, 0);
}

describe('isInScheduledRange', () => {
  it('same-day range: active inside window', () => {
    expect(isInScheduledRange('09:00', '17:00', at(12, 0))).toBe(true);
  });

  it('same-day range: inactive before start', () => {
    expect(isInScheduledRange('09:00', '17:00', at(8, 59))).toBe(false);
  });

  it('same-day range: inactive at end boundary', () => {
    expect(isInScheduledRange('09:00', '17:00', at(17, 0))).toBe(false);
  });

  it('same-day range: active at start boundary', () => {
    expect(isInScheduledRange('09:00', '17:00', at(9, 0))).toBe(true);
  });

  it('overnight range: active after start', () => {
    expect(isInScheduledRange('22:00', '06:00', at(23, 0))).toBe(true);
  });

  it('overnight range: active before end', () => {
    expect(isInScheduledRange('22:00', '06:00', at(5, 30))).toBe(true);
  });

  it('overnight range: inactive midday', () => {
    expect(isInScheduledRange('22:00', '06:00', at(12, 0))).toBe(false);
  });

  it('overnight range: inactive at end boundary', () => {
    expect(isInScheduledRange('22:00', '06:00', at(6, 0))).toBe(false);
  });
});

describe('getNextOccurrence', () => {
  it('returns today when time is later the same day', () => {
    const now = at(8, 0);
    const next = getNextOccurrence('09:00', now);
    expect(next).toBe(at(9, 0).getTime());
  });

  it('returns tomorrow when time already passed today', () => {
    const now = at(10, 0);
    const next = getNextOccurrence('09:00', now);
    const tomorrow = at(9, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(next).toBe(tomorrow.getTime());
  });

  it('msUntilNextTime is positive', () => {
    expect(msUntilNextTime('09:00', at(8, 0))).toBe(60 * 60 * 1000);
  });
});
