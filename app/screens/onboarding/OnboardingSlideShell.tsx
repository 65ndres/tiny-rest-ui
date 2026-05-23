import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type OnboardingSlideShellProps = {
  children: React.ReactNode;
};

const OnboardingSlideShell: React.FC<OnboardingSlideShellProps> = ({ children }) => {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <View style={{height: "20%"}}>
          
        </View>
        <View style={{height: "65%"}}>
          {children}
        </View>
        <View style={{height: "15%"}}>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    // flex: 1,
    // width: '100%',
  } as ViewStyle,
  container: {
    // flex: 1,
    // width: '100%',
    // alignSelf: 'stretch',
  } as ViewStyle,
});

export default OnboardingSlideShell;
