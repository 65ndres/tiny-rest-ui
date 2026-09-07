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
import { layout, mutedTextStyle, stackGapStyle } from '@/app/constants/screenLayout';
import { vh } from '@/constants/appViewport';
import OnboardingSlideShell from './OnboardingSlideShell';

type BasicSlideProps = {
  onPressNext?: () => void | Promise<void>;
};

const BasicSlide: React.FC<BasicSlideProps> = ({ onPressNext }) => {
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
            Know when they are ready
          </Text>
          <View style={{ marginVertical: layout.space24 }}>
            <Text className={mutedTextClassName} style={[mutedTextStyle, { fontSize: layout.fontXl }]}>
              Bedtime feels less like guesswork—and more like a gentle rhythm
              you can trust.
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

export default BasicSlide;
