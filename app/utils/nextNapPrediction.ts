import type { TimerSession } from '@/app/utils/timerHistory';

const WAKE_WINDOW_MINUTES: Record<number, number> = {
  1: 270,
  2: 180,
  3: 135,
  4: 105,
  5: 75,
};

const DEFAULT_NAP_COUNT = 3;
const MAX_FORWARD_STEPS = 3;

export const getWakeWindowMinutes = (dailyNapCount: number): number => {
  const count = Math.min(5, Math.max(1, dailyNapCount));
  return WAKE_WINDOW_MINUTES[count] ?? WAKE_WINDOW_MINUTES[DEFAULT_NAP_COUNT];
};

export const normalizeDailyNapCount = (count: number | null | undefined): number => {
  if (count == null || count < 1 || count > 5) {
    return DEFAULT_NAP_COUNT;
  }
  return count;
};

export const getBabyDisplayName = (babyName: string | null | undefined): string => {
  const trimmed = babyName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Baby';
};

export const predictNextNap = (
  dailyNapCount: number,
  timerSessions: TimerSession[],
  now: Date = new Date()
): Date => {
  const wakeWindowMs = getWakeWindowMinutes(dailyNapCount) * 60 * 1000;

  const lastSubmitted = timerSessions
    .filter((session) => session.end_time)
    .sort(
      (a, b) =>
        new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
    )[0];

  let nextNap = lastSubmitted
    ? new Date(new Date(lastSubmitted.end_time).getTime() + wakeWindowMs)
    : new Date(now.getTime() + wakeWindowMs);

  let steps = 0;
  while (nextNap.getTime() <= now.getTime() && steps < MAX_FORWARD_STEPS) {
    nextNap = new Date(nextNap.getTime() + wakeWindowMs);
    steps += 1;
  }

  return nextNap;
};

export const formatNextNapTime = (date: Date): string =>
  date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
