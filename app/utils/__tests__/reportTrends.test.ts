jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  buildReportDayStats,
  bucketReportDays,
  formatReportDuration,
  formatVolume,
  niceAxis,
  preferredVolumeUnit,
  summarizeFeeding,
  summarizeSleep,
} from '@/app/utils/reportTrends';
import { buildWeekTimelineDays } from '@/app/utils/weekTimeline';
import type { TimerSession } from '@/app/utils/timerHistory';

const DAY_START = 390; // 6:30 AM
const DAY_END = 1260; // 9:00 PM

const local = (
  month: number,
  day: number,
  hours: number,
  minutes = 0
): Date => new Date(2026, month - 1, day, hours, minutes);

const run = (
  id: string,
  runType: TimerSession['run_type'],
  start: Date,
  end: Date,
  metadata?: TimerSession['metadata']
): TimerSession => ({
  id,
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  duration_ms: end.getTime() - start.getTime(),
  run_type: runType,
  metadata,
});

const days = buildWeekTimelineDays(local(10, 24, 12), DAY_START);

describe('buildReportDayStats', () => {
  it('counts a night on the timeline day it starts, not split at midnight', () => {
    const stats = buildReportDayStats(
      [run('1', 'sleeping', local(10, 22, 21, 30), local(10, 23, 7, 30))],
      days,
      DAY_START,
      DAY_END
    );
    const day = stats.find((entry) => entry.start.getDate() === 22)!;
    expect(day.nightMs).toBe(10 * 3_600_000);
    expect(stats.reduce((sum, entry) => sum + entry.nightMs, 0)).toBe(
      10 * 3_600_000
    );
  });

  it('separates naps, nursing and bottles', () => {
    const stats = buildReportDayStats(
      [
        run('1', 'sleeping', local(10, 23, 13), local(10, 23, 14, 30)),
        run('2', 'nursing_left', local(10, 23, 9), local(10, 23, 9, 20)),
        run('3', 'bottle', local(10, 23, 11), local(10, 23, 11), {
          amount: 4,
          unit: 'oz',
        }),
        run('4', 'bottle', local(10, 23, 16), local(10, 23, 16), {
          amount: 60,
          unit: 'mL',
        }),
      ],
      days,
      DAY_START,
      DAY_END
    );
    const day = stats.find((entry) => entry.start.getDate() === 23)!;
    expect(day.napMs).toBe(90 * 60_000);
    expect(day.napCount).toBe(1);
    expect(day.nursingCount).toBe(1);
    expect(day.nursingMs).toBe(20 * 60_000);
    expect(day.bottleCount).toBe(2);
    expect(day.bottleMl).toBeCloseTo(4 * 29.5735 + 60);
  });
});

describe('summaries', () => {
  it('average sleep over tracked days only', () => {
    const stats = buildReportDayStats(
      [
        run('1', 'sleeping', local(10, 22, 21, 30), local(10, 23, 7, 30)),
        run('2', 'sleeping', local(10, 23, 13), local(10, 23, 15)),
        run('3', 'sleeping', local(10, 23, 21, 30), local(10, 24, 5, 30)),
      ],
      days,
      DAY_START,
      DAY_END
    );
    const summary = summarizeSleep(stats);
    expect(summary.trackedDays).toBe(2);
    expect(summary.nightAvgMs).toBe(9 * 3_600_000);
    expect(summary.napAvgMs).toBe(3_600_000);
    expect(summary.totalAvgMs).toBe(10 * 3_600_000);
  });

  it('is zero with nothing logged', () => {
    const stats = buildReportDayStats([], days, DAY_START, DAY_END);
    expect(summarizeSleep(stats).totalAvgMs).toBe(0);
    expect(summarizeFeeding(stats).trackedDays).toBe(0);
  });
});

describe('bucketReportDays', () => {
  const statsFor = (count: number) =>
    buildReportDayStats(
      [],
      buildWeekTimelineDays(local(10, 24, 12), DAY_START, count),
      DAY_START,
      DAY_END
    );

  it('uses one column per day up to 30 days', () => {
    expect(bucketReportDays(statsFor(7), '7d')).toHaveLength(7);
    expect(bucketReportDays(statsFor(30), '30d')).toHaveLength(30);
  });

  it('uses weeks ending on the latest day for 90 days', () => {
    const buckets = bucketReportDays(statsFor(90), '90d');
    expect(buckets).toHaveLength(13);
    expect(buckets[buckets.length - 1].days).toHaveLength(7);
    expect(buckets[0].days).toHaveLength(6);
  });

  it('uses calendar months for a year', () => {
    const buckets = bucketReportDays(statsFor(365), '1y');
    expect(buckets).toHaveLength(13);
    expect(buckets.reduce((sum, bucket) => sum + bucket.days.length, 0)).toBe(365);
  });
});

describe('formatting', () => {
  it('formats durations like the summary', () => {
    expect(formatReportDuration((10 * 60 + 29) * 60_000)).toBe('10h 29min');
    expect(formatReportDuration(65 * 60_000)).toBe('1h 5min');
    expect(formatReportDuration(2 * 3_600_000)).toBe('2h');
    expect(formatReportDuration(0)).toBe('0min');
  });

  it('formats volume in either unit', () => {
    expect(formatVolume(29.5735 * 4, 'oz')).toBe('4 oz');
    expect(formatVolume(120.4, 'mL')).toBe('120 mL');
  });

  it('prefers the unit of the latest bottle with an amount', () => {
    expect(
      preferredVolumeUnit([
        run('1', 'bottle', local(10, 20, 9), local(10, 20, 9), { amount: 4, unit: 'oz' }),
        run('2', 'bottle', local(10, 21, 9), local(10, 21, 9), { amount: 90, unit: 'mL' }),
      ])
    ).toBe('mL');
    expect(preferredVolumeUnit([])).toBe('oz');
  });

  it('picks the smallest step that fits', () => {
    expect(niceAxis(10.5, [1, 2, 3, 4, 5, 6])).toEqual({ max: 12, step: 3 });
    expect(niceAxis(0, [1, 2])).toEqual({ max: 4, step: 1 });
  });
});
