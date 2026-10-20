jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  buildWeekTimelineDays,
  buildWeekTimelineHourMarks,
  buildWeekTimelineSegments,
  classifySleep,
  getTimelineDayStartForInstant,
} from '@/app/utils/weekTimeline';
import type { TimerSession } from '@/app/utils/timerHistory';

const DAY_START = 390; // 6:30 AM
const DAY_END = 1260; // 9:00 PM

const local = (
  month: number,
  day: number,
  hours: number,
  minutes = 0
): Date => new Date(2026, month - 1, day, hours, minutes);

const sleep = (id: string, start: Date, end: Date): TimerSession => ({
  id,
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  duration_ms: end.getTime() - start.getTime(),
  run_type: 'sleeping',
});

describe('getTimelineDayStartForInstant', () => {
  it('belongs to the previous day before the day start', () => {
    expect(getTimelineDayStartForInstant(local(9, 10, 3), DAY_START)).toEqual(
      local(9, 9, 6, 30)
    );
  });

  it('belongs to the same day after the day start', () => {
    expect(getTimelineDayStartForInstant(local(9, 10, 7), DAY_START)).toEqual(
      local(9, 10, 6, 30)
    );
  });
});

describe('buildWeekTimelineDays', () => {
  it('returns seven days ending with the day containing the instant', () => {
    const days = buildWeekTimelineDays(local(9, 10, 3), DAY_START);
    expect(days).toHaveLength(7);
    expect(days[0].key).toBe('2026-09-03');
    expect(days[6].key).toBe('2026-09-09');
    expect(days[6].end).toEqual(local(9, 10, 6, 30));
  });
});

describe('classifySleep', () => {
  it('treats sleep starting inside the day window as a nap', () => {
    expect(
      classifySleep(sleep('1', local(9, 9, 13), local(9, 9, 14)), DAY_START, DAY_END)
    ).toBe('nap');
  });

  it('treats sleep starting after the day end as night sleep', () => {
    expect(
      classifySleep(sleep('1', local(9, 9, 22), local(9, 10, 6)), DAY_START, DAY_END)
    ).toBe('night');
  });
});

describe('buildWeekTimelineSegments', () => {
  const days = buildWeekTimelineDays(local(9, 10, 3), DAY_START);

  it('keeps a night inside one column when it ends before the day start', () => {
    const segments = buildWeekTimelineSegments(
      [sleep('n', local(9, 9, 22, 9), local(9, 10, 6, 26))],
      days,
      DAY_START,
      DAY_END
    );
    expect(segments).toEqual([
      {
        key: 'n:2026-09-09',
        sessionId: 'n',
        dayIndex: 6,
        startOffsetMinutes: 939,
        endOffsetMinutes: 1436,
        kind: 'night',
      },
    ]);
  });

  it('splits sleep that crosses the day start across two columns', () => {
    const segments = buildWeekTimelineSegments(
      [sleep('n', local(9, 8, 22), local(9, 9, 7, 30))],
      days,
      DAY_START,
      DAY_END
    );
    expect(
      segments.map((s) => [s.dayIndex, s.startOffsetMinutes, s.endOffsetMinutes])
    ).toEqual([
      [5, 930, 1440],
      [6, 0, 60],
    ]);
  });

  it('ignores non-sleep sessions', () => {
    const nursing: TimerSession = {
      ...sleep('f', local(9, 9, 10), local(9, 9, 10, 20)),
      run_type: 'nursing_left',
    };
    expect(buildWeekTimelineSegments([nursing], days, DAY_START, DAY_END)).toEqual(
      []
    );
  });
});

describe('buildWeekTimelineHourMarks', () => {
  it('runs from the day start to the next day start', () => {
    const marks = buildWeekTimelineHourMarks(DAY_START);
    expect(marks[0].offsetMinutes).toBe(0);
    expect(marks[1].offsetMinutes).toBe(120);
    expect(marks[marks.length - 1].offsetMinutes).toBe(1440);
    expect(marks).toHaveLength(13);
    expect(marks[0].label).toMatch(/6:30/);
    expect(marks[marks.length - 1].label).toMatch(/6:30/);
  });
});
