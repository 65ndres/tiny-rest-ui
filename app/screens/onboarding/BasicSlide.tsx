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
                More verses and a place to save what speaks to you.
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>More verses. </Text>
                Read beyond the starter set anytime.
              </Text>
            </View>
            <View style={[onboardingBenefitListStyles.benefitRow, onboardingSlideLayoutStyles.bodySpacing]}>
              <Text style={onboardingBenefitListStyles.bulletIcon} accessibilityLabel="Cross bullet">
                {'\u271D\uFE0E'}
              </Text>
              <Text style={[slideStyles.bodyLeft, onboardingBenefitListStyles.benefitText]}>
                <Text style={onboardingBenefitListStyles.boldLabel}>Saved verses. </Text>
                Reopen favorites when you need a word of encouragement.
              </Text>
            </View>
          </View>
          <View style={onboardingVerseStyles.container}>
            <Text style={onboardingVerseStyles.text}>
              "Do not despise these small beginnings, for the Lord rejoices to see the work begin."
            </Text>
            <Text style={onboardingVerseStyles.text}>Zechariah 4:10</Text>
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
