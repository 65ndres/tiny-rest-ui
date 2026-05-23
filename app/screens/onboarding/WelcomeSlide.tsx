import { Button } from '@rneui/themed';
import React from 'react';
import { Text, View } from 'react-native';
import OnboardingSlideShell from './OnboardingSlideShell';
import {
  onboardingSlideLayoutStyles,
  onboardingSampleStyles,
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
            Thank you for creating your account—we are glad you are here.
          </Text>
          <View style={onboardingSampleStyles.container}>
            <Text style={onboardingSampleStyles.text}>
              This is sample content for your customizable app.
            </Text>
            <Text style={onboardingSampleStyles.text}>Sample Item — 1</Text>
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
