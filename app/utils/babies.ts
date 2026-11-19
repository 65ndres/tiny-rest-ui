/**
 * Baby profiles: one account can track several babies. The selected baby is
 * saved on the device and sent with every API request as `X-Baby-Id`, which
 * scopes timer runs, the active timer and sleep prediction on the server.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/Config';
import {
  getTimerApiErrorMessage,
  type TimerRunApiRecord,
  type TimerSubmitPayload,
} from '@/app/utils/timerHistory';

export const SELECTED_BABY_STORAGE_KEY = 'selected_baby_id';
export const BABY_ID_HEADER = 'X-Baby-Id';
export const DEFAULT_BABY_NAME = 'Baby';
export const MAX_BABY_NAME_LENGTH = 40;

export type Baby = {
  id: number;
  name: string | null;
  birthdate: string | null;
  daily_nap_count: number;
  daily_nap_count_alt: number | null;
  day_start_minutes: number;
  day_end_minutes: number;
};

export type BabyInput = Partial<Omit<Baby, 'id'>>;

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const babyDisplayName = (baby: Pick<Baby, 'name'> | null | undefined) =>
  baby?.name?.trim() || DEFAULT_BABY_NAME;

export const fetchBabies = async (token: string): Promise<Baby[]> => {
  const response = await axios.get<{ babies: Baby[] }>(`${API_URL}/babies`, {
    headers: authHeaders(token),
  });
  return response.data.babies ?? [];
};

export const createBaby = async (
  token: string,
  input: BabyInput
): Promise<{ baby: Baby; babies: Baby[] }> => {
  const response = await axios.post<{ baby: Baby; babies: Baby[] }>(
    `${API_URL}/babies`,
    { baby: input },
    { headers: authHeaders(token) }
  );
  return response.data;
};

export const updateBaby = async (
  token: string,
  id: number,
  input: BabyInput
): Promise<{ baby: Baby; babies: Baby[] }> => {
  const response = await axios.patch<{ baby: Baby; babies: Baby[] }>(
    `${API_URL}/babies/${id}`,
    { baby: input },
    { headers: authHeaders(token) }
  );
  return response.data;
};

export const deleteBaby = async (
  token: string,
  id: number
): Promise<Baby[]> => {
  const response = await axios.delete<{ babies: Baby[] }>(
    `${API_URL}/babies/${id}`,
    { headers: authHeaders(token) }
  );
  return response.data.babies ?? [];
};

/** True when the API refused to add a baby because the account isn't Pro. */
export const isProRequiredError = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  error.response?.status === 403 &&
  (error.response?.data as { code?: string } | undefined)?.code ===
    'pro_required';

/** Send the selected baby with every request (or stop sending one). */
export const applyBabyHeader = (babyId: number | null): void => {
  if (babyId == null) {
    delete axios.defaults.headers.common[BABY_ID_HEADER];
    return;
  }
  axios.defaults.headers.common[BABY_ID_HEADER] = String(babyId);
};

export const loadStoredBabyId = async (): Promise<number | null> => {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_BABY_STORAGE_KEY);
    const id = raw == null ? NaN : Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
};

export const storeBabyId = async (babyId: number | null): Promise<void> => {
  try {
    if (babyId == null) {
      await AsyncStorage.removeItem(SELECTED_BABY_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(SELECTED_BABY_STORAGE_KEY, String(babyId));
    }
  } catch {
    // Selection falls back to the first baby next launch.
  }
};

/** Keep the saved baby if it still exists; otherwise use the first one. */
export const resolveSelectedBabyId = (
  babies: Pick<Baby, 'id'>[],
  storedId: number | null
): number | null => {
  if (storedId != null && babies.some((baby) => baby.id === storedId)) {
    return storedId;
  }
  return babies[0]?.id ?? null;
};

const MIN_TIMER_DURATION_MS = 1000;

/**
 * When a running (or locally stopped) timer is saved because the user is
 * switching babies: a timer stopped on this device ends where it was stopped,
 * one paused on the server ends at its pause time, a running one ends now.
 * Never ends before it started (the API rejects end <= start for timers).
 */
export const resolveSwitchEndTime = (
  run: Pick<TimerRunApiRecord, 'start_time' | 'end_time' | 'paused'>,
  pausedElapsedMs: number | null,
  now: Date = new Date()
): Date => {
  const startMs = Date.parse(run.start_time);
  let endMs = now.getTime();
  if (pausedElapsedMs != null) {
    endMs = startMs + pausedElapsedMs;
  } else if (run.paused && run.end_time) {
    const pausedAt = Date.parse(run.end_time);
    if (Number.isFinite(pausedAt)) endMs = pausedAt;
  }
  return new Date(Math.max(endMs, startMs + MIN_TIMER_DURATION_MS));
};

export const buildSwitchSubmitPayload = (
  run: Pick<TimerRunApiRecord, 'start_time' | 'end_time' | 'paused'>,
  pausedElapsedMs: number | null,
  now: Date = new Date()
): TimerSubmitPayload => {
  const end = resolveSwitchEndTime(run, pausedElapsedMs, now);
  return {
    start_time: run.start_time,
    end_time: end.toISOString(),
    duration_ms: end.getTime() - Date.parse(run.start_time),
  };
};

export type FinishActiveTimerDeps = {
  token: string;
  fetchActiveTimerRun: (
    token: string,
    options: { allBabies: true }
  ) => Promise<TimerRunApiRecord | null>;
  submitTimerRun: (
    token: string,
    id: number,
    payload: TimerSubmitPayload
  ) => Promise<TimerRunApiRecord>;
  /** Elapsed ms when the timer was stopped on this device, else null. */
  getPausedElapsedForRun: (startTimeIso: string) => number | null;
  now?: () => Date;
};

export type FinishActiveTimerResult =
  | { status: 'none' }
  | { status: 'submitted'; run: TimerRunApiRecord }
  | { status: 'failed'; run: TimerRunApiRecord; message: string };

/**
 * Save the account's running timer as a finished entry for the baby it
 * belongs to. Only one timer runs per account, so at most one is saved.
 * Throws when the running timer can't be looked up (e.g. offline).
 */
export const finishActiveTimerForSwitch = async (
  deps: FinishActiveTimerDeps
): Promise<FinishActiveTimerResult> => {
  const run = await deps.fetchActiveTimerRun(deps.token, { allBabies: true });
  if (!run) return { status: 'none' };

  const payload = buildSwitchSubmitPayload(
    run,
    deps.getPausedElapsedForRun(run.start_time),
    deps.now?.() ?? new Date()
  );

  try {
    const saved = await deps.submitTimerRun(deps.token, run.id, payload);
    return { status: 'submitted', run: saved };
  } catch (error) {
    return {
      status: 'failed',
      run,
      message: getTimerApiErrorMessage(error, 'Could not save the timer.'),
    };
  }
};
