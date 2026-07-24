import { ExtensionStorage } from '@bacons/apple-targets';
import {
  fetchSleepPrediction,
  formatPredictionDisplay,
  type SleepPredictionDisplay,
} from '@/app/utils/sleepPrediction';
import {
  fetchActiveTimerRun,
  formatDuration,
  type TimerRunApiRecord,
  type TimerRunType,
} from '@/app/utils/timerHistory';

const APP_GROUP = 'group.com.afre92.tinyrest';

const KEYS = {
  mode: 'widget.mode',
  label: 'widget.label',
  value: 'widget.value',
  subtitle: 'widget.subtitle',
  timerType: 'widget.timerType',
  timerStart: 'widget.timerStart',
  timerPaused: 'widget.timerPaused',
  timerElapsed: 'widget.timerElapsed',
} as const;

const storage = new ExtensionStorage(APP_GROUP);

const reload = () => {
  ExtensionStorage.reloadWidget();
};

const isPausedFlag = (raw: string | null): boolean =>
  raw === '1' || Number(raw) === 1;

const sameStartTime = (a: string | null, b: string): boolean => {
  if (a == null) return false;
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  return Number.isFinite(aMs) && Number.isFinite(bMs) && Math.abs(aMs - bMs) < 2000;
};

const parseElapsedString = (elapsedStr: string | null): number => {
  if (!elapsedStr) return 0;
  const parts = elapsedStr.split(':').map((p) => Number(p));
  if (parts.length !== 3 || !parts.every((n) => Number.isFinite(n))) return 0;
  return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
};

export type SyncWidgetTimerOptions = {
  paused?: boolean;
  elapsedMs?: number;
};

export type LocalTimerWidgetState = {
  startTime: Date;
  endTime?: Date | null;
  isRunning: boolean;
  runType: TimerRunType;
};

/** If the widget has this run paused, returns frozen elapsed ms; otherwise null. */
export const getStoredPausedElapsedForRun = (
  startTimeIso: string
): number | null => {
  const storedStart = storage.get(KEYS.timerStart);
  if (!sameStartTime(storedStart, startTimeIso)) return null;
  if (!isPausedFlag(storage.get(KEYS.timerPaused))) return null;
  return parseElapsedString(storage.get(KEYS.timerElapsed));
};

export const syncWidgetPrediction = (display: SleepPredictionDisplay): void => {
  storage.set(KEYS.mode, 'prediction');
  storage.set(KEYS.label, display.label);
  storage.set(KEYS.value, display.value);
  if (display.subtitle) {
    storage.set(KEYS.subtitle, display.subtitle);
  } else {
    storage.remove(KEYS.subtitle);
  }
  storage.remove(KEYS.timerType);
  storage.remove(KEYS.timerStart);
  storage.remove(KEYS.timerPaused);
  storage.remove(KEYS.timerElapsed);
  reload();
};

export const syncWidgetActiveTimer = (
  run: Pick<TimerRunApiRecord, 'start_time' | 'run_type'> | null,
  options?: SyncWidgetTimerOptions
): void => {
  if (!run) {
    clearWidgetTimer();
    reload();
    return;
  }

  const timerType: TimerRunType = run.run_type ?? 'sleeping';
  const paused = options?.paused === true;
  const elapsedMs = options?.elapsedMs ?? 0;

  storage.set(KEYS.mode, 'timer');
  storage.set(KEYS.timerType, timerType);
  storage.set(KEYS.timerStart, run.start_time);
  storage.set(KEYS.timerPaused, paused ? 1 : 0);

  if (paused) {
    storage.set(KEYS.timerElapsed, formatDuration(elapsedMs));
    storage.set(KEYS.subtitle, 'paused');
  } else {
    storage.remove(KEYS.timerElapsed);
    storage.remove(KEYS.subtitle);
  }

  storage.remove(KEYS.label);
  storage.remove(KEYS.value);
  reload();
};

/** Push the current on-screen timer (running or paused) to the widget. */
export const syncLocalTimerToWidget = (state: LocalTimerWidgetState): void => {
  const startIso = state.startTime.toISOString();
  if (state.isRunning) {
    syncWidgetActiveTimer({
      start_time: startIso,
      run_type: state.runType,
    });
    return;
  }

  const end = state.endTime ?? new Date();
  const elapsedMs = Math.max(0, end.getTime() - state.startTime.getTime());
  syncWidgetActiveTimer(
    { start_time: startIso, run_type: state.runType },
    { paused: true, elapsedMs }
  );
};

export const clearWidgetTimer = (): void => {
  storage.remove(KEYS.mode);
  storage.remove(KEYS.timerType);
  storage.remove(KEYS.timerStart);
  storage.remove(KEYS.timerPaused);
  storage.remove(KEYS.timerElapsed);
  storage.remove(KEYS.subtitle);
  storage.remove(KEYS.label);
  storage.remove(KEYS.value);
};

/**
 * Prefer any active timer; otherwise write Home-style sleep prediction.
 * Preserves a locally paused widget when the same active run is still open.
 */
export const refreshWidgetState = async (token: string): Promise<void> => {
  try {
    const activeRun = await fetchActiveTimerRun(token);
    if (activeRun) {
      const storedStart = storage.get(KEYS.timerStart);
      const storedPaused = isPausedFlag(storage.get(KEYS.timerPaused));
      const sameRun = sameStartTime(storedStart, activeRun.start_time);
      const paused = activeRun.paused === true || (sameRun && storedPaused);

      if (paused) {
        const elapsedMs =
          parseElapsedString(storage.get(KEYS.timerElapsed)) ||
          (activeRun.duration != null ? activeRun.duration : 0);
        syncWidgetActiveTimer(activeRun, { paused: true, elapsedMs });
        return;
      }

      syncWidgetActiveTimer(activeRun, { paused: false });
      return;
    }

    const prediction = await fetchSleepPrediction(token);
    syncWidgetPrediction(formatPredictionDisplay(prediction));
  } catch {
    // Keep last known widget payload on failure.
  }
};
