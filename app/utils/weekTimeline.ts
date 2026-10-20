/**
 * Week sleep chart: each column is one "timeline day" running from the user's
 * day start (e.g. 6:30 AM) until the same time the next calendar day, so a
 * night of sleep stays in one column instead of being split at midnight.
 */
import { minutesToDate } from '@/app/utils/dayWindow';
import { formatDateParam, type TimerSession } from '@/app/utils/timerHistory';

export const MINUTES_PER_TIMELINE_DAY = 24 * 60;
export const WEEK_TIMELINE_DAY_COUNT = 7;

export type SleepKind = 'night' | 'nap';

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
  kind: SleepKind;
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

export const buildWeekTimelineSegments = (
  sessions: TimerSession[],
  days: WeekTimelineDay[],
  dayStartMinutes: number,
  dayEndMinutes: number
): WeekTimelineSegment[] => {
  const segments: WeekTimelineSegment[] = [];

  for (const session of sessions) {
    if (session.run_type !== 'sleeping') continue;

    const sessionStart = new Date(session.start_time);
    const sessionEnd = new Date(session.end_time);
    if (
      Number.isNaN(sessionStart.getTime()) ||
      Number.isNaN(sessionEnd.getTime()) ||
      sessionEnd <= sessionStart
    ) {
      continue;
    }

    const kind = classifySleep(session, dayStartMinutes, dayEndMinutes);

    days.forEach((day, dayIndex) => {
      const clippedStart = sessionStart > day.start ? sessionStart : day.start;
      const clippedEnd = sessionEnd < day.end ? sessionEnd : day.end;
      if (clippedEnd <= clippedStart) return;

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

/** Hour labels every `stepHours`, starting at the first full hour on or after the day start. */
export const buildWeekTimelineHourMarks = (
  dayStartMinutes: number,
  stepHours = 2
): WeekTimelineHourMark[] => {
  const marks: WeekTimelineHourMark[] = [];
  const firstOffset = (60 - (dayStartMinutes % 60)) % 60;

  for (
    let offset = firstOffset;
    offset < MINUTES_PER_TIMELINE_DAY;
    offset += stepHours * 60
  ) {
    const date = minutesToDate((dayStartMinutes + offset) % MINUTES_PER_TIMELINE_DAY);
    marks.push({
      offsetMinutes: offset,
      label: date.toLocaleTimeString(undefined, { hour: 'numeric' }),
    });
  }

  return marks;
};

/** Slept time for a session, preferring the recorded duration (which excludes pauses). */
export const getSleptMs = (session: TimerSession): number =>
  session.duration_ms > 0
    ? session.duration_ms
    : new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
