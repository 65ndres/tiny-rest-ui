import {
  CROSSFADE_SECONDS,
  CROSSFADE_STEPS,
  getCrossfadeVolumes,
  getCrossfadeWindow,
  PRIMED_SEEK_EPSILON,
  shouldSeekBeforeCrossfade,
  shouldStartCrossfade,
  shouldUseNativeLoop,
} from '../soundLoopTransition';

describe('getCrossfadeWindow', () => {
  it('uses the full CROSSFADE_SECONDS window for long tracks', () => {
    expect(getCrossfadeWindow(60)).toBe(CROSSFADE_SECONDS);
    expect(getCrossfadeWindow(30)).toBe(CROSSFADE_SECONDS);
  });

  it('scales down for short tracks so overlap still fits', () => {
    expect(getCrossfadeWindow(4)).toBeCloseTo(1.4);
    expect(getCrossfadeWindow(2)).toBe(0.8);
  });

  it('returns 0 for invalid durations', () => {
    expect(getCrossfadeWindow(0)).toBe(0);
    expect(getCrossfadeWindow(-1)).toBe(0);
    expect(getCrossfadeWindow(Number.NaN)).toBe(0);
  });
});

describe('shouldStartCrossfade', () => {
  it('starts the next loop before the current one ends (no silence gap)', () => {
    expect(
      shouldStartCrossfade({ currentTime: 56, duration: 60 })
    ).toBe(true);
    expect(
      shouldStartCrossfade({ currentTime: 54.9, duration: 60 })
    ).toBe(false);
  });

  it('starts earlier on short clips using the scaled window', () => {
    // window = max(0.8, 4 * 0.35) = 1.4
    expect(shouldStartCrossfade({ currentTime: 2.7, duration: 4 })).toBe(true);
    expect(shouldStartCrossfade({ currentTime: 2.0, duration: 4 })).toBe(false);
  });

  it('does not start when duration is unknown', () => {
    expect(shouldStartCrossfade({ currentTime: 1, duration: 0 })).toBe(false);
  });
});

describe('shouldSeekBeforeCrossfade', () => {
  it('skips seek when the next player is already primed near 0', () => {
    expect(shouldSeekBeforeCrossfade(0)).toBe(false);
    expect(shouldSeekBeforeCrossfade(PRIMED_SEEK_EPSILON)).toBe(false);
  });

  it('seeks when the next player is mid-track', () => {
    expect(shouldSeekBeforeCrossfade(1.5)).toBe(true);
  });
});

describe('shouldUseNativeLoop', () => {
  it('uses dual-player crossfade while the app is active (foreground)', () => {
    expect(shouldUseNativeLoop('active')).toBe(false);
  });

  it('falls back to native loop when backgrounded or inactive (lock screen)', () => {
    expect(shouldUseNativeLoop('background')).toBe(true);
    expect(shouldUseNativeLoop('inactive')).toBe(true);
  });
});

describe('getCrossfadeVolumes', () => {
  it('keeps total energy overlapping during the transition', () => {
    const mid = getCrossfadeVolumes({
      step: CROSSFADE_STEPS / 2,
      targetVolume: 1,
    });
    expect(mid.fromVolume).toBeGreaterThan(0);
    expect(mid.toVolume).toBeGreaterThan(0);
    expect(mid.fromVolume + mid.toVolume).toBeGreaterThan(0.9);
  });

  it('ends with the next loop at full target volume', () => {
    const end = getCrossfadeVolumes({
      step: CROSSFADE_STEPS,
      targetVolume: 0.75,
    });
    expect(end.fromVolume).toBeCloseTo(0);
    expect(end.toVolume).toBeCloseTo(0.75);
  });

  it('ramps the incoming loop slightly faster early to cover gaps', () => {
    const early = getCrossfadeVolumes({ step: 8, targetVolume: 1 });
    const linearTo = 8 / CROSSFADE_STEPS;
    expect(early.toVolume).toBeGreaterThan(linearTo);
  });
});
