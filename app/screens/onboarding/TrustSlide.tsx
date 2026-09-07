import React from 'react';
import { View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  layout,
  mutedTextClassName,
  mutedTextStyle,
  SCREEN_CONTENT_WIDTH_RATIO,
  stackGapStyle,
  timerContentStackClassName,
} from '@/app/constants/screenLayout';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import { formatNapSchedulePhrase } from '@/app/utils/napSchedule';
import type { NapScheduleOption } from '@/app/utils/napSchedule';
import { vh } from '@/constants/appViewport';
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
const CAROUSEL_HEIGHT = vh(140);

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <Text
    className="font-semibold"
    style={{ color: '#F5C518', fontSize: layout.fontBase, marginBottom: layout.space8 }}
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
      <VStack className={`${timerContentStackClassName} flex-1`} style={stackGapStyle}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: vh(34),
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: vh(40),
            }}
          >
            Now relax, we are here to help you.
          </Text>
          <View style={{ marginVertical: layout.space4 }}>
            <Text
              className={mutedTextClassName}
              style={[mutedTextStyle, { fontSize: layout.fontXl, marginBottom: layout.space16 }]}
            >
              Together, we&apos;ll help{' '}
              <Text className="text-white font-bold" style={{ fontSize: layout.fontXl }}>{displayName}</Text>
              {' '}take{' '}
              <Text className="text-white font-bold" style={{ fontSize: layout.fontXl }}>{napPhrase}</Text>
              {' '}with ease.
            </Text>

          </View>

          <View className="border-b border-white/30" style={{ paddingBottom: layout.space16 }}></View>

          <Text
            className={`${mutedTextClassName} text-center font-bold`}
            style={[mutedTextStyle, { fontSize: layout.fontXl, marginTop: layout.space24 }]}
          >
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
                <View className="text-center" style={{ paddingVertical: layout.space24, paddingHorizontal: vh(60) }}>
                  
                  <Text className={`${mutedTextClassName} text-center`} style={[mutedTextStyle, { marginBottom: layout.space8 }]}>
                    "{item.quote}"
                  </Text>
                  <View className="flex-row justify-center">
                    <Stars count={item.rating} />
                  </View>
                  <Text className="text-white font-semibold text-center" style={{ fontSize: layout.fontSm }}>
                    {item.author}
                  </Text>
                </View>
              )}
            />
            <View className="flex-row items-center justify-center" style={{ marginTop: layout.space12, gap: layout.space8 }}>
              {REVIEWS.map((review, index) => (
                <View
                  key={review.author}
                  className={`rounded-full ${
                    index === activeReviewIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  style={{ height: layout.space6, width: layout.space6 }}
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
              style={{ marginTop: layout.space24 }}
              accessibilityLabel="Choose a plan"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default TrustSlide;
