jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import {
  applyBabyHeader,
  BABY_ID_HEADER,
  babyDisplayName,
  buildSwitchSubmitPayload,
  finishActiveTimerForSwitch,
  isProRequiredError,
  loadStoredBabyId,
  resolveSelectedBabyId,
  resolveSwitchEndTime,
  SELECTED_BABY_STORAGE_KEY,
  storeBabyId,
} from '@/app/utils/babies';
import type { TimerRunApiRecord } from '@/app/utils/timerHistory';

const start = new Date(2026, 10, 18, 9, 0, 0);
const now = new Date(2026, 10, 18, 9, 30, 0);

const runningRun = (
  overrides: Partial<TimerRunApiRecord> = {}
): TimerRunApiRecord => ({
  id: 7,
  baby_id: 1,
  start_time: start.toISOString(),
  end_time: null,
  duration: null,
  submitted: false,
  active: true,
  paused: false,
  run_type: 'nursing_left',
  ...overrides,
});

const apiError = (status: number, data: unknown): AxiosError =>
  new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

describe('babyDisplayName', () => {
  it('falls back to "Baby" when the name is blank', () => {
    expect(babyDisplayName({ name: 'Ana' })).toBe('Ana');
    expect(babyDisplayName({ name: '  ' })).toBe('Baby');
    expect(babyDisplayName({ name: null })).toBe('Baby');
    expect(babyDisplayName(null)).toBe('Baby');
  });
});

describe('resolveSelectedBabyId', () => {
  const babies = [{ id: 3 }, { id: 5 }];

  it('keeps the saved baby when it still exists', () => {
    expect(resolveSelectedBabyId(babies, 5)).toBe(5);
  });

  it('falls back to the first baby when the saved one is gone or unset', () => {
    expect(resolveSelectedBabyId(babies, 9)).toBe(3);
    expect(resolveSelectedBabyId(babies, null)).toBe(3);
  });

  it('is null when there are no babies', () => {
    expect(resolveSelectedBabyId([], 3)).toBeNull();
  });
});

describe('selected baby persistence and header', () => {
  afterEach(() => {
    applyBabyHeader(null);
  });

  it('round-trips the selected id through storage', async () => {
    await storeBabyId(12);
    expect(await AsyncStorage.getItem(SELECTED_BABY_STORAGE_KEY)).toBe('12');
    expect(await loadStoredBabyId()).toBe(12);

    await storeBabyId(null);
    expect(await loadStoredBabyId()).toBeNull();
  });

  it('ignores junk in storage', async () => {
    await AsyncStorage.setItem(SELECTED_BABY_STORAGE_KEY, 'abc');
    expect(await loadStoredBabyId()).toBeNull();
  });

  it('sets and clears the X-Baby-Id header on every request', () => {
    applyBabyHeader(4);
    expect(axios.defaults.headers.common[BABY_ID_HEADER]).toBe('4');

    applyBabyHeader(null);
    expect(axios.defaults.headers.common[BABY_ID_HEADER]).toBeUndefined();
  });
});

describe('resolveSwitchEndTime', () => {
  it('ends a running timer now', () => {
    expect(resolveSwitchEndTime(runningRun(), null, now)).toEqual(now);
  });

  it('ends a timer stopped on this device where it was stopped', () => {
    const tenMinutes = 10 * 60 * 1000;
    expect(resolveSwitchEndTime(runningRun(), tenMinutes, now)).toEqual(
      new Date(start.getTime() + tenMinutes)
    );
  });

  it('ends a timer paused on the server at its pause time', () => {
    const pausedAt = new Date(2026, 10, 18, 9, 12, 0);
    expect(
      resolveSwitchEndTime(
        runningRun({ paused: true, end_time: pausedAt.toISOString() }),
        null,
        now
      )
    ).toEqual(pausedAt);
  });

  it('never ends at or before the start', () => {
    expect(resolveSwitchEndTime(runningRun(), null, start)).toEqual(
      new Date(start.getTime() + 1000)
    );
    expect(resolveSwitchEndTime(runningRun(), 0, now)).toEqual(
      new Date(start.getTime() + 1000)
    );
  });
});

