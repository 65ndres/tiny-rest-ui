/**
 * Week sleep and feeding chart: each column is one "timeline day" running from the user's
 * day start (e.g. 6:30 AM) until the same time the next calendar day, so a
 * night of sleep stays in one column instead of being split at midnight.
 */
import { minutesToDate } from '@/app/utils/dayWindow';
import {
  formatDateParam,
  NURSING_RUN_TYPES,
  type TimerRunType,
  type TimerSession,
} from '@/app/utils/timerHistory';

export const MINUTES_PER_TIMELINE_DAY = 24 * 60;
export const WEEK_TIMELINE_DAY_COUNT = 7;

export type SleepKind = 'night' | 'nap';
export type TimelineSegmentKind = SleepKind | 'nursing' | 'bottle';

export const WEEK_TIMELINE_RUN_TYPES: TimerRunType[] = [
  'sleeping',
  ...NURSING_RUN_TYPES,
  'bottle',
];

export type WeekTimelineDay = {
  key: string;
  start: Date;
  end: Date;
};

export type WeekTimelineSegment = {
  key: string;
  sessionId: string;
  dayIndex: number;
  startOffsetMinutes: number;
  endOffsetMinutes: number;
  kind: TimelineSegmentKind;
};

export type WeekTimelineHourMark = {
  offsetMinutes: number;
  label: string;
};

const MS_PER_MINUTE = 60_000;

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** The day-start instant for the calendar date of `date`. */
export const getTimelineDayStart = (
  date: Date,
  dayStartMinutes: number
): Date => minutesToDate(dayStartMinutes, date);

/** Start of the timeline day that contains `instant`. Before the day start, that is yesterday's. */
export const getTimelineDayStartForInstant = (
  instant: Date,
  dayStartMinutes: number
): Date => {
  const sameDayStart = getTimelineDayStart(instant, dayStartMinutes);
  return instant < sameDayStart
    ? getTimelineDayStart(addDays(instant, -1), dayStartMinutes)
    : sameDayStart;
};

/** Seven consecutive timeline days ending with the one that contains `endInstant`. */
export const buildWeekTimelineDays = (
  endInstant: Date,
  dayStartMinutes: number
): WeekTimelineDay[] => {
  const lastDayStart = getTimelineDayStartForInstant(endInstant, dayStartMinutes);
  const days: WeekTimelineDay[] = [];

  for (let index = WEEK_TIMELINE_DAY_COUNT - 1; index >= 0; index -= 1) {
    const start = getTimelineDayStart(addDays(lastDayStart, -index), dayStartMinutes);
    const end = getTimelineDayStart(addDays(start, 1), dayStartMinutes);
    days.push({ key: formatDateParam(start), start, end });
  }

  return days;
};

export const getWeekTimelineRange = (
  days: WeekTimelineDay[]
): { from: string; to: string } => ({
  from: days[0].start.toISOString(),
  to: days[days.length - 1].end.toISOString(),
});

/** Sleep that starts outside the configured day window counts as night sleep. */
export const classifySleep = (
  session: TimerSession,
  dayStartMinutes: number,
  dayEndMinutes: number
): SleepKind => {
  const start = new Date(session.start_time);
  const minuteOfDay = start.getHours() * 60 + start.getMinutes();
  return minuteOfDay >= dayStartMinutes && minuteOfDay < dayEndMinutes
    ? 'nap'
    : 'night';
};

const offsetMinutes = (from: Date, to: Date): number =>
  Math.min(
    MINUTES_PER_TIMELINE_DAY,
    Math.max(0, (to.getTime() - from.getTime()) / MS_PER_MINUTE)
  );

export const getTimelineSegmentKind = (
  session: TimerSession,
  dayStartMinutes: number,
  dayEndMinutes: number
): TimelineSegmentKind | null => {
  if (session.run_type === 'bottle') return 'bottle';
  if (session.run_type && NURSING_RUN_TYPES.includes(session.run_type)) {
    return 'nursing';
  }
  if (session.run_type === 'sleeping') {
    return classifySleep(session, dayStartMinutes, dayEndMinutes);
  }
  return null;
};

export const buildWeekTimelineSegments = (
  sessions: TimerSession[],
  days: WeekTimelineDay[],
  dayStartMinutes: number,
  dayEndMinutes: number
): WeekTimelineSegment[] => {
  const segments: WeekTimelineSegment[] = [];

  for (const session of sessions) {
    const kind = getTimelineSegmentKind(session, dayStartMinutes, dayEndMinutes);
    if (!kind) continue;

    const sessionStart = new Date(session.start_time);
    const sessionEnd = new Date(session.end_time);
    // Bottle feedings are instant events (end == start); everything else needs a span.
    const isInstant = kind === 'bottle';
    if (
      Number.isNaN(sessionStart.getTime()) ||
      Number.isNaN(sessionEnd.getTime()) ||
      (isInstant ? sessionEnd < sessionStart : sessionEnd <= sessionStart)
    ) {
      continue;
    }

    days.forEach((day, dayIndex) => {
      const clippedStart = sessionStart > day.start ? sessionStart : day.start;
      const clippedEnd = sessionEnd < day.end ? sessionEnd : day.end;
      if (isInstant) {
        if (sessionStart < day.start || sessionStart >= day.end) return;
      } else if (clippedEnd <= clippedStart) {
        return;
      }

      segments.push({
        key: `${session.id}:${day.key}`,
        sessionId: session.id,
        dayIndex,
        startOffsetMinutes: offsetMinutes(day.start, clippedStart),
        endOffsetMinutes: offsetMinutes(day.start, clippedEnd),
        kind,
      });
    });
  }

  return segments;
};

/** Axis labels every `stepHours` from the day start, ending with the next day start at the bottom. */
export const buildWeekTimelineHourMarks = (
  dayStartMinutes: number,
  stepHours = 2
): WeekTimelineHourMark[] => {
  const marks: WeekTimelineHourMark[] = [];
  const showMinutes = dayStartMinutes % 60 !== 0;

  for (
    let offset = 0;
    offset <= MINUTES_PER_TIMELINE_DAY;
    offset += stepHours * 60
  ) {
    const date = minutesToDate((dayStartMinutes + offset) % MINUTES_PER_TIMELINE_DAY);
    marks.push({
      offsetMinutes: offset,
      label: date.toLocaleTimeString(
        undefined,
        showMinutes ? { hour: 'numeric', minute: '2-digit' } : { hour: 'numeric' }
      ),
    });
  }

  return marks;
};

/** Slept time for a session, preferring the recorded duration (which excludes pauses). */
export const getSleptMs = (session: TimerSession): number =>
  session.duration_ms > 0
    ? session.duration_ms
    : new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
