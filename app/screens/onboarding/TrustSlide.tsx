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
import { formatNapSchedulePhrase } from '@/app/utils/napSchedule';
import type { NapScheduleOption } from '@/app/utils/napSchedule';
import { onboardingWidth } from './onboardingLayout';
import OnboardingSlideShell from './OnboardingSlideShell';

type TrustSlideProps = {
  babyName: string;
  napSchedule: NapScheduleOption | null;
  onPressNext?: () => void | Promise<void>;
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
  {
    quote: 'Our evenings are calmer. I know when the next nap should start.',
    author: 'Priya, mom of 2',
    rating: 5,
  },
  {
    quote: 'Simple tracking that actually helps. Wish we had this sooner.',
    author: 'Alex, dad of 1',
    rating: 5,
  },
] as const;

const CAROUSEL_WIDTH = onboardingWidth * SCREEN_CONTENT_WIDTH_RATIO;
const CAROUSEL_HEIGHT = 140;

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <Text
    className="text-base font-semibold mb-2"
    style={{ color: '#F5C518' }}
  >
    {'★'.repeat(count)}
    {'☆'.repeat(Math.max(0, 5 - count))}
  </Text>
);

const TrustSlide: React.FC<TrustSlideProps> = ({
  babyName,
  napSchedule,
  onPressNext,
}) => {
  const [activeReviewIndex, setActiveReviewIndex] = React.useState(0);
  const displayName = babyName.trim() || 'your baby';
  const napPhrase = formatNapSchedulePhrase(napSchedule);

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
            Now relax, we are here to help you.
          </Text>
          <Text
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 40,
            }}
          >
          </Text>
          <View style={{ marginVertical: 5 }}>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Together, we&apos;ll help{' '}
              <Text className="text-white text-xl font-bold">{displayName}</Text>
              {' '}take{' '}
              <Text className="text-white text-xl font-bold">{napPhrase}</Text>
              {' '}with ease.
            </Text>

          </View>

          <View className='border-b border-white/30 pb-4'></View>

          <Text className={`${mutedTextClassName} text-xl mt-6 text-center font-bold`}>
              Join other parents who don&apos;t need to guess the next nap time!
            </Text>

          <View className=" items-center" >
            <Carousel
              width={CAROUSEL_WIDTH}
              height={CAROUSEL_HEIGHT}
              data={[...REVIEWS]}
              loop={true}
              autoPlay={true}
              autoPlayInterval={4000}
              pagingEnabled
              // snapEnabled
              onSnapToItem={setActiveReviewIndex}
              renderItem={({ item }) => (
                <View className="py-6 text-center" style={{ paddingHorizontal: 60 }}>
                  
                  <Text className={`${mutedTextClassName} text-base mb-2 text-center`}>
                    "{item.quote}"
                  </Text>
                  <View className="flex-row justify-center">
                    <Stars count={item.rating} />
                  </View>
                  <Text className="text-white text-sm font-semibold text-center">
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
              label="Choose a plan"
              iconName="arrow-forward-sharp"
              onPress={() => void onPressNext?.()}
              variant="solid"
              size="xl"
              className="mt-6"
              accessibilityLabel="Choose a plan"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default TrustSlide;
