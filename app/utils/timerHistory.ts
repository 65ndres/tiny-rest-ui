/**
 * Timer history: local AsyncStorage for guests, API for authenticated users.
 * Fields: id, start_time, end_time, duration_ms, submitted_at?
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/Config';

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

export type TimerRunApiRecord = {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  submitted: boolean;
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
  };
};

export const fetchTimerRuns = async (
  token: string
): Promise<TimerSession[]> => {
  const response = await axios.get<{ timer_runs: TimerRunApiRecord[] }>(
    `${API_URL}/timer_runs`,
    { headers: authHeaders(token) }
  );

  const sessions = (response.data.timer_runs ?? [])
    .map(mapTimerRunToSession)
    .filter((session): session is TimerSession => session !== null);

  return sortNewestFirst(sessions);
};

export const createTimerRun = async (
  token: string,
  startTime: string
): Promise<TimerRunApiRecord> => {
  const response = await axios.post<{ timer_run: TimerRunApiRecord }>(
    `${API_URL}/timer_runs`,
    { start_time: startTime },
    { headers: authHeaders(token) }
  );

  return response.data.timer_run;
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
    },
    { headers: authHeaders(token) }
  );

  return response.data.timer_run;
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
