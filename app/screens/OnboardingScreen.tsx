import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingSwiper from 'react-native-onboarding-swiper';
import {
  BasicSlide,
  SubscriptionChoiceSlide,
  WelcomeSlide,
} from './onboarding';

const backgroundImage = require('../../assets/images/bg.jpg');

const OnboardingScreen: React.FC = () => {
  const onboardingRef = React.useRef<React.ElementRef<typeof OnboardingSwiper>>(null);
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = React.useState(0);

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
        showPagination={false}
        bottomBarHighlight={false}
        controlStatusBar={false}
        pageIndexCallback={setCurrentPage}
        imageContainerStyles={styles.imageContainer}
      />
      <View
        pointerEvents="none"
        style={[styles.dotsBar, { bottom: Math.max(insets.bottom, 8) + 4 }]}
      >
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentPage ? styles.dotSelected : styles.dotIdle,
            ]}
          />
        ))}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
  } as ViewStyle,
  dotsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  } as ViewStyle,
  dotSelected: {
    backgroundColor: '#fff',
  } as ViewStyle,
  dotIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  } as ViewStyle,
});

export default OnboardingScreen;
