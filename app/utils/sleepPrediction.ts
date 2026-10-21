import axios from 'axios';
import { API_URL } from '@/constants/Config';

export type SleepPredictionStatus =
  | 'next_nap'
  | 'currently_napping'
  | 'currently_sleeping'
  | 'bedtime'
  | 'needs_birthdate';

export type SleepPredictionActiveSleep = {
  start_time: string;
  elapsed_minutes: number;
};

export type SleepPrediction = {
  status: SleepPredictionStatus;
  predicted_at: string | null;
  wake_window_minutes: number | null;
  naps_today: number;
  daily_nap_count: number;
  daily_nap_count_alt?: number | null;
  active_sleep: SleepPredictionActiveSleep | null;
  range_predictions?: SleepPrediction[];
};

export type SleepPredictionDisplay = {
  label: string;
  value: string;
  subtitle?: string;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const fetchSleepPrediction = async (
  token: string
): Promise<SleepPrediction> => {
  const response = await axios.get<SleepPrediction>(
    `${API_URL}/sleep_prediction`,
    { headers: authHeaders(token) }
  );
  return response.data;
};

const formatPredictionTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Matches the API: an unstarted nap stays the prediction this long past its
// time, after which the API moves on to the next slot.
export const MISSED_NAP_GRACE_MINUTES = 20;

/** Whole minutes a predicted nap is past due, or 0 when it is not overdue. */
export const getOverdueMinutes = (
  prediction: SleepPrediction,
  now: Date = new Date()
): number => {
  if (prediction.status !== 'next_nap' || !prediction.predicted_at) return 0;
  const lateMs = now.getTime() - new Date(prediction.predicted_at).getTime();
  return lateMs > 0 ? Math.floor(lateMs / 60000) : 0;
};

const formatMinutesAgo = (minutes: number): string =>
  minutes === 1 ? '1 min ago' : `${minutes} min ago`;

export const isSleepTimerRunning = (
  status: SleepPredictionStatus | undefined
): boolean =>
  status === 'currently_napping' || status === 'currently_sleeping';

/**
 * `relativeOverdue` shows an overdue nap as "10 min ago". Pass false where the
 * text cannot refresh every minute (the widget) to keep the clock time.
 */
export const formatPredictionDisplay = (
  prediction: SleepPrediction,
  now: Date = new Date(),
  { relativeOverdue = true }: { relativeOverdue?: boolean } = {}
): SleepPredictionDisplay => {
  switch (prediction.status) {
    case 'currently_napping':
      return {
        label: 'napping',
        value: 'now',
        subtitle:
          prediction.active_sleep != null
            ? `${prediction.active_sleep.elapsed_minutes} min`
            : undefined,
      };
    case 'currently_sleeping':
      return {
        label: 'sleeping',
        value: 'now',
        subtitle:
          prediction.active_sleep != null
            ? `${prediction.active_sleep.elapsed_minutes} min`
            : undefined,
      };
    case 'bedtime':
      return {
        label: 'bedtime',
        value: prediction.predicted_at
          ? formatPredictionTime(prediction.predicted_at)
          : '--:--',
      };
    case 'needs_birthdate':
      return {
        label: 'next sleep',
        value: '--:--',
        subtitle: 'Set birthdate in Profile',
      };
    case 'next_nap':
    default: {
      const overdueMinutes = getOverdueMinutes(prediction, now);
      if (overdueMinutes > 0 && prediction.predicted_at) {
        const dueTime = formatPredictionTime(prediction.predicted_at);
        return relativeOverdue
          ? {
              label: 'next sleep',
              value: formatMinutesAgo(overdueMinutes),
              subtitle: `Was due at ${dueTime}`,
            }
          : { label: 'next sleep', value: dueTime, subtitle: 'Overdue' };
      }
      return {
        label: 'next sleep',
        value: prediction.predicted_at
          ? formatPredictionTime(prediction.predicted_at)
          : '--:--',
      };
    }
  }
};
