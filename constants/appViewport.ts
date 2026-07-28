import { Dimensions } from 'react-native';

/**
 * Logical points for iPhone 16 Pro Max.
 * Content (not the full-bleed background) never lays out wider/taller than this.
 */
export const APP_MAX_WIDTH = 440;
export const APP_MAX_HEIGHT = 956;

export type AppWindowSize = {
  width: number;
  height: number;
};

/** Device window capped to iPhone 16 Pro Max — use for content sizing. */
export const getAppWindow = (): AppWindowSize => {
  const { width, height } = Dimensions.get('window');
  return {
    width: Math.min(width, APP_MAX_WIDTH),
    height: Math.min(height, APP_MAX_HEIGHT),
  };
};

/**
 * Scale a design value using the classic 375×812 phone baseline,
 * never larger than the iPhone 16 Pro Max content viewport.
 */
export const scaleFromPhoneBaseline = (value: number): number => {
  const { width, height } = getAppWindow();
  const scale = Math.min(height / 812, width / 375);
  return value * scale;
};
