/**
 * Timer history: local AsyncStorage for guests, API for authenticated users.
 * Fields: id, start_time, end_time, duration_ms, submitted_at?
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import type { TimelineEventProps } from 'react-native-calendars';
import { API_URL } from '@/constants/Config';

export const TIMER_HISTORY_CACHE_KEY = 'timer_history';

export type TimerRunType =
  | 'sleeping'
  | 'nursing_left'
  | 'nursing_right'
  | 'bottle';

export type BottleMetadata = {
  feeding_type?: string;
  unit?: 'oz' | 'mL';
  amount?: number;
  notes?: string;
};

export type TimerSession = {
  id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  submitted_at?: string;
  run_type?: TimerRunType;
  metadata?: BottleMetadata;
};

export type TimerSubmitPayload = {
  start_time: string;
  end_time: string;
  duration_ms: number;
};

export type TimerRunApiRecord = {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  submitted: boolean;
  active?: boolean;
  paused?: boolean;
  run_type?: TimerRunType;
  metadata?: BottleMetadata;
};

export type CreateTimerRunOptions = {
  run_type?: TimerRunType;
  metadata?: BottleMetadata;
};

export type FetchTimerRunsOptions = {
  run_type?: TimerRunType;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const mapTimerRunToSession = (
  record: TimerRunApiRecord
): TimerSession | null => {
  if (
    !record.start_time ||
    !record.end_time ||
    record.duration == null ||
    !record.submitted
  ) {
    return null;
  }

  return {
    id: String(record.id),
    start_time: record.start_time,
    end_time: record.end_time,
    duration_ms: record.duration,
    submitted_at: record.end_time,
    run_type: record.run_type,
    metadata: record.metadata,
  };
};

export const fetchTimerRuns = async (
  token: string,
  options?: FetchTimerRunsOptions
): Promise<TimerSession[]> => {
  const response = await axios.get<{ timer_runs: TimerRunApiRecord[] }>(
    `${API_URL}/timer_runs`,
    {
      headers: authHeaders(token),
      params: options?.run_type ? { run_type: options.run_type } : undefined,
    }
  );

  const sessions = (response.data.timer_runs ?? [])
    .map(mapTimerRunToSession)
    .filter((session): session is TimerSession => session !== null);

  return sortNewestFirst(sessions);
};

export const fetchTimerRunsInRange = async (
  token: string,
  from: string,
  to: string,
  options?: FetchTimerRunsOptions
): Promise<TimerSession[]> => {
  const response = await axios.get<{ timer_runs: TimerRunApiRecord[] }>(
    `${API_URL}/timer_runs`,
    {
      headers: authHeaders(token),
      params: {
        from,
        to,
        ...(options?.run_type ? { run_type: options.run_type } : {}),
      },
    }
  );

  const sessions = (response.data.timer_runs ?? [])
    .map(mapTimerRunToSession)
    .filter((session): session is TimerSession => session !== null);

  return sessions;
};

export const TIMELINE_FIRST_DAY = 1;

export const formatDateParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekStart = (
  date: Date,
  firstDay: number = TIMELINE_FIRST_DAY
): Date => {
  const normalized = startOfLocalDay(date);
  const day = normalized.getDay();
  const diff = (day - firstDay + 7) % 7;
  normalized.setDate(normalized.getDate() - diff);
  return normalized;
};

export const getWeekEnd = (
  date: Date,
  firstDay: number = TIMELINE_FIRST_DAY
): Date => {
  const weekStart = getWeekStart(date, firstDay);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
};

export const getWeekRangeForDate = (
  date: Date,
  firstDay: number = TIMELINE_FIRST_DAY
): { from: string; to: string } => {
  const weekStart = getWeekStart(date, firstDay);
  const weekEnd = getWeekEnd(date, firstDay);
  return {
    from: formatDateParam(weekStart),
    to: formatDateParam(weekEnd),
  };
};

export const getBufferedWeekRange = (
  date: Date,
  bufferWeeks: number = 1,
  firstDay: number = TIMELINE_FIRST_DAY
): { from: string; to: string } => {
  const weekStart = getWeekStart(date, firstDay);
  const rangeStart = new Date(weekStart);
  rangeStart.setDate(rangeStart.getDate() - bufferWeeks * 7);

  const weekEnd = getWeekEnd(date, firstDay);
  const rangeEnd = new Date(weekEnd);
  rangeEnd.setDate(rangeEnd.getDate() + bufferWeeks * 7);

  return {
    from: formatDateParam(rangeStart),
    to: formatDateParam(rangeEnd),
  };
};

export const filterSessionsInRange = (
  sessions: TimerSession[],
  from: string,
  to: string
): TimerSession[] => {
  const rangeStart = startOfLocalDay(new Date(`${from}T00:00:00`));
  const rangeEnd = startOfLocalDay(new Date(`${to}T00:00:00`));
  rangeEnd.setHours(23, 59, 59, 999);

  return sessions.filter((session) => {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    return start < rangeEnd && end >= rangeStart;
  });
};

export const NAP_TIMELINE_EVENT_COLOR = '#4ade80';
export const NURSING_TIMELINE_EVENT_COLOR = '#ff7f50';

export const TIMELINE_RUN_TYPES: TimerRunType[] = [
  'sleeping',
  'nursing_left',
  'nursing_right',
];

export const filterTimelineSessions = (
  sessions: TimerSession[]
): TimerSession[] =>
  sessions.filter(
    (session) =>
      session.run_type != null && TIMELINE_RUN_TYPES.includes(session.run_type)
  );

export const sessionToTimelineEvent = (
  session: TimerSession
): TimelineEventProps => {
  const isNursing =
    session.run_type === 'nursing_left' ||
    session.run_type === 'nursing_right';

  return {
    id: session.id,
    start: session.start_time,
    end: session.end_time,
    title: formatDuration(session.duration_ms),
    summary: isNursing
      ? session.run_type === 'nursing_left'
        ? 'Nursing · Left'
        : 'Nursing · Right'
      : 'Nap',
    color: isNursing ? NURSING_TIMELINE_EVENT_COLOR : NAP_TIMELINE_EVENT_COLOR,
  };
};

export const buildTimelineEventsByDate = (
  sessions: TimerSession[]
): Record<string, TimelineEventProps[]> => {
  const eventsByDate: Record<string, TimelineEventProps[]> = {};

  for (const session of sessions) {
    const dayKey = getLocalDayKey(session.start_time);
    const event = sessionToTimelineEvent(session);
    const existing = eventsByDate[dayKey];
    if (existing) {
      existing.push(event);
    } else {
      eventsByDate[dayKey] = [event];
    }
  }

  return eventsByDate;
};

export const buildMarkedDatesFromEvents = (
  eventsByDate: Record<string, TimelineEventProps[]>
): Record<string, { marked: boolean }> => {
  const marked: Record<string, { marked: boolean }> = {};
  for (const dayKey of Object.keys(eventsByDate)) {
    if (eventsByDate[dayKey]?.length) {
      marked[dayKey] = { marked: true };
    }
  }
  return marked;
};

export const mergeTimelineEventsByDate = (
  current: Record<string, TimelineEventProps[]>,
  incoming: Record<string, TimelineEventProps[]>
): Record<string, TimelineEventProps[]> => {
  const merged = { ...current };

  for (const [dayKey, events] of Object.entries(incoming)) {
    const existing = merged[dayKey] ?? [];
    const byId = new Map(existing.map((event) => [event.id ?? event.start, event]));
    for (const event of events) {
      byId.set(event.id ?? event.start, event);
    }
    merged[dayKey] = [...byId.values()];
  }

  return merged;
};

export const mergeTimerSessions = (
  current: TimerSession[],
  incoming: TimerSession[]
): TimerSession[] => {
  const byId = new Map(current.map((session) => [session.id, session]));
  for (const session of incoming) {
    byId.set(session.id, session);
  }
  return [...byId.values()];
};

export const createTimerRun = async (
  token: string,
  startTime: string,
  options?: CreateTimerRunOptions
): Promise<TimerRunApiRecord> => {
  const response = await axios.post<{ timer_run: TimerRunApiRecord }>(
    `${API_URL}/timer_runs`,
    {
      start_time: startTime,
      ...(options?.run_type ? { run_type: options.run_type } : {}),
      ...(options?.metadata ? { metadata: options.metadata } : {}),
    },
    { headers: authHeaders(token) }
  );

  return response.data.timer_run;
};

export const createBottleFeeding = async (
  token: string,
  payload: { start_time: string; metadata?: BottleMetadata }
): Promise<TimerRunApiRecord> => {
  const response = await axios.post<{ timer_run: TimerRunApiRecord }>(
    `${API_URL}/timer_runs`,
    {
      start_time: payload.start_time,
      run_type: 'bottle',
      submitted: true,
      metadata: payload.metadata ?? {},
    },
    { headers: authHeaders(token) }
  );

  return response.data.timer_run;
};

export const fetchActiveTimerRun = async (
  token: string,
  options?: FetchTimerRunsOptions
): Promise<TimerRunApiRecord | null> => {
  const response = await axios.get<{ timer_run: TimerRunApiRecord | null }>(
    `${API_URL}/timer_runs/active`,
    {
      headers: authHeaders(token),
      params: options?.run_type ? { run_type: options.run_type } : undefined,
    }
  );

  return response.data.timer_run ?? null;
};

export const NURSING_RUN_TYPES: TimerRunType[] = ['nursing_left', 'nursing_right'];

export const FEEDING_RUN_TYPES: TimerRunType[] = [
  ...NURSING_RUN_TYPES,
  'bottle',
];

export const isFeedingSession = (session: TimerSession): boolean =>
  session.run_type != null && FEEDING_RUN_TYPES.includes(session.run_type);

export const filterFeedingSessions = (
  sessions: TimerSession[]
): TimerSession[] => sortNewestFirst(sessions.filter(isFeedingSession));

export const formatFeedingSessionTitle = (session: TimerSession): string => {
  switch (session.run_type) {
    case 'nursing_left':
      return 'Nursing · Left';
    case 'nursing_right':
      return 'Nursing · Right';
    case 'bottle':
      return 'Bottle';
    default:
      return 'Feeding';
  }
};

export const formatTimelineEventAlertTitle = (session: TimerSession): string => {
  if (
    session.run_type === 'nursing_left' ||
    session.run_type === 'nursing_right'
  ) {
    return formatFeedingSessionTitle(session);
  }

  return 'Nap';
};

export const formatFeedingSessionDetails = (session: TimerSession): string => {
  if (session.run_type !== 'bottle') {
    return '';
  }

  const meta = session.metadata;
  if (!meta) {
    return '';
  }

  const parts: string[] = [];
  if (meta.amount != null && meta.amount > 0) {
    parts.push(`${meta.amount} ${meta.unit ?? 'oz'}`);
  }
  if (meta.feeding_type) {
    parts.push(meta.feeding_type);
  }
  if (meta.notes?.trim()) {
    parts.push(meta.notes.trim());
  }

  return parts.join(' · ');
};

export const getLastNursingSide = (
  sessions: TimerSession[]
): 'left' | 'right' | null => {
  const nursing = sessions
    .filter(
      (s) =>
        s.run_type === 'nursing_left' || s.run_type === 'nursing_right'
    )
    .sort((a, b) => {
      const aTime = new Date(a.submitted_at ?? a.end_time).getTime();
      const bTime = new Date(b.submitted_at ?? b.end_time).getTime();
      return bTime - aTime;
    });

  if (nursing.length === 0) return null;
  return nursing[0].run_type === 'nursing_right' ? 'right' : 'left';
};

export const submitTimerRun = async (
  token: string,
  id: number,
  payload: TimerSubmitPayload
): Promise<TimerRunApiRecord> => {
  const response = await axios.patch<{ timer_run: TimerRunApiRecord }>(
    `${API_URL}/timer_runs/${id}`,
    {
      end_time: payload.end_time,
      duration: payload.duration_ms,
      submitted: true,
      ...(payload.start_time ? { start_time: payload.start_time } : {}),
    },
    { headers: authHeaders(token) }
  );

  return response.data.timer_run;
};

export const deleteTimerRun = async (
  token: string,
  id: number
): Promise<void> => {
  await axios.delete(`${API_URL}/timer_runs/${id}`, {
    headers: authHeaders(token),
  });
};

const dateTimeFormat: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

const clockTimeFormat: Intl.DateTimeFormatOptions = {
  timeStyle: 'short',
};

const startOfLocalDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const isEpochAnchoredDate = (date: Date): boolean =>
  date.getFullYear() < 2000;

export const applyPickerTimeToBaseDate = (
  picked: Date,
  baseDate: Date
): Date => {
  const merged = new Date(baseDate);
  merged.setHours(
    picked.getHours(),
    picked.getMinutes(),
    picked.getSeconds(),
    0
  );
  return merged;
};

export const normalizePickedTimerDate = (
  picked: Date,
  baseDate: Date
): Date => {
  if (isEpochAnchoredDate(picked)) {
    return applyPickerTimeToBaseDate(picked, baseDate);
  }
  return picked;
};

export const normalizeTimerSessionTimes = (
  start: Date,
  end: Date
): { start: Date; end: Date } => {
  const today = startOfLocalDay(new Date());
  const normalizedStart = isEpochAnchoredDate(start)
    ? applyPickerTimeToBaseDate(start, today)
    : new Date(start);
  let normalizedEnd = isEpochAnchoredDate(end)
    ? applyPickerTimeToBaseDate(end, normalizedStart)
    : new Date(end);

  if (normalizedEnd.getTime() <= normalizedStart.getTime()) {
    normalizedEnd = new Date(normalizedEnd);
    normalizedEnd.setDate(normalizedEnd.getDate() + 1);
  }

  return { start: normalizedStart, end: normalizedEnd };
};

export const getLocalDayKey = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'invalid';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getSessionDayKey = (session: TimerSession): string =>
  getLocalDayKey(session.submitted_at ?? session.end_time);

export const formatDayGroupLabel = (dayKey: string): string => {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return dayKey;
  }

  const today = startOfLocalDay(new Date());
  const target = startOfLocalDay(date);
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

export const formatSessionClockTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid time';
  }
  return date.toLocaleString(undefined, clockTimeFormat);
};

export const formatClockTime = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleString(undefined, clockTimeFormat);
};

export type TimerSessionDayGroup = {
  dayKey: string;
  label: string;
  sessions: TimerSession[];
};

export const groupSessionsByDay = (
  sessions: TimerSession[]
): TimerSessionDayGroup[] => {
  const groups = new Map<string, TimerSession[]>();

  for (const session of sessions) {
    const dayKey = getSessionDayKey(session);
    const existing = groups.get(dayKey);
    if (existing) {
      existing.push(session);
    } else {
      groups.set(dayKey, [session]);
    }
  }

  return [...groups.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((dayKey) => ({
      dayKey,
      label: formatDayGroupLabel(dayKey),
      sessions: groups.get(dayKey) ?? [],
    }));
};

export type ElapsedParts = {
  hours: string;
  minutes: string;
  seconds: string;
};

export const splitElapsed = (ms: number): ElapsedParts => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
};

export const formatDuration = (ms: number): string => {
  const { hours, minutes, seconds } = splitElapsed(ms);
  return `${hours}:${minutes}:${seconds}`;
};

const readableClockTimeFormat: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

export const formatReadableClockTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid time';
  }
  return date.toLocaleTimeString(undefined, readableClockTimeFormat);
};

export const formatSessionTimeRange = (
  start: string,
  end?: string | null
): string => {
  const startLabel = formatReadableClockTime(start);
  if (!end) {
    return startLabel;
  }

  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) {
    return startLabel;
  }

  return `${startLabel} – ${formatReadableClockTime(end)}`;
};

export const formatHumanDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes} min`;
  }
  return `${seconds} sec`;
};

const joinHistoryParts = (parts: string[]): string =>
  parts.filter((part) => part.length > 0).join(' · ');

export const formatSessionTimeAndDuration = (session: TimerSession): string => {
  const parts: string[] = [
    formatSessionTimeRange(session.start_time, session.end_time ?? undefined),
  ];
  if (session.duration_ms > 0) {
    parts.push(formatHumanDuration(session.duration_ms));
  }
  return joinHistoryParts(parts);
};

export const formatFeedingHistoryPrimary = (session: TimerSession): string => {
  const parts: string[] = [formatFeedingSessionTitle(session)];
  const details = formatFeedingSessionDetails(session);
  if (details) {
    parts.push(details);
  }
  return joinHistoryParts(parts);
};

export const formatTimerHistoryLine = (session: TimerSession): string =>
  formatSessionTimeAndDuration(session);

export const formatFeedingHistoryLine = (session: TimerSession): string => {
  const primary = formatFeedingHistoryPrimary(session);
  const timeAndDuration = formatSessionTimeAndDuration(session);
  return joinHistoryParts([primary, timeAndDuration]);
};

export const formatSessionTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid time';
  }
  return date.toLocaleString(undefined, dateTimeFormat);
};

const sortNewestFirst = (sessions: TimerSession[]): TimerSession[] => {
  return [...sessions].sort((a, b) => {
    const aTime = new Date(a.submitted_at ?? a.end_time).getTime();
    const bTime = new Date(b.submitted_at ?? b.end_time).getTime();
    return bTime - aTime;
  });
};

const normalizeSession = (raw: Record<string, unknown>): TimerSession | null => {
  const start_time = raw.start_time;
  const end_time = raw.end_time;
  const duration_ms = raw.duration_ms;

  if (
    typeof start_time !== 'string' ||
    typeof end_time !== 'string' ||
    typeof duration_ms !== 'number'
  ) {
    return null;
  }

  const id =
    raw.id != null ? String(raw.id) : `local-${start_time}-${end_time}`;

  return {
    id,
    start_time,
    end_time,
    duration_ms,
    submitted_at:
      typeof raw.submitted_at === 'string' ? raw.submitted_at : undefined,
  };
};

const parseSessionsFromStorage = (data: unknown): TimerSession[] => {
  const list = Array.isArray(data)
    ? data
    : data &&
        typeof data === 'object' &&
        Array.isArray((data as { timers?: unknown }).timers)
      ? (data as { timers: unknown[] }).timers
      : [];

  return sortNewestFirst(
    list
      .map((item) =>
        item && typeof item === 'object'
          ? normalizeSession(item as Record<string, unknown>)
          : null
      )
      .filter((session): session is TimerSession => session !== null)
  );
};

export const createLocalTimerSession = (
  payload: TimerSubmitPayload
): TimerSession => ({
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  start_time: payload.start_time,
  end_time: payload.end_time,
  duration_ms: payload.duration_ms,
  submitted_at: new Date().toISOString(),
});

export const loadTimerHistoryFromCache = async (): Promise<TimerSession[]> => {
  try {
    const raw = await AsyncStorage.getItem(TIMER_HISTORY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return parseSessionsFromStorage(parsed);
  } catch {
    return [];
  }
};

export const saveTimerHistoryToCache = async (
  sessions: TimerSession[]
): Promise<void> => {
  await AsyncStorage.setItem(
    TIMER_HISTORY_CACHE_KEY,
    JSON.stringify(sortNewestFirst(sessions))
  );
};

export const removeTimerSessionFromCache = async (
  id: string
): Promise<void> => {
  const sessions = await loadTimerHistoryFromCache();
  const next = sessions.filter((session) => session.id !== id);
  await saveTimerHistoryToCache(next);
};

export const prependTimerSession = (
  sessions: TimerSession[],
  session: TimerSession
): TimerSession[] => {
  const withoutDuplicate = sessions.filter((s) => s.id !== session.id);
  return sortNewestFirst([session, ...withoutDuplicate]);
};
