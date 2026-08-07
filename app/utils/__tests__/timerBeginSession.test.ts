jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { beginTimerSession } from '../timerHistory';

describe('beginTimerSession', () => {
  // Shared Start-button state for TimerScreen and TimerScreenGuest.

  it('starts the timer when Start is pressed with no prior start time', () => {
    const now = new Date('2026-06-01T12:00:00.000Z');
    const session = beginTimerSession(null, now);

    expect(session.isRunning).toBe(true);
    expect(session.startTime).toEqual(now);
    expect(session.endTime).toBeNull();
    expect(session.hasStoppedSession).toBe(false);
    expect(session.elapsedMs).toBe(0);
  });

  it('starts using an existing Started at from the picker', () => {
    const pickedStart = new Date('2026-06-01T11:45:00.000Z');
    const now = new Date('2026-06-01T12:00:00.000Z');
    const session = beginTimerSession(pickedStart, now);

    expect(session.isRunning).toBe(true);
    expect(session.startTime).toEqual(pickedStart);
    expect(session.endTime).toBeNull();
    expect(session.elapsedMs).toBe(15 * 60 * 1000);
  });

  it('clears Ended at when starting (resume / restart)', () => {
    const startTime = new Date('2026-06-01T11:00:00.000Z');
    const now = new Date('2026-06-01T12:00:00.000Z');
    const session = beginTimerSession(startTime, now);

    expect(session.endTime).toBeNull();
    expect(session.hasStoppedSession).toBe(false);
    expect(session.isRunning).toBe(true);
  });
});
