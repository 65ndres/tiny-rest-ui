import React from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { onboardingHeight } from './onboardingLayout';

const OnboardingHeader: React.FC = () => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>app-name</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: onboardingHeight * 0.02,
    paddingBottom: onboardingHeight * 0.012,
  } as ViewStyle,
  title: {
    color: '#FFFFFF',
    fontSize: onboardingHeight * 0.025,
    fontWeight: '400',
  } as TextStyle,
});

export default OnboardingHeader;
