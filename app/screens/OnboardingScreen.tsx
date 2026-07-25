import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import OnboardingSwiper from 'react-native-onboarding-swiper';
import {
  BabyProfileSlide,
  BasicSlide,
  NapCountSlide,
  SubscriptionChoiceSlide,
  TrustSlide,
  WelcomeSlide,
} from './onboarding';

const backgroundImage = require('../../assets/images/bg.jpg');
const footerLogo = require('../../assets/images/footer-logo.png');

const TOTAL_PAGES = 6;

const OnboardingScreen: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [babyName, setBabyName] = React.useState('');
  const [babyBirthdate, setBabyBirthdate] = React.useState<string | null>(null);
  const [dailyNapCount, setDailyNapCount] = React.useState<number | null>(null);

  // Controlled currentPage bypasses canSwipeForward blocking inside goNext/onSwipePageChange.
  const goNextSlide = React.useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, TOTAL_PAGES - 1));
  }, []);

  const pages = React.useMemo(
    () => [
      {
        backgroundColor: 'transparent',
        isLight: false,
        title: <></>,
        subtitle: <></>,
        image: <WelcomeSlide onPressNext={goNextSlide} />,
        canSwipeForward: false,
        canSwipeBackward: false,
      },
      {
        backgroundColor: 'transparent',
        isLight: false,
        title: <></>,
        subtitle: <></>,
        image: <BasicSlide onPressNext={goNextSlide} />,
        canSwipeForward: false,
        canSwipeBackward: false,
      },
      {
        backgroundColor: 'transparent',
        isLight: false,
        title: <></>,
        subtitle: <></>,
        image: (
          <BabyProfileSlide
            babyName={babyName}
            babyBirthdate={babyBirthdate}
            onBabyNameChange={setBabyName}
            onBabyBirthdateChange={setBabyBirthdate}
            onPressNext={goNextSlide}
          />
        ),
        showDone: false,
        showNext: false,
        canSwipeForward: false,
        canSwipeBackward: false,
      },
      {
        backgroundColor: 'transparent',
        isLight: false,
        title: <></>,
        subtitle: <></>,
        image: (
          <NapCountSlide
            dailyNapCount={dailyNapCount}
            onDailyNapCountChange={setDailyNapCount}
            onPressNext={goNextSlide}
          />
        ),
        showDone: false,
        showNext: false,
        canSwipeForward: false,
        canSwipeBackward: false,
      },
      {
        backgroundColor: 'transparent',
        isLight: false,
        title: <></>,
        subtitle: <></>,
        image: (
          <TrustSlide
            babyName={babyName}
            dailyNapCount={dailyNapCount}
            onPressNext={goNextSlide}
          />
        ),
        canSwipeForward: false,
        canSwipeBackward: false,
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
        canSwipeBackward: false,
      },
    ],
    [babyName, babyBirthdate, dailyNapCount, goNextSlide]
  );

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#6E9AB1', height: '100%' }]}
    >
      <OnboardingSwiper
        pages={pages}
        currentPage={currentPage}
        showSkip={false}
        showNext={false}
        showPagination={false}
        bottomBarHighlight={false}
        controlStatusBar={false}
        pageIndexCallback={setCurrentPage}
        imageContainerStyles={styles.imageContainer}
        flatlistProps={{ scrollEnabled: false }}
      />
      <View pointerEvents="none" style={[styles.fixedBottom, { bottom: 10 }]}>
        <Image source={footerLogo} style={styles.logo} resizeMode="contain" />
        <View style={styles.dotsBar}>
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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
  } as ViewStyle,
  fixedBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  } as ViewStyle,
  logo: {
    height: 100,
    width: '70%',
  } as ImageStyle,
  dotsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
