/**
 * Sleep and feeding trends for the Reports screen. Sessions are grouped by the
 * timeline day (day start to day start) their start time falls in, the same
 * days the week timeline uses, so a night of sleep counts once.
 */
import type { TimerSession } from '@/app/utils/timerHistory';
import {
  getSleptMs,
  getTimelineSegmentKind,
  type WeekTimelineDay,
} from '@/app/utils/weekTimeline';

export type ReportRangeId = '7d' | '14d' | '30d' | '90d' | '1y';

export const REPORT_RANGES: { id: ReportRangeId; label: string; days: number }[] = [
  { id: '7d', label: '7D', days: 7 },
  { id: '14d', label: '14D', days: 14 },
  { id: '30d', label: '30D', days: 30 },
  { id: '90d', label: '90D', days: 90 },
  { id: '1y', label: '1Y', days: 365 },
];

export const getReportRangeDays = (rangeId: ReportRangeId): number =>
  REPORT_RANGES.find((range) => range.id === rangeId)?.days ?? 7;

export const ML_PER_OZ = 29.5735;

export type ReportDayStats = {
  key: string;
  start: Date;
  napMs: number;
  nightMs: number;
  napCount: number;
  nursingMs: number;
  nursingCount: number;
  bottleCount: number;
  bottleMl: number;
};

const bottleMl = (session: TimerSession): number => {
  const amount = session.metadata?.amount;
  if (amount == null || amount <= 0) return 0;
  return session.metadata?.unit === 'mL' ? amount : amount * ML_PER_OZ;
};

export const buildReportDayStats = (
  sessions: TimerSession[],
  days: WeekTimelineDay[],
  dayStartMinutes: number,
  dayEndMinutes: number
): ReportDayStats[] => {
  const stats: ReportDayStats[] = days.map((day) => ({
    key: day.key,
    start: day.start,
    napMs: 0,
    nightMs: 0,
    napCount: 0,
    nursingMs: 0,
    nursingCount: 0,
    bottleCount: 0,
    bottleMl: 0,
  }));

  for (const session of sessions) {
    const start = new Date(session.start_time);
    if (Number.isNaN(start.getTime())) continue;
    const dayIndex = days.findIndex((day) => start >= day.start && start < day.end);
    if (dayIndex === -1) continue;

    const day = stats[dayIndex];
    switch (getTimelineSegmentKind(session, dayStartMinutes, dayEndMinutes)) {
      case 'nap':
        day.napMs += Math.max(0, getSleptMs(session));
        day.napCount += 1;
        break;
      case 'night':
        day.nightMs += Math.max(0, getSleptMs(session));
        break;
      case 'nursing':
        day.nursingMs += Math.max(0, getSleptMs(session));
        day.nursingCount += 1;
        break;
      case 'bottle':
        day.bottleCount += 1;
        day.bottleMl += bottleMl(session);
        break;
      default:
        break;
    }
  }

  return stats;
};

export const hasSleep = (day: ReportDayStats): boolean =>
  day.napMs + day.nightMs > 0;

export const hasFeeding = (day: ReportDayStats): boolean =>
  day.nursingCount + day.bottleCount > 0;

/**
 * Average of `pick` over the days that have anything logged, so days before
 * the app was in use (or simply not tracked) don't drag the average down.
 */
export const averageOverTrackedDays = (
  days: ReportDayStats[],
  isTracked: (day: ReportDayStats) => boolean,
  pick: (day: ReportDayStats) => number
): number => {
  const tracked = days.filter(isTracked);
  if (tracked.length === 0) return 0;
  return tracked.reduce((sum, day) => sum + pick(day), 0) / tracked.length;
};

export type SleepSummary = {
  napAvgMs: number;
  nightAvgMs: number;
  totalAvgMs: number;
  napCountAvg: number;
  trackedDays: number;
};

export const summarizeSleep = (days: ReportDayStats[]): SleepSummary => {
  const napAvgMs = averageOverTrackedDays(days, hasSleep, (day) => day.napMs);
  const nightAvgMs = averageOverTrackedDays(days, hasSleep, (day) => day.nightMs);
  return {
    napAvgMs,
    nightAvgMs,
    totalAvgMs: napAvgMs + nightAvgMs,
    napCountAvg: averageOverTrackedDays(days, hasSleep, (day) => day.napCount),
    trackedDays: days.filter(hasSleep).length,
  };
};

