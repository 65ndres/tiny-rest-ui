jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { getLastNDaysRange } from '../timerHistory';

describe('getLastNDaysRange', () => {
  it('returns ISO bounds covering full local calendar days', () => {
    // Late evening local time — UTC calendar day has already rolled forward.
    const reference = new Date(2026, 7, 11, 22, 59, 0);
    const { from, to } = getLastNDaysRange(10, reference);

    expect(from).toContain('T');
    expect(to).toContain('T');

    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    const expectedFrom = new Date(2026, 7, 2, 0, 0, 0, 0).getTime();
    const expectedToExclusive = new Date(2026, 7, 12, 0, 0, 0, 0).getTime();

    expect(fromMs).toBe(expectedFrom);
    expect(toMs).toBe(expectedToExclusive);
    // Tonight's local session must fall inside [from, to).
    expect(reference.getTime()).toBeGreaterThanOrEqual(fromMs);
    expect(reference.getTime()).toBeLessThan(toMs);
  });

  it('uses a single local day when days is 1', () => {
    const reference = new Date(2026, 7, 11, 15, 0, 0);
    const { from, to } = getLastNDaysRange(1, reference);

    expect(Date.parse(from)).toBe(new Date(2026, 7, 11, 0, 0, 0, 0).getTime());
    expect(Date.parse(to)).toBe(new Date(2026, 7, 12, 0, 0, 0, 0).getTime());
  });
});
