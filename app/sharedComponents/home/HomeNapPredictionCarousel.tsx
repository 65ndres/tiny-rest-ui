import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';
import Carousel, {
  type ICarouselInstance,
} from 'react-native-reanimated-carousel';
import { Text } from '@/components/ui/text';
import {
  homeHintClassName,
  homeHintStyle,
  layout,
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
const PREDICTION_CAROUSEL_HEIGHT =
  SLIDE_PADDING_TOP +
  layout.fontXl * 1.3 +
  layout.space4 +
  layout.fontLg * 1.3 +
  layout.space32 +
  layout.font5xl +
  layout.space8 +
  layout.fontSm * 1.3 +
  layout.space8;

const HomeNapPredictionCarousel: React.FC<HomeNapPredictionCarouselProps> = ({
  slides,
  activeCount,
  onChange,
  width,
  disabled = false,
}) => {
  const carouselRef = useRef<ICarouselInstance>(null);
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
      <View className="w-full" style={{ height: PREDICTION_CAROUSEL_HEIGHT }}>
        <Carousel
          ref={carouselRef}
          key={slides.map((slide) => slide.count).join('-')}
          width={width}
          height={PREDICTION_CAROUSEL_HEIGHT}
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
                style={{ fontSize: layout.fontXl }}
              >
                {item.countLabel}
              </Text>
              <Text
                className={mutedTextClassName}
                style={[mutedTextStyle, { fontSize: layout.fontLg, marginTop: layout.space4 }]}
              >
                {item.display.label}
              </Text>
              <Text
                className="text-white font-mono tracking-wider"
                style={{ fontSize: layout.font5xl, marginTop: layout.space32, lineHeight: layout.font5xl }}
              >
                {item.display.value}
              </Text>
              {item.display.subtitle ? (
                <Text
                  className={homeHintClassName}
                  style={[homeHintStyle, { marginTop: layout.space8 }]}
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
              style={{ width: layout.chevronSize, height: PREDICTION_CAROUSEL_HEIGHT }}
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
              style={{ width: layout.chevronSize, height: PREDICTION_CAROUSEL_HEIGHT }}
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
