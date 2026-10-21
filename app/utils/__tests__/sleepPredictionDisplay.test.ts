import {
  formatPredictionDisplay,
  getOverdueMinutes,
  type SleepPrediction,
} from '../sleepPrediction';

const dueAt = new Date(2026, 9, 20, 7, 50);
const minutesAfterDue = (minutes: number) =>
  new Date(dueAt.getTime() + minutes * 60 * 1000);
const dueTime = dueAt.toLocaleTimeString(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const nextNap: SleepPrediction = {
  status: 'next_nap',
  predicted_at: dueAt.toISOString(),
  wake_window_minutes: 50,
  naps_today: 0,
  daily_nap_count: 5,
  active_sleep: null,
};

describe('sleep prediction display', () => {
  it('shows the clock time while the nap is still ahead or due now', () => {
    expect(formatPredictionDisplay(nextNap, minutesAfterDue(-10))).toEqual({
      label: 'next sleep',
      value: dueTime,
    });
    expect(formatPredictionDisplay(nextNap, dueAt).value).toBe(dueTime);
  });

  it('shows how long ago an unstarted nap was due', () => {
    expect(formatPredictionDisplay(nextNap, minutesAfterDue(10))).toEqual({
      label: 'next sleep',
      value: '10 min ago',
      subtitle: `Was due at ${dueTime}`,
    });
    expect(formatPredictionDisplay(nextNap, minutesAfterDue(1)).value).toBe(
      '1 min ago'
    );
  });

  it('keeps the clock time for displays that cannot refresh', () => {
    expect(
      formatPredictionDisplay(nextNap, minutesAfterDue(10), {
        relativeOverdue: false,
      })
    ).toEqual({ label: 'next sleep', value: dueTime, subtitle: 'Overdue' });
  });

  it('only counts next naps as overdue', () => {
    expect(getOverdueMinutes(nextNap, minutesAfterDue(21))).toBe(21);
    expect(
      getOverdueMinutes({ ...nextNap, status: 'bedtime' }, minutesAfterDue(21))
    ).toBe(0);
    expect(
      getOverdueMinutes({ ...nextNap, predicted_at: null }, minutesAfterDue(21))
    ).toBe(0);
  });
});
