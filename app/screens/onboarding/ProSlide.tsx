import { PRO_PLAN_DISPLAY_NAME } from '@/constants/appBranding';
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

type ProSlideProps = {
  onPressNext?: () => void;
};

const ProSlide: React.FC<ProSlideProps> = ({ onPressNext }) => {
  return (
    <OnboardingSlideShell>
      <View style={onboardingSlideLayoutStyles.root}>
        <View style={onboardingSlideLayoutStyles.main}>
          <Text style={slideStyles.titleCenter}>{PRO_PLAN_DISPLAY_NAME}</Text>
          <View style={onboardingBenefitListStyles.benefits}>
            <View style={onboardingBenefitListStyles.benefitRow}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                Everything in Basic, plus:
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>Browse by category. </Text>
                Filter to find sample content that fits your moment.
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>Private messages. </Text>
                DM others by username—private and in-app only.
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>Premium support. </Text>
                Priority help from our team when you need it.
              </Text>
            </View>
          </View>
          <View style={onboardingSampleStyles.container}>
            <Text style={onboardingSampleStyles.text}>
              Pro unlocks browse categories and sharing sample items in chat.
            </Text>
            <Text style={onboardingSampleStyles.text}>Sample Item — 3</Text>
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

export default ProSlide;
