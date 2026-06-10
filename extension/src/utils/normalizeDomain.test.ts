import { describe, expect, it } from 'vitest';
import { normalizeDomain } from '../types';

describe('normalizeDomain', () => {
  it('strips protocol, www, path, query, and lowercases', () => {
    expect(normalizeDomain('https://www.YouTube.com/watch?v=123')).toBe(
      'youtube.com',
    );
  });

  it('strips www from bare hostname', () => {
    expect(normalizeDomain('www.Gmail.com')).toBe('gmail.com');
  });

  it('strips path only', () => {
    expect(normalizeDomain('calendar.google.com/events')).toBe(
      'calendar.google.com',
    );
  });

  it('handles http and uppercase', () => {
    expect(normalizeDomain('HTTP://EXAMPLE.COM/path?q=1')).toBe('example.com');
  });
});
