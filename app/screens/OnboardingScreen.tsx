import React from 'react';
import { ImageBackground, StyleSheet, type ViewStyle } from 'react-native';
import OnboardingSwiper from 'react-native-onboarding-swiper';
import {
  BasicSlide,
  SubscriptionChoiceSlide,
  WelcomeSlide,
} from './onboarding';

const backgroundImage = require('../../assets/images/bg.jpg');

const OnboardingScreen: React.FC = () => {
  const onboardingRef = React.useRef<React.ElementRef<typeof OnboardingSwiper>>(null);

  const goNextSlide = React.useCallback(() => {
    onboardingRef.current?.goNext();
  }, []);

  const pages = [
    {
      backgroundColor: 'transparent',
      isLight: false,
      title: <></>,
      subtitle: <></>,
      image: <WelcomeSlide onPressNext={goNextSlide} />,
    },
    {
      backgroundColor: 'transparent',
      isLight: false,
      title: <></>,
      subtitle: <></>,
      image: <BasicSlide onPressNext={goNextSlide} />,
    },
    {
      backgroundColor: 'transparent',
      isLight: false,
      title: <></>,
      subtitle: <></>,
      image: <SubscriptionChoiceSlide />,
      showDone: false,
      showNext: false,
      canSwipeForward: false,
    },
  ];

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#6E9AB1', height: '100%' }]}
    >
      <OnboardingSwiper
        ref={onboardingRef}
        pages={pages}
        showSkip={false}
        showNext={false}
        bottomBarHighlight={false}
        controlStatusBar={false}
        imageContainerStyles={styles.imageContainer}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    width: '100%',
  } as ViewStyle,
});

export default OnboardingScreen;
