export const DEFAULT_DAY_START_MINUTES = 570; // 9:30 AM
export const DEFAULT_DAY_END_MINUTES = 1320; // 10:00 PM

export const normalizeDayMinutes = (
  value: number | null | undefined,
  fallback: number
): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  if (value < 0 || value > 1439) return fallback;
  return Math.floor(value);
};

export const minutesToDate = (minutes: number, baseDate = new Date()): Date => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    mins,
    0,
    0
  );
};

export const dateToMinutes = (date: Date): number =>
  date.getHours() * 60 + date.getMinutes();

export const minutesToDisplayTime = (minutes: number): string => {
  const date = minutesToDate(minutes);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};
