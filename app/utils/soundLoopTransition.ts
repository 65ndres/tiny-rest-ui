/** Max seconds before track end to start overlapping the next loop. */
export const CROSSFADE_SECONDS = 5;
export const CROSSFADE_STEPS = 80;
/** Treat player as already primed at the start of the next loop. */
export const PRIMED_SEEK_EPSILON = 0.08;

/**
 * How early to start the dual-player overlap.
 * Caps at CROSSFADE_SECONDS and scales down for short clips.
 */
export const getCrossfadeWindow = (durationSeconds: number): number => {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }
  return Math.min(
    CROSSFADE_SECONDS,
    Math.max(0.8, durationSeconds * 0.35)
  );
};

/** True when the active player is close enough to the end to start the next loop. */
export const shouldStartCrossfade = (params: {
  currentTime: number;
  duration: number;
}): boolean => {
  const { currentTime, duration } = params;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;

  const remaining = duration - currentTime;
  return remaining <= getCrossfadeWindow(duration);
};

/** Skip seekTo(0) when the next player is already primed near the start. */
export const shouldSeekBeforeCrossfade = (currentTime: number): boolean =>
  !Number.isFinite(currentTime) || currentTime > PRIMED_SEEK_EPSILON;

/**
 * Foreground uses dual-player crossfade (no silence gap).
 * Background/locked uses native loop because JS timers freeze.
 */
export const shouldUseNativeLoop = (
  appState: 'active' | 'background' | 'inactive' | 'unknown' | 'extension'
): boolean => appState !== 'active';

/**
 * Volume curve for overlapping loops: fade out the ending clip while
 * bringing the next clip up slightly faster early to cover any gap.
 */
export const getCrossfadeVolumes = (params: {
  step: number;
  steps?: number;
  targetVolume: number;
}): { fromVolume: number; toVolume: number } => {
  const steps = params.steps ?? CROSSFADE_STEPS;
  const t = Math.min(1, Math.max(0, params.step / steps));
  const eased = Math.min(1, t * 1.15);
  const target = Math.min(1, Math.max(0, params.targetVolume));
  return {
    fromVolume: target * (1 - eased),
    toVolume: target * Math.min(1, eased),
  };
};
