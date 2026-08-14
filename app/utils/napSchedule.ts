export type NapScheduleId =
  | '1'
  | '1_or_2'
  | '2'
  | '2_or_3'
  | '3'
  | '3_or_4'
  | '4'
  | '5';

export type NapScheduleOption = {
  id: NapScheduleId;
  label: string;
  daily_nap_count: number;
  daily_nap_count_alt: number | null;
};

export const NAP_SCHEDULE_OPTIONS: NapScheduleOption[] = [
  { id: '1', label: '1 nap', daily_nap_count: 1, daily_nap_count_alt: null },
  {
    id: '1_or_2',
    label: '1 or 2 naps',
    daily_nap_count: 1,
    daily_nap_count_alt: 2,
  },
  { id: '2', label: '2 naps', daily_nap_count: 2, daily_nap_count_alt: null },
  {
    id: '2_or_3',
    label: '2 or 3 naps',
    daily_nap_count: 2,
    daily_nap_count_alt: 3,
  },
  { id: '3', label: '3 naps', daily_nap_count: 3, daily_nap_count_alt: null },
  {
    id: '3_or_4',
    label: '3 or 4 naps',
    daily_nap_count: 3,
    daily_nap_count_alt: 4,
  },
  { id: '4', label: '4 naps', daily_nap_count: 4, daily_nap_count_alt: null },
  { id: '5', label: '5 naps', daily_nap_count: 5, daily_nap_count_alt: null },
];

export const DEFAULT_NAP_SCHEDULE =
  NAP_SCHEDULE_OPTIONS.find((option) => option.id === '3') ??
  NAP_SCHEDULE_OPTIONS[4];

export const formatExactNapCount = (count: number): string =>
  count === 1 ? '1 nap' : `${count} naps`;

export const formatNapSchedulePhrase = (
  option: NapScheduleOption | null | undefined
): string => {
  const schedule = option ?? DEFAULT_NAP_SCHEDULE;
  if (schedule.daily_nap_count_alt != null) {
    return `${schedule.daily_nap_count} or ${schedule.daily_nap_count_alt} naps a day`;
  }
  return schedule.daily_nap_count === 1
    ? '1 nap a day'
    : `${schedule.daily_nap_count} naps a day`;
};

export const napScheduleFromProfile = (
  count: number | null | undefined,
  alt: number | null | undefined
): NapScheduleOption => {
  const normalizedCount =
    count == null || count < 1 || count > 5 ? 3 : count;
  const normalizedAlt = alt == null ? null : alt;
  const match = NAP_SCHEDULE_OPTIONS.find(
    (option) =>
      option.daily_nap_count === normalizedCount &&
      option.daily_nap_count_alt === normalizedAlt
  );
  if (match) return match;

  return (
    NAP_SCHEDULE_OPTIONS.find(
      (option) =>
        option.daily_nap_count === normalizedCount &&
        option.daily_nap_count_alt === null
    ) ?? DEFAULT_NAP_SCHEDULE
  );
};
