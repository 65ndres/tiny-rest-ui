jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { isTimerSaveEnabled } from '../timerHistory';

describe('isTimerSaveEnabled', () => {
  // Shared by TimerScreen and TimerScreenGuest Save buttons.
  const startTime = new Date('2026-06-01T12:00:00.000Z');
  const endTime = new Date('2026-06-01T12:30:00.000Z');

  it('disables Save when neither Started at nor Ended at is set', () => {
    expect(
      isTimerSaveEnabled({
        startTime: null,
        endTime: null,
        isRunning: false,
      })
    ).toBe(false);
  });

  it('disables Save with Start only (Start pressed or only start picker set)', () => {
    expect(
      isTimerSaveEnabled({
        startTime,
        endTime: null,
        isRunning: true,
      })
    ).toBe(false);
    expect(
      isTimerSaveEnabled({
        startTime,
        endTime: null,
        isRunning: false,
      })
    ).toBe(false);
  });

  it('disables Save with End only (only end picker set)', () => {
    expect(
      isTimerSaveEnabled({
        startTime: null,
        endTime,
        isRunning: false,
      })
    ).toBe(false);
  });

  it('enables Save after Start then Stop (both times set, not running)', () => {
    expect(
      isTimerSaveEnabled({
        startTime,
        endTime,
        isRunning: false,
      })
    ).toBe(true);
  });

  it('enables Save when both times are set via pickers (not running)', () => {
    expect(
      isTimerSaveEnabled({
        startTime,
        endTime,
        isRunning: false,
        isSubmitting: false,
      })
    ).toBe(true);
  });

  it('disables Save while the timer is still running', () => {
    expect(
      isTimerSaveEnabled({
        startTime,
        endTime,
        isRunning: true,
      })
    ).toBe(false);
  });

  it('disables Save while submitting', () => {
    expect(
      isTimerSaveEnabled({
        startTime,
        endTime,
        isRunning: false,
        isSubmitting: true,
      })
    ).toBe(false);
  });

  it('when enabled, both timestamps are present so save can proceed', () => {
    const params = {
      startTime,
      endTime,
      isRunning: false,
      isSubmitting: false,
    };
    expect(isTimerSaveEnabled(params)).toBe(true);
    expect(params.startTime).not.toBeNull();
    expect(params.endTime).not.toBeNull();
  });
});
