import React, { useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Carousel, {
  type ICarouselInstance,
} from 'react-native-reanimated-carousel';
import { Text } from '@/components/ui/text';
import {
  appliedFontScale,
  homeHintClassName,
  homeHintStyle,
  layout,
  lineHeightFor,
  mutedTextClassName,
  mutedTextStyle,
} from '@/app/constants/screenLayout';
import TimerElapsedDisplay from '@/app/sharedComponents/TimerElapsedDisplay';
import type { SleepPredictionDisplay } from '@/app/utils/sleepPrediction';

export type HomeNapPredictionSlide = {
  count: number;
  display: SleepPredictionDisplay;
};

type HomeNapPredictionCarouselProps = {
  slides: HomeNapPredictionSlide[];
  activeCount: number;
  onChange: (count: number) => void;
  width: number;
  disabled?: boolean;
};

const LABEL_LINE_HEIGHT = lineHeightFor(layout.fontLg);
const VALUE_LINE_HEIGHT = lineHeightFor(layout.font5xl);
const SUBTITLE_LINE_HEIGHT = lineHeightFor(layout.fontSm);

// Status label + value + a small line below (a running clock's HOURS / MIN /
// SEC labels, or a hint) + optional subtitle. Line heights grow with the
// user's text size, so the height has to grow with them.
const predictionCarouselHeight = (fontScale: number): number =>
  layout.space16 +
  layout.space8 * 3 +
  (LABEL_LINE_HEIGHT + VALUE_LINE_HEIGHT + SUBTITLE_LINE_HEIGHT * 2) *
    fontScale;

const HomeNapPredictionCarousel: React.FC<HomeNapPredictionCarouselProps> = ({
  slides,
  activeCount,
  onChange,
  width,
  disabled = false,
}) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const { fontScale } = useWindowDimensions();
  const carouselHeight = predictionCarouselHeight(appliedFontScale(fontScale));
  const defaultIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.count === activeCount)
  );
  const activeIndex = defaultIndex;
  // Swipe between nap schedules; the dots are the only indicator. A running
  // timer locks the switcher, so the dots hide too.
  const showDots = slides.length > 1 && !disabled;

  if (width <= 0 || slides.length === 0) {
    return null;
  }

  return (
    <View className="w-full items-center">
      <View
        className="w-full"
        style={{ height: carouselHeight }}
        // Without arrows, screen readers change schedule by swiping up/down.
        {...(showDots
          ? {
              accessible: true,
              accessibilityRole: 'adjustable' as const,
              accessibilityLabel: 'Nap schedule',
              accessibilityValue: {
                text: `${slides[activeIndex].display.label} ${slides[activeIndex].display.value}, schedule ${activeIndex + 1} of ${slides.length}`,
              },
              accessibilityActions: [
                { name: 'increment' as const },
                { name: 'decrement' as const },
              ],
              onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) => {
                if (event.nativeEvent.actionName === 'increment') {
                  if (activeIndex < slides.length - 1) carouselRef.current?.next();
                } else if (activeIndex > 0) {
                  carouselRef.current?.prev();
                }
              },
            }
          : {})}
      >
        <Carousel
          ref={carouselRef}
          key={slides.map((slide) => slide.count).join('-')}
          width={width}
          height={carouselHeight}
          data={slides}
          loop={false}
          autoPlay={false}
          pagingEnabled
          enabled={!disabled}
          defaultIndex={defaultIndex}
          onSnapToItem={(index) => {
            const slide = slides[index];
            if (slide && !disabled) onChange(slide.count);
          }}
          renderItem={({ item }) => (
            <View
              className="w-full items-center justify-center"
              style={{
                // Centered in the full panel height.
                height: carouselHeight,
              }}
            >
              <Text
                className={mutedTextClassName}
                style={[
                  mutedTextStyle,
                  {
                    fontSize: layout.fontLg,
                    lineHeight: LABEL_LINE_HEIGHT,
                  },
                ]}
              >
                {item.display.label}
              </Text>
              {item.display.elapsedMs != null ? (
                // Same HOURS / MIN / SEC clock as the timer screens.
                <TimerElapsedDisplay
                  elapsedMs={item.display.elapsedMs}
                  digitTopPadding={layout.space8}
                />
              ) : (
                <Text
                  className="text-white font-mono tracking-wider"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={{
                    fontSize: layout.font5xl,
                    lineHeight: VALUE_LINE_HEIGHT,
                    marginTop: layout.space16,
                  }}
                >
                  {item.display.value}
                </Text>
              )}
              {item.display.subtitle ? (
                <Text
                  className={homeHintClassName}
                  style={[
                    homeHintStyle,
                    {
                      fontSize: layout.fontSm,
                      lineHeight: SUBTITLE_LINE_HEIGHT,
                      marginTop: layout.space8,
                    },
                  ]}
                >
                  {item.display.subtitle}
                </Text>
              ) : null}
            </View>
          )}
        />
      </View>
      {showDots ? (
        <View
          className="flex-row items-center justify-center"
          style={{ marginTop: layout.space8, gap: layout.space8 }}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.count}
              className={`rounded-full ${
                index === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
              style={{ height: layout.space6, width: layout.space6 }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default HomeNapPredictionCarousel;
