import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';
import Carousel, {
  type ICarouselInstance,
} from 'react-native-reanimated-carousel';
import { Text } from '@/components/ui/text';
import {
  homeHintClassName,
  mutedTextClassName,
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

const CAROUSEL_HEIGHT = 110;
const CHEVRON_SIZE = 28;
const CHEVRON_HIT_SLOP = 8;

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
      <View className="w-full" style={{ height: CAROUSEL_HEIGHT }}>
        <Carousel
          ref={carouselRef}
          key={slides.map((slide) => slide.count).join('-')}
          width={width}
          height={CAROUSEL_HEIGHT}
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
              style={{ paddingHorizontal: showChevrons ? CHEVRON_SIZE : 0 }}
            >
              <Text className="text-white text-xl font-semibold">
                {item.countLabel}
              </Text>
              <Text className={`${mutedTextClassName} text-lg mt-1`}>
                {item.display.label}
              </Text>
              <Text className="text-white text-5xl font-mono tracking-wider mt-2">
                {item.display.value}
              </Text>
              {item.display.subtitle ? (
                <Text className={`${homeHintClassName} mt-2`}>
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
              style={{ width: CHEVRON_SIZE, height: CAROUSEL_HEIGHT }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
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
              style={{ width: CHEVRON_SIZE, height: CAROUSEL_HEIGHT }}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={canGoNext ? 'white' : 'rgba(255,255,255,0.25)'}
              />
            </Pressable>
          </>
        ) : null}
      </View>
      {showChevrons ? (
        <View className="flex-row items-center justify-center mt-2 gap-2">
          {slides.map((slide, index) => (
            <View
              key={slide.count}
              className={`h-1.5 w-1.5 rounded-full ${
                index === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export default HomeNapPredictionCarousel;
