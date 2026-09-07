import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  layout,
  mutedTextClassName,
  mutedTextStyle,
  stackGapStyle,
  timerContentStackClassName,
} from '@/app/constants/screenLayout';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import { vh } from '@/constants/appViewport';
import OnboardingSlideShell from './OnboardingSlideShell';

type WelcomeSlideProps = {
  onPressNext?: () => void | Promise<void>;
};

const WelcomeSlide: React.FC<WelcomeSlideProps> = ({ onPressNext }) => {
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
            Tired of guessing nap time?
          </Text>
          <View style={{ marginVertical: layout.space24 }}>
            <Text
              className={mutedTextClassName}
              style={[mutedTextStyle, { fontSize: layout.fontXl, fontWeight: '700', marginBottom: layout.space16 }]}
            >
              Missing the wake window leads to overtired meltdowns—and tracking
              it all by hand is exhausting.
            </Text>
          </View>
          {onPressNext ? (
            <TimerOutlineButton
              label="Next"
              iconName="arrow-forward-sharp"
              onPress={() => void onPressNext?.()}
              variant="solid"
              size="xl"
              style={{ marginTop: layout.space8 }}
              accessibilityLabel="Next"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default WelcomeSlide;
