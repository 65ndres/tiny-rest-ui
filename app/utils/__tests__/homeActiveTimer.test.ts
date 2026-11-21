jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  formatFeedingTimerDisplay,
  isFeedingTimerRun,
} from '@/app/utils/homeActiveTimer';
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
  it('shows the side and whole minutes elapsed', () => {
    const now = new Date(start.getTime() + 12 * 60000 + 40000);
    expect(formatFeedingTimerDisplay(run('nursing_left'), now)).toEqual({
      label: 'nursing left',
      value: 'now',
      subtitle: '12 min',
    });
  });

  it('labels bottle timers', () => {
    expect(formatFeedingTimerDisplay(run('bottle'), start).label).toBe(
      'bottle feeding'
    );
  });

  it('freezes the minutes when paused', () => {
    const now = new Date(start.getTime() + 60 * 60000);
    expect(
      formatFeedingTimerDisplay(run('nursing_right'), now, 5 * 60000)
    ).toEqual({
      label: 'nursing right',
      value: 'now',
      subtitle: '5 min · paused',
    });
  });
});
