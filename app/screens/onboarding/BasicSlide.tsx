import { Button } from '@rneui/themed';
import React from 'react';
import { Text, View } from 'react-native';
import OnboardingSlideShell from './OnboardingSlideShell';
import {
  onboardingBenefitListStyles,
  onboardingSlideLayoutStyles,
  onboardingSampleStyles,
  slideNextButtonStyles,
  slideStyles,
} from './onboardingLayout';

type BasicSlideProps = {
  onPressNext?: () => void;
};

const BasicSlide: React.FC<BasicSlideProps> = ({ onPressNext }) => {
  return (
    <OnboardingSlideShell>
      <View style={onboardingSlideLayoutStyles.root}>
        <View style={onboardingSlideLayoutStyles.main}>
          <Text style={slideStyles.titleCenter}>Basic Plan</Text>
          <View style={onboardingBenefitListStyles.benefits}>
            <View style={onboardingBenefitListStyles.benefitRow}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>Free. </Text>
                More sample items and a place to save what you like.
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>More items. </Text>
                Read beyond the starter set anytime.
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>Saved items. </Text>
                Reopen favorites when you need them.
              </Text>
            </View>
          </View>
          <View style={onboardingSampleStyles.container}>
            <Text style={onboardingSampleStyles.text}>
              Replace this quote with your own sample text in constants/sampleItems.ts.
            </Text>
            <Text style={onboardingSampleStyles.text}>Sample Item — 2</Text>
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

export default BasicSlide;
