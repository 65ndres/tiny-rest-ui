import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
} from '@/app/constants/screenLayout';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
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
              We are here to help—we are parents too.
            </Text>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Let&apos;s help {displayName} take {napPhrase} with ease.
            </Text>
            <Text className={`${mutedTextClassName} text-xl`}>
              Join other parents who don&apos;t need to guess the next nap time.
            </Text>
          </View>

          <View className="w-full gap-3 mb-2">
            {REVIEWS.map((review) => (
              <View
                key={review.author}
                className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3"
              >
                <Stars count={review.rating} />
                <Text className={`${mutedTextClassName} text-base mb-2`}>
                  "{review.quote}"
                </Text>
                <Text className="text-white text-sm font-semibold">
                  {review.author}
                </Text>
              </View>
            ))}
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
