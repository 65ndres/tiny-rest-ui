import React from 'react';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';

type OnboardingSlideShellProps = {
  children: React.ReactNode;
};

const OnboardingSlideShell: React.FC<OnboardingSlideShellProps> = ({ children }) => (
  <ScreenComponent>{children}</ScreenComponent>
);

export default OnboardingSlideShell;
