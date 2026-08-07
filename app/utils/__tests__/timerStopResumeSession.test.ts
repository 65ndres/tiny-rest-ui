jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  beginTimerSession,
  resumeTimerSession,
  stopTimerSession,
} from '../timerHistory';

describe('stopTimerSession', () => {
  // Shared Stop-button state for TimerScreen and TimerScreenGuest.

  it('stops the timer and sets Ended at when Stop is pressed', () => {
    const startTime = new Date('2026-06-01T12:00:00.000Z');
    const now = new Date('2026-06-01T12:05:00.000Z');
    const session = stopTimerSession(startTime, now);

    expect(session.isRunning).toBe(false);
    expect(session.endTime).toEqual(now);
    expect(session.hasStoppedSession).toBe(true);
    expect(session.elapsedMs).toBe(5 * 60 * 1000);
  });

  it('stops with zero elapsed when start time is missing', () => {
    const now = new Date('2026-06-01T12:05:00.000Z');
    const session = stopTimerSession(null, now);

    expect(session.isRunning).toBe(false);
    expect(session.endTime).toEqual(now);
    expect(session.elapsedMs).toBe(0);
    expect(session.hasStoppedSession).toBe(true);
  });
});

describe('resumeTimerSession', () => {
  // Shared Resume-button state for TimerScreen and TimerScreenGuest.

  it('resumes from the original start and clears Ended at', () => {
    const startTime = new Date('2026-06-01T12:00:00.000Z');
    const stoppedAt = new Date('2026-06-01T12:05:00.000Z');
    const stopped = stopTimerSession(startTime, stoppedAt);

    expect(stopped.isRunning).toBe(false);
    expect(stopped.endTime).toEqual(stoppedAt);

    const resumeAt = new Date('2026-06-01T12:06:00.000Z');
    const session = resumeTimerSession(startTime, resumeAt);

    expect(session.isRunning).toBe(true);
    expect(session.startTime).toEqual(startTime);
    expect(session.endTime).toBeNull();
    expect(session.hasStoppedSession).toBe(false);
    expect(session.elapsedMs).toBe(6 * 60 * 1000);
  });

  it('matches beginTimerSession when resuming with an existing start', () => {
    const startTime = new Date('2026-06-01T11:00:00.000Z');
    const now = new Date('2026-06-01T12:00:00.000Z');

    expect(resumeTimerSession(startTime, now)).toEqual(
      beginTimerSession(startTime, now)
    );
  });
});
