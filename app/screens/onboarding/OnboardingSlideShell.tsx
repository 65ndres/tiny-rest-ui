import React from 'react';
import { View } from 'react-native';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import { HOME_HORIZONTAL_PADDING } from '@/app/constants/screenLayout';

type OnboardingSlideShellProps = {
  children: React.ReactNode;
  paddingHorizontal?: number;
};

const OnboardingSlideShell: React.FC<OnboardingSlideShellProps> = ({
  children,
  paddingHorizontal = HOME_HORIZONTAL_PADDING,
}) => (
  <ScreenComponent enableFocusFade={false} showFooter={false}>
    <View style={{ flex: 1, width: '100%', paddingHorizontal }}>
      {children}
    </View>
  </ScreenComponent>
);

export default OnboardingSlideShell;
