import { Button } from '@rneui/themed';
import React from 'react';
import { Text, View } from 'react-native';
import OnboardingSlideShell from './OnboardingSlideShell';
import {
  onboardingSlideLayoutStyles,
  onboardingVerseStyles,
  slideNextButtonStyles,
  slideStyles,
} from './onboardingLayout';

type WelcomeSlideProps = {
  onPressNext?: () => void;
};

const WelcomeSlide: React.FC<WelcomeSlideProps> = ({ onPressNext }) => {
  return (
    <OnboardingSlideShell>
      <View style={onboardingSlideLayoutStyles.root}>
        <View style={onboardingSlideLayoutStyles.main}>
          <Text style={slideStyles.titleCenter}>Welcome to Promesas</Text>
          <Text style={[slideStyles.bodyLeft, onboardingSlideLayoutStyles.bodySpacing]}>
            Thank you for creating your account—we are glad you are here and walking one step closer to
            God.
          </Text>
          <View style={onboardingVerseStyles.container}>
            <Text style={onboardingVerseStyles.text}>
              "Give thanks to the Lord, for he is good; his love endures forever."
            </Text>
            <Text style={onboardingVerseStyles.text}>Psalm 100:4</Text>
          </View>
        </View>
        {onPressNext ? (
          <Button
            title="NEXT"
            onPress={onPressNext}
            buttonStyle={slideNextButtonStyles.button}
            containerStyle={slideNextButtonStyles.container}
            titleStyle={slideNextButtonStyles.title}
          />
        ) : null}
      </View>
    </OnboardingSlideShell>
  );
};

export default WelcomeSlide;