describe('buildSwitchSubmitPayload', () => {
  it('sends the start, end and duration in ms', () => {
    expect(buildSwitchSubmitPayload(runningRun(), null, now)).toEqual({
      start_time: start.toISOString(),
      end_time: now.toISOString(),
      duration_ms: 30 * 60 * 1000,
    });
  });
});

describe('finishActiveTimerForSwitch', () => {
  const baseDeps = () => ({
    token: 'token',
    fetchActiveTimerRun: jest.fn(),
    submitTimerRun: jest.fn(),
    getPausedElapsedForRun: jest.fn(() => null),
    now: () => now,
  });

  it('does nothing when no timer is running', async () => {
    const deps = baseDeps();
    deps.fetchActiveTimerRun.mockResolvedValue(null);

    await expect(finishActiveTimerForSwitch(deps)).resolves.toEqual({
      status: 'none',
    });
    expect(deps.fetchActiveTimerRun).toHaveBeenCalledWith('token', {
      allBabies: true,
    });
    expect(deps.submitTimerRun).not.toHaveBeenCalled();
  });

  it('submits the running timer as a finished entry', async () => {
    const deps = baseDeps();
    const run = runningRun();
    const saved = { ...run, submitted: true, active: false };
    deps.fetchActiveTimerRun.mockResolvedValue(run);
    deps.submitTimerRun.mockResolvedValue(saved);

    await expect(finishActiveTimerForSwitch(deps)).resolves.toEqual({
      status: 'submitted',
      run: saved,
    });
    expect(deps.submitTimerRun).toHaveBeenCalledWith('token', 7, {
      start_time: start.toISOString(),
      end_time: now.toISOString(),
      duration_ms: 30 * 60 * 1000,
    });
  });

  it('uses the locally stopped time when the timer was stopped on screen', async () => {
    const deps = baseDeps();
    deps.fetchActiveTimerRun.mockResolvedValue(runningRun({ run_type: 'sleeping' }));
    deps.getPausedElapsedForRun.mockReturnValue(5 * 60 * 1000 as never);
    deps.submitTimerRun.mockImplementation(async (_t, _id, payload) => ({
      ...runningRun(),
      ...payload,
    }));

    await finishActiveTimerForSwitch(deps);

    expect(deps.getPausedElapsedForRun).toHaveBeenCalledWith(start.toISOString());
    expect(deps.submitTimerRun.mock.calls[0][2].duration_ms).toBe(5 * 60 * 1000);
  });

  it('reports the API error when the entry cannot be saved', async () => {
    const deps = baseDeps();
    const run = runningRun();
    deps.fetchActiveTimerRun.mockResolvedValue(run);
    deps.submitTimerRun.mockRejectedValue(
      apiError(422, { errors: ['This overlaps a nap.'] })
    );

    await expect(finishActiveTimerForSwitch(deps)).resolves.toEqual({
      status: 'failed',
      run,
      message: 'This overlaps a nap.',
    });
  });

  it('throws when the running timer cannot be looked up', async () => {
    const deps = baseDeps();
    deps.fetchActiveTimerRun.mockRejectedValue(new Error('offline'));

    await expect(finishActiveTimerForSwitch(deps)).rejects.toThrow('offline');
  });
});

describe('isProRequiredError', () => {
  it('detects the pro_required refusal', () => {
    expect(isProRequiredError(apiError(403, { code: 'pro_required' }))).toBe(true);
    expect(isProRequiredError(apiError(403, {}))).toBe(false);
    expect(isProRequiredError(apiError(422, { code: 'pro_required' }))).toBe(false);
    expect(isProRequiredError(new Error('nope'))).toBe(false);
  });
});
