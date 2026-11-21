jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  formatFeedingTimerDisplay,
  formatRunningElapsed,
  formatSleepTimerDisplay,
  isFeedingTimerRun,
} from '@/app/utils/homeActiveTimer';
import type { SleepPrediction } from '@/app/utils/sleepPrediction';
import type { TimerRunApiRecord } from '@/app/utils/timerHistory';

const start = new Date(2026, 5, 1, 9, 0);

const run = (
  run_type: TimerRunApiRecord['run_type']
): TimerRunApiRecord => ({
  id: 1,
  start_time: start.toISOString(),
  end_time: null,
  duration: null,
  submitted: false,
  active: true,
  run_type,
});

describe('isFeedingTimerRun', () => {
  it('is true for nursing and bottle runs', () => {
    expect(isFeedingTimerRun(run('nursing_left'))).toBe(true);
    expect(isFeedingTimerRun(run('nursing_right'))).toBe(true);
    expect(isFeedingTimerRun(run('bottle'))).toBe(true);
  });

  it('is false for sleep or no run', () => {
    expect(isFeedingTimerRun(run('sleeping'))).toBe(false);
    expect(isFeedingTimerRun(null)).toBe(false);
    expect(isFeedingTimerRun(undefined)).toBe(false);
  });
});

describe('formatFeedingTimerDisplay', () => {
  it('falls back to "now" for an unreadable start time', () => {
    expect(
      formatFeedingTimerDisplay({ ...run('bottle'), start_time: 'bad' }, start).value
    ).toBe('now');
  });

  it('shows the side with the elapsed time as the value', () => {
    const now = new Date(start.getTime() + 12 * 60000 + 40000);
    expect(formatFeedingTimerDisplay(run('nursing_left'), now)).toEqual({
      label: 'nursing left',
      value: '00:12:40',
      subtitle: undefined,
      elapsedMs: (12 * 60 + 40) * 1000,
    });
  });

  it('labels bottle timers', () => {
    expect(formatFeedingTimerDisplay(run('bottle'), start).label).toBe(
      'bottle feeding'
    );
  });

  it('freezes the clock when paused', () => {
    const now = new Date(start.getTime() + 60 * 60000);
    expect(
      formatFeedingTimerDisplay(run('nursing_right'), now, 5 * 60000)
    ).toEqual({
      label: 'nursing right',
      value: '00:05:00',
      subtitle: 'Paused',
      elapsedMs: 5 * 60000,
    });
  });
});

describe('formatRunningElapsed', () => {
  const at = (ms: number) => new Date(start.getTime() + ms);

  it('pads hours, minutes and seconds to two digits', () => {
    expect(formatRunningElapsed(start.toISOString(), at(0), null)).toBe('00:00:00');
    expect(formatRunningElapsed(start.toISOString(), at(9000), null)).toBe('00:00:09');
    expect(
      formatRunningElapsed(start.toISOString(), at((2 * 3600 + 3 * 60 + 4) * 1000), null)
    ).toBe('02:03:04');
  });

  it('keeps counting past 24 hours in hours', () => {
    expect(
      formatRunningElapsed(start.toISOString(), at(25 * 3600 * 1000), null)
    ).toBe('25:00:00');
  });

  it('shows zero for a start time a little in the future', () => {
    expect(formatRunningElapsed(start.toISOString(), at(-5000), null)).toBe('00:00:00');
  });

  it('shows nothing for an unreadable start time', () => {
    expect(formatRunningElapsed('not a date', at(0), null)).toBeUndefined();
  });

  it('freezes at the paused time', () => {
    expect(formatRunningElapsed(start.toISOString(), at(0), 61000)).toBe('00:01:01');
  });
});

describe('formatSleepTimerDisplay', () => {
  const napping = (
    status: SleepPrediction['status'] = 'currently_napping'
  ): SleepPrediction => ({
    status,
    predicted_at: null,
    wake_window_minutes: null,
    naps_today: 1,
    daily_nap_count: 2,
    active_sleep: { start_time: start.toISOString(), elapsed_minutes: 3 },
  });

  it('counts from the start time instead of the API minutes', () => {
    const now = new Date(start.getTime() + (65 * 60 + 7) * 1000);
    expect(formatSleepTimerDisplay(napping(), now)).toEqual({
      label: 'napping',
      value: '01:05:07',
      subtitle: undefined,
      elapsedMs: (65 * 60 + 7) * 1000,
    });
  });

  it('labels night sleep', () => {
    expect(formatSleepTimerDisplay(napping('currently_sleeping'), start).label).toBe(
      'sleeping'
    );
  });

  it('freezes the clock when paused', () => {
    const now = new Date(start.getTime() + 60 * 60000);
    expect(formatSleepTimerDisplay(napping(), now, 90 * 1000)).toMatchObject({
      value: '00:01:30',
      subtitle: 'Paused',
    });
  });

  it('falls back to "now" without an active sleep', () => {
    expect(
      formatSleepTimerDisplay({ ...napping(), active_sleep: null }, start).value
    ).toBe('now');
  });
});
