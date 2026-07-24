import { PRO_PLAN_DISPLAY_NAME } from '@/constants/appBranding';
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

type ProSlideProps = {
  onPressNext?: () => void;
};

const ProSlide: React.FC<ProSlideProps> = ({ onPressNext }) => {
  return (
    <OnboardingSlideShell>
      <VStack
        space="md"
        className={`${timerContentStackClassName} flex-1 justify-center`}
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
            {PRO_PLAN_DISPLAY_NAME}
          </Text>
          <View style={{ marginVertical: 24 }}>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Avoid overtiredness before it starts. Pro surfaces your child&apos;s
              recent sleep pattern and suggests when the next nap window is
              approaching.
            </Text>
            <Text className={`${mutedTextClassName} text-xl mb-2`}>
              • Next-nap prediction on your home screen
            </Text>
            <Text className={`${mutedTextClassName} text-xl mb-2`}>
              • Simple start/stop timer with history by day
            </Text>
            <Text className={`${mutedTextClassName} text-xl mb-2`}>
              • Feeding logs and soothing sounds
            </Text>
            <Text className={`${mutedTextClassName} text-xl`}>
              • Catch sleepy cues before late fussiness
            </Text>
          </View>
          {onPressNext ? (
            <TimerOutlineButton
              label="Choose a plan"
              iconName="arrow-forward-sharp"
              onPress={onPressNext}
              variant="solid"
              size="xl"
              className="mt-2"
              accessibilityLabel="Choose a plan"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default ProSlide;
