import { APP_DISPLAY_NAME } from '@/constants/appBranding';
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

type WelcomeSlideProps = {
  onPressNext?: () => void;
};

const WelcomeSlide: React.FC<WelcomeSlideProps> = ({ onPressNext }) => {
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
            Better naps start here
          </Text>
          <View style={{ marginVertical: 24 }}>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Welcome to {APP_DISPLAY_NAME}. Log sleep and feeding, track wake
              windows, and see when your little one is likely ready for their
              next nap.
            </Text>
            <Text className={`${mutedTextClassName} text-xl`}>
              Bedtime feels less like guesswork—and more like a gentle rhythm
              you can trust.
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

export default WelcomeSlide;
