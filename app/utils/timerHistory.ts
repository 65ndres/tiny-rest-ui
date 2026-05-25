/**
 * Local timer history stored in AsyncStorage (timer_history key).
 * Fields: id, start_time, end_time, duration_ms, submitted_at?
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TIMER_HISTORY_CACHE_KEY = 'timer_history';

export type TimerSession = {
  id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  submitted_at?: string;
};

export type TimerSubmitPayload = {
  start_time: string;
  end_time: string;
  duration_ms: number;
};

const dateTimeFormat: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
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

export const prependTimerSession = (
  sessions: TimerSession[],
  session: TimerSession
): TimerSession[] => {
  const withoutDuplicate = sessions.filter((s) => s.id !== session.id);
  return sortNewestFirst([session, ...withoutDuplicate]);
};