export type FeedingSummary = {
  nursingCountAvg: number;
  nursingAvgMs: number;
  bottleCountAvg: number;
  bottleMlAvg: number;
  trackedDays: number;
};

export const summarizeFeeding = (days: ReportDayStats[]): FeedingSummary => ({
  nursingCountAvg: averageOverTrackedDays(days, hasFeeding, (day) => day.nursingCount),
  nursingAvgMs: averageOverTrackedDays(days, hasFeeding, (day) => day.nursingMs),
  bottleCountAvg: averageOverTrackedDays(days, hasFeeding, (day) => day.bottleCount),
  bottleMlAvg: averageOverTrackedDays(days, hasFeeding, (day) => day.bottleMl),
  trackedDays: days.filter(hasFeeding).length,
});

export type ReportBucket = {
  key: string;
  label: string;
  days: ReportDayStats[];
};

const DAYS_PER_WEEK_BUCKET = 7;

/**
 * Chart columns for a range: one per day up to 30 days, one per week for 90
 * days and one per calendar month for a year, so the bars stay readable.
 */
export const bucketReportDays = (
  days: ReportDayStats[],
  rangeId: ReportRangeId
): ReportBucket[] => {
  if (rangeId === '7d') {
    return days.map((day) => ({
      key: day.key,
      label: day.start.toLocaleDateString(undefined, { weekday: 'short' }),
      days: [day],
    }));
  }

  if (rangeId === '14d' || rangeId === '30d') {
    return days.map((day) => ({
      key: day.key,
      label: String(day.start.getDate()),
      days: [day],
    }));
  }

  if (rangeId === '90d') {
    const buckets: ReportBucket[] = [];
    // Anchor weeks on the most recent day so the last bar is a full week.
    for (let end = days.length; end > 0; end -= DAYS_PER_WEEK_BUCKET) {
      const chunk = days.slice(Math.max(0, end - DAYS_PER_WEEK_BUCKET), end);
      buckets.unshift({
        key: chunk[0].key,
        label: chunk[0].start.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        days: chunk,
      });
    }
    return buckets;
  }

  const buckets: ReportBucket[] = [];
  for (const day of days) {
    const key = `${day.start.getFullYear()}-${day.start.getMonth()}`;
    const last = buckets[buckets.length - 1];
    if (last?.key === key) {
      last.days.push(day);
    } else {
      buckets.push({
        key,
        label: day.start.toLocaleDateString(undefined, { month: 'narrow' }),
        days: [day],
      });
    }
  }
  return buckets;
};

/** Axis maximum and tick step: the smallest `steps` candidate that fits `max` in `tickCount` ticks. */
export const niceAxis = (
  max: number,
  steps: number[],
  tickCount = 4
): { max: number; step: number } => {
  const step =
    steps.find((candidate) => candidate * tickCount >= max) ??
    Math.ceil(max / tickCount / steps[steps.length - 1]) * steps[steps.length - 1];
  return { max: step * tickCount, step };
};

/** `10h 29min` style, as in the summary; rounds to whole minutes. */
export const formatReportDuration = (ms: number): string => {
  const totalMinutes = Math.round(Math.max(0, ms) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
};

export type VolumeUnit = 'oz' | 'mL';

export const formatVolume = (ml: number, unit: VolumeUnit): string =>
  unit === 'mL'
    ? `${Math.round(ml)} mL`
    : `${(Math.round((ml / ML_PER_OZ) * 10) / 10).toString()} oz`;

/** The unit of the most recent bottle with an amount, so totals read the way the parent logs them. */
export const preferredVolumeUnit = (sessions: TimerSession[]): VolumeUnit => {
  const latest = sessions
    .filter(
      (session) =>
        session.run_type === 'bottle' && (session.metadata?.amount ?? 0) > 0
    )
    .sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time))[0];
  return latest?.metadata?.unit === 'mL' ? 'mL' : 'oz';
};

export const formatRangeLabel = (start: Date, end: Date): string => {
  const format = (date: Date) =>
    date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  return `${format(start)} – ${format(end)}`;
};
