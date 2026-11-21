import {
  formatPredictionDisplay,
  type SleepPrediction,
  type SleepPredictionDisplay,
} from '@/app/utils/sleepPrediction';
import {
  FEEDING_RUN_TYPES,
  formatDuration,
  type TimerRunApiRecord,
} from '@/app/utils/timerHistory';

export const isFeedingTimerRun = (
  run: TimerRunApiRecord | null | undefined
): run is TimerRunApiRecord =>
  run?.run_type != null && FEEDING_RUN_TYPES.includes(run.run_type);

const feedingTimerLabel = (run: TimerRunApiRecord): string => {
  switch (run.run_type) {
    case 'nursing_left':
      return 'nursing left';
    case 'nursing_right':
      return 'nursing right';
    default:
      return 'bottle feeding';
  }
};

/**
 * A running timer's elapsed time as `HH:MM:SS`, like the timer screens.
 * `pausedElapsedMs` freezes it when the timer is paused on this device.
 */
const runningElapsedMs = (
  startTimeIso: string,
  now: Date,
  pausedElapsedMs: number | null
): number | undefined => {
  const elapsedMs =
    pausedElapsedMs ?? now.getTime() - new Date(startTimeIso).getTime();
  return Number.isNaN(elapsedMs) ? undefined : Math.max(0, elapsedMs);
};

export const formatRunningElapsed = (
  startTimeIso: string,
  now: Date,
  pausedElapsedMs: number | null
): string | undefined => {
  const elapsedMs = runningElapsedMs(startTimeIso, now, pausedElapsedMs);
  return elapsedMs == null ? undefined : formatDuration(elapsedMs);
};

/**
 * The Home panel's big value becomes the running clock (falling back to "now"
 * if the start time is unreadable); the line below only notes a pause.
 */
const runningTimerDisplay = (
  label: string,
  startTimeIso: string,
  now: Date,
  pausedElapsedMs: number | null
): SleepPredictionDisplay => {
  const elapsedMs = runningElapsedMs(startTimeIso, now, pausedElapsedMs);
  return {
    label,
    value: elapsedMs == null ? 'now' : formatDuration(elapsedMs),
    subtitle: pausedElapsedMs != null ? 'Paused' : undefined,
    elapsedMs,
  };
};

/** Home panel text for a running feeding timer ("nursing left" / clock). */
export const formatFeedingTimerDisplay = (
  run: TimerRunApiRecord,
  now: Date = new Date(),
  pausedElapsedMs: number | null = null
): SleepPredictionDisplay =>
  runningTimerDisplay(feedingTimerLabel(run), run.start_time, now, pausedElapsedMs);

/**
 * Home panel text for a running sleep timer ("napping" / clock). The clock
 * counts from the sleep's start time rather than the API's whole minutes, so
 * it ticks between fetches.
 */
export const formatSleepTimerDisplay = (
  prediction: SleepPrediction,
  now: Date = new Date(),
  pausedElapsedMs: number | null = null
): SleepPredictionDisplay => {
  const display = formatPredictionDisplay(prediction, now);
  const startTime = prediction.active_sleep?.start_time;
  return startTime
    ? runningTimerDisplay(display.label, startTime, now, pausedElapsedMs)
    : display;
};
