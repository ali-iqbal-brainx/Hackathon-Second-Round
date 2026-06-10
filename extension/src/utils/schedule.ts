function parseTimeParts(time: string): [number, number] {
  const [hours, minutes] = time.split(':').map(Number);
  return [hours, minutes ?? 0];
}

function parseTime(time: string): number {
  const [hours, minutes] = parseTimeParts(time);
  return hours * 60 + minutes;
}

function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function isInScheduledRange(
  startTime: string,
  endTime: string,
  now: Date,
): boolean {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const current = nowMinutes(now);

  if (end < start) {
    return current >= start || current < end;
  }

  return current >= start && current < end;
}

export function msUntilNextTime(time: string, now: Date): number {
  const [hours, minutes] = parseTimeParts(time);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

/** Absolute epoch ms for the next local-time occurrence of `time` (HH:mm). */
export function getNextOccurrence(time: string, now: Date = new Date()): number {
  return now.getTime() + msUntilNextTime(time, now);
}
