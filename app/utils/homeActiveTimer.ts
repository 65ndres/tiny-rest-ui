import type { SleepPredictionDisplay } from '@/app/utils/sleepPrediction';
import {
  FEEDING_RUN_TYPES,
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
 * Home panel text for a running feeding timer, shaped like the sleep timer's
 * ("napping" / "now" / "12 min"). `pausedElapsedMs` freezes the minutes when
 * the timer is paused on this device.
 */
export const formatFeedingTimerDisplay = (
  run: TimerRunApiRecord,
  now: Date = new Date(),
  pausedElapsedMs: number | null = null
): SleepPredictionDisplay => {
  const elapsedMs =
    pausedElapsedMs ?? now.getTime() - new Date(run.start_time).getTime();
  const minutes = Number.isNaN(elapsedMs)
    ? null
    : Math.max(0, Math.floor(elapsedMs / 60000));

  return {
    label: feedingTimerLabel(run),
    value: 'now',
    subtitle:
      minutes == null
        ? undefined
        : pausedElapsedMs != null
          ? `${minutes} min · paused`
          : `${minutes} min`,
  };
};
