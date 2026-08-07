jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { resolveTimerPickerValue } from '../timerHistory';

describe('resolveTimerPickerValue', () => {
  const now = new Date('2026-08-07T15:30:00.000Z');

  it('uses now when the field is empty (after Reset / first load)', () => {
    expect(resolveTimerPickerValue(null, now)).toEqual(now);
  });

  it('uses now for epoch-anchored picker dates', () => {
    const epochAnchored = new Date(0);
    epochAnchored.setHours(10, 15, 0, 0);
    expect(resolveTimerPickerValue(epochAnchored, now)).toEqual(now);
  });

  it('uses now for invalid dates', () => {
    expect(resolveTimerPickerValue(new Date(Number.NaN), now)).toEqual(now);
  });

  it('keeps a real field value for the selector', () => {
    const fieldValue = new Date('2026-06-01T12:00:00.000Z');
    expect(resolveTimerPickerValue(fieldValue, now)).toEqual(fieldValue);
  });
});
