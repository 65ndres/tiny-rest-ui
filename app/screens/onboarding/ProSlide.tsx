import { Button } from '@rneui/themed';
import React from 'react';
import { Text, View } from 'react-native';
import OnboardingSlideShell from './OnboardingSlideShell';
import {
  onboardingBenefitListStyles,
  onboardingSlideLayoutStyles,
  onboardingVerseStyles,
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
          <Text style={slideStyles.titleCenter}>Promesas Pro</Text>
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
                <Text style={onboardingBenefitListStyles.boldLabel}>Search by category. </Text>
                Filter to land on a verse that fits your moment.
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
          <View style={onboardingVerseStyles.container}>
            <Text style={onboardingVerseStyles.text}>
              "He said to them, 'Go into all the world and preach the gospel to all creation.'"
            </Text>
            <Text style={onboardingVerseStyles.text}>Mark 16:15</Text>
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
