jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  findOverlappingSession,
  formatOverlapMessage,
  type TimerSession,
} from '@/app/utils/timerHistory';

const local = (hours: number, minutes = 0): Date =>
  new Date(2026, 5, 1, hours, minutes);

const entry = (
  id: string,
  start: Date,
  end: Date,
  run_type: TimerSession['run_type'] = 'sleeping'
): TimerSession => ({
  id,
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  duration_ms: end.getTime() - start.getTime(),
  run_type,
});

describe('findOverlappingSession', () => {
  const nap = entry('nap', local(12), local(14));
  const bottle = entry('bottle', local(15), local(15), 'bottle');
  const sessions = [nap, bottle];

  it('finds an entry that shares time', () => {
    expect(
      findOverlappingSession(sessions, { start: local(13), end: local(13, 30) })
    ).toBe(nap);
  });

  it('finds a bottle feeding inside the candidate', () => {
    expect(
      findOverlappingSession(sessions, { start: local(14, 30), end: local(16) })
    ).toBe(bottle);
  });

  it('treats an instant candidate inside an entry as an overlap', () => {
    expect(
      findOverlappingSession(sessions, { start: local(13), end: local(13) })
    ).toBe(nap);
  });

  it('allows entries that only touch at the edges', () => {
    expect(
      findOverlappingSession(sessions, { start: local(14), end: local(15) })
    ).toBeNull();
  });

  it('ignores the entry being edited', () => {
    expect(
      findOverlappingSession(sessions, {
        id: 'nap',
        start: local(11),
        end: local(14, 30),
      })
    ).toBeNull();
  });
});

describe('formatOverlapMessage', () => {
  it('describes a bottle feeding by its time', () => {
    expect(
      formatOverlapMessage(entry('b', local(15), local(15), 'bottle'))
    ).toMatch(/^This overlaps a bottle feeding at .*3:00.*\. A baby can only sleep or feed at one time\.$/);
  });

  it('describes nursing with its range', () => {
    expect(
      formatOverlapMessage(entry('n', local(2), local(2, 20), 'nursing_left'))
    ).toMatch(/a nursing session from .*2:00.* to .*2:20/);
  });
});
