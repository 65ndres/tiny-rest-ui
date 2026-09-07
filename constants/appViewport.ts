import { Dimensions } from 'react-native';

/** Logical points for iPhone SE 3rd gen (4.7"). */
export const APP_MIN_WIDTH = 375;
export const APP_MIN_HEIGHT = 667;

/**
 * Logical points for iPhone 17 Pro Max (6.9").
 * Content (not the full-bleed background) never lays out wider/taller than this.
 */
export const APP_MAX_WIDTH = 440;
export const APP_MAX_HEIGHT = 956;

export type AppWindowSize = {
  width: number;
  height: number;
};

export const clampAppWindow = (
  width: number,
  height: number
): AppWindowSize => ({
  width: Math.min(APP_MAX_WIDTH, Math.max(APP_MIN_WIDTH, width)),
  height: Math.min(APP_MAX_HEIGHT, Math.max(APP_MIN_HEIGHT, height)),
});

/** Device window clamped between iPhone SE and iPhone 17 Pro Max. */
export const getAppWindow = (): AppWindowSize => {
  const { width, height } = Dimensions.get('window');
  return clampAppWindow(width, height);
};

/**
 * Scale a design px value authored at iPhone 17 Pro Max height (956).
 * Identical on Pro Max; shrinks toward SE; clamped outside that range.
 */
export const vh = (designPx: number): number =>
  designPx * (getAppWindow().height / APP_MAX_HEIGHT);

/**
 * Scale a design px value authored at iPhone 17 Pro Max width (440).
 */
export const vw = (designPx: number): number =>
  designPx * (getAppWindow().width / APP_MAX_WIDTH);

/**
 * Horizontal inset that never shrinks below the Pro Max design value.
 * Height-based padding gets too tight on SE; gutters stay at least `designPx`.
 */
export const padX = (designPx: number): number => Math.max(designPx, vw(designPx));

/**
 * Height-based scale of a design value (same as vh).
 * Kept so existing `s()` call sites pick up the new clamp.
 */
export const scaleFromPhoneBaseline = vh;
