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

type BasicSlideProps = {
  onPressNext?: () => void;
};

const BasicSlide: React.FC<BasicSlideProps> = ({ onPressNext }) => {
  return (
    <OnboardingSlideShell>
      <VStack
        space="md"
        className={`${timerContentStackClassName} flex-1`}
      >
        <TimerSectionCard>
          <Text
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 40,
            }}
          >
            Why timing matters
          </Text>
          <View style={{ marginVertical: 24 }}>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Quality rest supports your baby&apos;s mood, feeding rhythm, and
              growth. Babies sleep best when they are tired enough—but not
              overtired.
            </Text>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              That sweet spot is their wake window: how long they stay awake
              between sleeps. It changes quickly as they grow.
            </Text>
            <Text className={`${mutedTextClassName} text-xl`}>
              Tracking it by hand is exhausting. Tiny Rest remembers wake times
              and nap history so you can focus on your baby.
            </Text>
          </View>
          {onPressNext ? (
            <TimerOutlineButton
              label="Next"
              iconName="arrow-forward-sharp"
              onPress={onPressNext}
              variant="solid"
              size="xl"
              className="mt-2"
              accessibilityLabel="Next"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default BasicSlide;
