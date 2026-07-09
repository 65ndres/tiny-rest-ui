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
  active_sleep: SleepPredictionActiveSleep | null;
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

export const formatPredictionDisplay = (
  prediction: SleepPrediction
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
        label: 'next nap',
        value: '--:--',
        subtitle: 'Set birthdate in Settings',
      };
    case 'next_nap':
    default:
      return {
        label: 'next nap',
        value: prediction.predicted_at
          ? formatPredictionTime(prediction.predicted_at)
          : '--:--',
      };
  }
};
