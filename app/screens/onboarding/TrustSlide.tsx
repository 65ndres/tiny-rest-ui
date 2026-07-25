import React from 'react';
import { View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  SCREEN_CONTENT_WIDTH_RATIO,
  timerContentStackClassName,
} from '@/app/constants/screenLayout';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import { onboardingWidth } from './onboardingLayout';
import OnboardingSlideShell from './OnboardingSlideShell';

type TrustSlideProps = {
  babyName: string;
  dailyNapCount: number | null;
  onPressNext?: () => void;
};

const REVIEWS = [
  {
    quote: 'I finally stopped guessing nap time. Game changer for our days.',
    author: 'Maya, mom of 1',
    rating: 5,
  },
  {
    quote: 'Wake windows used to stress me out. Now I just check the app.',
    author: 'Jordan, dad of twins',
    rating: 5,
  },
] as const;

const CAROUSEL_WIDTH = onboardingWidth * SCREEN_CONTENT_WIDTH_RATIO;
const CAROUSEL_HEIGHT = 140;

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <Text className="text-white text-base font-semibold mb-2">
    {'★'.repeat(count)}
    {'☆'.repeat(Math.max(0, 5 - count))}
  </Text>
);

const TrustSlide: React.FC<TrustSlideProps> = ({
  babyName,
  dailyNapCount,
  onPressNext,
}) => {
  const [activeReviewIndex, setActiveReviewIndex] = React.useState(0);
  const displayName = babyName.trim() || 'your baby';
  const naps = dailyNapCount ?? 3;
  const napPhrase = naps === 1 ? '1 nap a day' : `${naps} naps a day`;

  return (
    <OnboardingSlideShell>
      <VStack space="md" className={`${timerContentStackClassName} flex-1`}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 40,
            }}
          >
            We&apos;re here to help
          </Text>
          <View style={{ marginVertical: 24 }}>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Together, we&apos;ll help {displayName} take {napPhrase} with ease.
            </Text>
            <Text className={`${mutedTextClassName} text-xl`}>
              Join other parents who don&apos;t need to guess the next nap time.
            </Text>
          </View>

          <View className="w-full items-center">
            <Carousel
              width={CAROUSEL_WIDTH}
              height={CAROUSEL_HEIGHT}
              data={[...REVIEWS]}
              loop={false}
              autoPlay={false}
              pagingEnabled
              snapEnabled
              onSnapToItem={setActiveReviewIndex}
              renderItem={({ item }) => (
                <View className="flex-1 border-t border-b border-white/30 py-4 justify-center">
                  <Stars count={item.rating} />
                  <Text className={`${mutedTextClassName} text-base mb-2`}>
                    "{item.quote}"
                  </Text>
                  <Text className="text-white text-sm font-semibold">
                    {item.author}
                  </Text>
                </View>
              )}
            />
            <View className="flex-row items-center justify-center mt-3 gap-2">
              {REVIEWS.map((review, index) => (
                <View
                  key={review.author}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeReviewIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </View>
          </View>

          {onPressNext ? (
            <TimerOutlineButton
              label="Next"
              iconName="arrow-forward-sharp"
              onPress={onPressNext}
              variant="solid"
              size="xl"
              className="mt-6"
              accessibilityLabel="Next"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default TrustSlide;
