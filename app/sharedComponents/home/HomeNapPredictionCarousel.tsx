import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
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
import type { SleepPredictionDisplay } from '@/app/utils/sleepPrediction';

export type HomeNapPredictionSlide = {
  count: number;
  countLabel: string;
  display: SleepPredictionDisplay;
};

type HomeNapPredictionCarouselProps = {
  slides: HomeNapPredictionSlide[];
  activeCount: number;
  onChange: (count: number) => void;
  width: number;
  disabled?: boolean;
};

const CHEVRON_HIT_SLOP = 8;
const SLIDE_PADDING_TOP = 10;
const COUNT_LINE_HEIGHT = lineHeightFor(layout.fontXl);
const LABEL_LINE_HEIGHT = lineHeightFor(layout.fontLg);
const VALUE_LINE_HEIGHT = lineHeightFor(layout.font5xl);
const SUBTITLE_LINE_HEIGHT = lineHeightFor(layout.fontSm);

// Count label + status label + value + optional subtitle. Line heights grow
// with the user's text size, so the height has to grow with them.
const predictionCarouselHeight = (fontScale: number): number =>
  SLIDE_PADDING_TOP +
  layout.space4 +
  layout.space16 +
  layout.space8 +
  (COUNT_LINE_HEIGHT +
    LABEL_LINE_HEIGHT +
    VALUE_LINE_HEIGHT +
    SUBTITLE_LINE_HEIGHT) *
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
  const showChevrons = slides.length > 1;
  const canGoPrev = !disabled && activeIndex > 0;
  const canGoNext = !disabled && activeIndex < slides.length - 1;

  if (width <= 0 || slides.length === 0) {
    return null;
  }

  return (
    <View className="w-full items-center">
      <View className="w-full" style={{ height: carouselHeight }}>
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
                paddingHorizontal: showChevrons ? layout.chevronSize : 0,
                paddingTop: SLIDE_PADDING_TOP,
              }}
            >
              <Text
                className="text-white font-semibold"
                style={{ fontSize: layout.fontXl, lineHeight: COUNT_LINE_HEIGHT }}
              >
                {item.countLabel}
              </Text>
              <Text
                className={mutedTextClassName}
                style={[
                  mutedTextStyle,
                  {
                    fontSize: layout.fontLg,
                    lineHeight: LABEL_LINE_HEIGHT,
                    marginTop: layout.space4,
                  },
                ]}
              >
                {item.display.label}
              </Text>
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
        {showChevrons ? (
          <>
            <Pressable
              onPress={() => {
                if (!canGoPrev) return;
                carouselRef.current?.prev();
              }}
              disabled={!canGoPrev}
              hitSlop={CHEVRON_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Previous nap schedule"
              accessibilityState={{ disabled: !canGoPrev }}
              className="absolute left-0 top-0 items-center justify-center"
              style={{ width: layout.chevronSize, height: carouselHeight }}
            >
              <Ionicons
                name="chevron-back"
                size={layout.iconXl}
                color={canGoPrev ? 'white' : 'rgba(255,255,255,0.25)'}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                if (!canGoNext) return;
                carouselRef.current?.next();
              }}
              disabled={!canGoNext}
              hitSlop={CHEVRON_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Next nap schedule"
              accessibilityState={{ disabled: !canGoNext }}
              className="absolute right-0 top-0 items-center justify-center"
              style={{ width: layout.chevronSize, height: carouselHeight }}
            >
              <Ionicons
                name="chevron-forward"
                size={layout.iconXl}
                color={canGoNext ? 'white' : 'rgba(255,255,255,0.25)'}
              />
            </Pressable>
          </>
        ) : null}
      </View>
      {showChevrons ? (
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
