import {
  DEFAULT_NAP_SCHEDULE,
  formatExactNapCount,
  formatNapSchedulePhrase,
  napScheduleFromProfile,
  NAP_SCHEDULE_OPTIONS,
} from '../napSchedule';

describe('napSchedule', () => {
  it('includes exact counts and the three range options', () => {
    expect(NAP_SCHEDULE_OPTIONS.map((option) => option.id)).toEqual([
      '1',
      '1_or_2',
      '2',
      '2_or_3',
      '3',
      '3_or_4',
      '4',
      '5',
    ]);
  });

  it('round-trips profile count and alt to the matching option', () => {
    expect(napScheduleFromProfile(2, 3).id).toBe('2_or_3');
    expect(napScheduleFromProfile(3, null).id).toBe('3');
    expect(napScheduleFromProfile(1, 2).label).toBe('1 or 2 naps');
  });

  it('falls back to exact count when alt is invalid', () => {
    expect(napScheduleFromProfile(2, 5).id).toBe('2');
    expect(napScheduleFromProfile(null, 3).id).toBe(DEFAULT_NAP_SCHEDULE.id);
  });

  it('formats labels and trust-slide phrases', () => {
    expect(formatExactNapCount(1)).toBe('1 nap');
    expect(formatExactNapCount(3)).toBe('3 naps');
    expect(formatNapSchedulePhrase(napScheduleFromProfile(2, 3))).toBe(
      '2 or 3 naps a day'
    );
    expect(formatNapSchedulePhrase(napScheduleFromProfile(1, null))).toBe(
      '1 nap a day'
    );
  });
});
