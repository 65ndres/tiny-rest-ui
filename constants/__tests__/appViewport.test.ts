import { Dimensions } from 'react-native';
import {
  APP_MAX_HEIGHT,
  APP_MAX_WIDTH,
  APP_MIN_HEIGHT,
  APP_MIN_WIDTH,
  clampAppWindow,
  getAppWindow,
  vh,
} from '../appViewport';

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({
      width: 440,
      height: 956,
      scale: 3,
      fontScale: 1,
    })),
  },
}));

const mockWindow = (width: number, height: number) => {
  (Dimensions.get as jest.Mock).mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });
};

describe('clampAppWindow', () => {
  it('returns SE size at the minimum', () => {
    expect(clampAppWindow(APP_MIN_WIDTH, APP_MIN_HEIGHT)).toEqual({
      width: 375,
      height: 667,
    });
  });

  it('returns 17 Pro Max size at the maximum', () => {
    expect(clampAppWindow(APP_MAX_WIDTH, APP_MAX_HEIGHT)).toEqual({
      width: 440,
      height: 956,
    });
  });

  it('passes through a mid-size phone unchanged', () => {
    expect(clampAppWindow(393, 852)).toEqual({
      width: 393,
      height: 852,
    });
  });

  it('floors below-SE devices to SE', () => {
    expect(clampAppWindow(320, 568)).toEqual({
      width: APP_MIN_WIDTH,
      height: APP_MIN_HEIGHT,
    });
  });

  it('caps above-Pro-Max devices to 17 Pro Max', () => {
    expect(clampAppWindow(768, 1024)).toEqual({
      width: APP_MAX_WIDTH,
      height: APP_MAX_HEIGHT,
    });
  });
});

describe('getAppWindow', () => {
  it('reads and clamps the device window', () => {
    mockWindow(320, 568);
    expect(getAppWindow()).toEqual({
      width: APP_MIN_WIDTH,
      height: APP_MIN_HEIGHT,
    });

    mockWindow(440, 956);
    expect(getAppWindow()).toEqual({
      width: APP_MAX_WIDTH,
      height: APP_MAX_HEIGHT,
    });
  });
});

describe('vh', () => {
  it('is identity on 17 Pro Max', () => {
    mockWindow(440, 956);
    expect(vh(24)).toBe(24);
    expect(vh(48)).toBe(48);
  });

  it('scales down on iPhone SE', () => {
    mockWindow(375, 667);
    expect(vh(24)).toBeCloseTo(24 * (667 / 956));
    expect(vh(48)).toBeCloseTo(48 * (667 / 956));
  });

  it('interpolates on a mid-size phone', () => {
    mockWindow(393, 852);
    expect(vh(24)).toBeCloseTo(24 * (852 / 956));
  });

  it('does not shrink below SE', () => {
    mockWindow(320, 568);
    expect(vh(24)).toBeCloseTo(24 * (APP_MIN_HEIGHT / APP_MAX_HEIGHT));
  });

  it('does not grow past 17 Pro Max', () => {
    mockWindow(768, 1024);
    expect(vh(24)).toBe(24);
  });
});
