jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  isUsableTimerPickerDate,
  resolveTimerPickerValue,
} from '../timerHistory';

describe('resolveTimerPickerValue', () => {
  const now = new Date('2026-08-07T15:30:00.000Z');

  it('defaults empty Started at to today/now', () => {
    expect(resolveTimerPickerValue(null, now)).toEqual(now);
  });

  it('defaults empty Ended at to today/now (same as Started at)', () => {
    const emptyEndTime: Date | null = null;
    expect(resolveTimerPickerValue(emptyEndTime, now)).toEqual(now);
  });

  it('does not surface epoch Dec 31 junk as the picker value', () => {
    const epochAnchored = new Date(0);
    epochAnchored.setHours(10, 15, 0, 0);
    expect(isUsableTimerPickerDate(epochAnchored)).toBe(false);
    expect(resolveTimerPickerValue(epochAnchored, now)).toEqual(now);
  });

  it('uses now for invalid dates', () => {
    expect(isUsableTimerPickerDate(new Date(Number.NaN))).toBe(false);
    expect(resolveTimerPickerValue(new Date(Number.NaN), now)).toEqual(now);
  });

  it('keeps a real selected field value for the selector', () => {
    const fieldValue = new Date('2026-06-01T12:00:00.000Z');
    expect(isUsableTimerPickerDate(fieldValue)).toBe(true);
    expect(resolveTimerPickerValue(fieldValue, now)).toEqual(fieldValue);
  });
});

describe('isUsableTimerPickerDate', () => {
  it('rejects null and epoch-anchored dates so they cannot be committed', () => {
    expect(isUsableTimerPickerDate(null)).toBe(false);
    expect(isUsableTimerPickerDate(undefined)).toBe(false);
    expect(isUsableTimerPickerDate(new Date(0))).toBe(false);
  });

  it('accepts normal calendar dates', () => {
    expect(isUsableTimerPickerDate(new Date('2026-08-07T12:00:00.000Z'))).toBe(
      true
    );
  });
});
