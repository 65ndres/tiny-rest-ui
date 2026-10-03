jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  buildTimelineEventsByDate,
  formatDateParam,
  getWeekRangeForDate,
  type TimerSession,
} from '../timerHistory';

const session = (
  start: Date,
  end: Date,
  overrides: Partial<TimerSession> = {}
): TimerSession => ({
  id: '42',
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  duration_ms: end.getTime() - start.getTime(),
  run_type: 'sleeping',
  ...overrides,
});

describe('timeline event safety', () => {
  it('splits an overnight session into events bounded to each local day', () => {
    const start = new Date(2026, 9, 3, 23, 30);
    const end = new Date(2026, 9, 4, 0, 30);
    const events = buildTimelineEventsByDate([session(start, end)]);

    const firstDay = formatDateParam(start);
    const secondDay = formatDateParam(end);
    expect(events[firstDay]).toHaveLength(1);
    expect(events[secondDay]).toHaveLength(1);
    expect(events[firstDay][0].id).toBe('42');
    expect(new Date(String(events[firstDay][0].end)).getHours()).toBe(0);
    expect(new Date(String(events[secondDay][0].start)).getHours()).toBe(0);
  });

  it('drops malformed and implausibly long sessions', () => {
    const invalid = session(new Date(), new Date(), {
      start_time: 'not-a-date',
    });
    const start = new Date(2026, 9, 1, 12);
    const tooLong = session(
      start,
      new Date(start.getTime() + 8 * 24 * 60 * 60 * 1000)
    );

    expect(buildTimelineEventsByDate([invalid, tooLong])).toEqual({});
  });

  it('uses local week boundaries encoded as ISO instants', () => {
    const reference = new Date(2026, 9, 3, 23, 30);
    const { from, to } = getWeekRangeForDate(reference);
    const fromDate = new Date(from);
    const toDate = new Date(to);

    expect(from).toContain('T');
    expect(fromDate.getDay()).toBe(1);
    expect(fromDate.getHours()).toBe(0);
    expect(toDate.getTime() - fromDate.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000
    );
  });
});
