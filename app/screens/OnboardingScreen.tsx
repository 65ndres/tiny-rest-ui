import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import {
  resolveLastCompletedStep,
  saveOnboardingStep,
  setLocalOnboardingStep,
} from '@/app/utils/onboardingProgress';
import { fetchUserProfile } from '@/app/utils/userProfile';
import { napScheduleFromProfile } from '@/app/utils/napSchedule';
import type { NapScheduleOption } from '@/app/utils/napSchedule';
import { getAppWindow } from '@/constants/appViewport';
import {
  BabyProfileSlide,
  BasicSlide,
  NapCountSlide,
  SubscriptionChoiceSlide,
  TrustSlide,
  WelcomeSlide,
} from './onboarding';
import {
  ONBOARDING_STEPS,
  resumePageIndex,
  type OnboardingStep,
} from './onboarding/onboardingSteps';

const backgroundImage = require('../../assets/images/bg.jpg');
const footerLogo = require('../../assets/images/footer-logo.png');
const LOGO_WIDTH = getAppWindow().width * 0.7;

const TOTAL_PAGES = ONBOARDING_STEPS.length;
const FADE_OUT_MS = 180;
const FADE_IN_MS = 220;

const OnboardingScreen: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [isReady, setIsReady] = React.useState(false);
  const [babyName, setBabyName] = React.useState('');
  const [babyBirthdate, setBabyBirthdate] = React.useState<string | null>(null);
  const [napSchedule, setNapSchedule] = React.useState<NapScheduleOption | null>(
    null
  );
  const opacity = React.useRef(new Animated.Value(1)).current;
  const currentPageRef = React.useRef(0);
  currentPageRef.current = currentPage;

  React.useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const [lastCompletedStep, profile] = await Promise.all([
          resolveLastCompletedStep(token),
          token ? fetchUserProfile(token).catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        if (profile) {
          setBabyName(profile.baby_name?.trim() ?? '');
          setBabyBirthdate(profile.baby_birthdate ?? null);
          // Only restore nap count when it was explicitly saved during onboarding.
          if (lastCompletedStep === 'nap_count' || lastCompletedStep === 'trust' || lastCompletedStep === 'paywall') {
            setNapSchedule(
              napScheduleFromProfile(
                profile.daily_nap_count,
                profile.daily_nap_count_alt
              )
            );
          }
        }

        setCurrentPage(resumePageIndex(lastCompletedStep));
      } catch {
        // Fresh start if progress cannot be loaded.
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const advanceToPage = React.useCallback(
    (nextPage: number) => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setCurrentPage(nextPage);
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          useNativeDriver: true,
        }).start();
      });
    },
    [opacity]
  );

  const completeStepAndAdvance = React.useCallback(
    (step: OnboardingStep) => {
      return async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            await saveOnboardingStep(token, step);
          } else {
            await setLocalOnboardingStep(step);
          }
        } catch {
          // Local save is best-effort; still advance.
        }

        const nextPage = Math.min(currentPageRef.current + 1, TOTAL_PAGES - 1);
        if (nextPage !== currentPageRef.current) {
          advanceToPage(nextPage);
        }
      };
    },
    [advanceToPage]
  );

  const slides = React.useMemo(
    () => [
      <WelcomeSlide
        key="problem"
        onPressNext={completeStepAndAdvance('problem')}
      />,
      <BasicSlide
        key="outcome"
        onPressNext={completeStepAndAdvance('outcome')}
      />,
      <BabyProfileSlide
        key="baby_profile"
        babyName={babyName}
        babyBirthdate={babyBirthdate}
        onBabyNameChange={setBabyName}
        onBabyBirthdateChange={setBabyBirthdate}
        onPressNext={completeStepAndAdvance('baby_profile')}
      />,
      <NapCountSlide
        key="nap_count"
        napSchedule={napSchedule}
        onNapScheduleChange={setNapSchedule}
        onPressNext={completeStepAndAdvance('nap_count')}
      />,
      <TrustSlide
        key="trust"
        babyName={babyName}
        napSchedule={napSchedule}
        onPressNext={completeStepAndAdvance('trust')}
      />,
      <SubscriptionChoiceSlide key="paywall" />,
    ],
    [babyName, babyBirthdate, napSchedule, completeStepAndAdvance]
  );

  if (!isReady) {
    return (
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#6E9AB1' }]}
      />
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#6E9AB1', height: '100%' }]}
    >
      <Animated.View style={[styles.slideContainer, { opacity }]}>
        {slides[currentPage]}
      </Animated.View>
      <View pointerEvents="none" style={[styles.fixedBottom, { bottom: 10 }]}>
        <Image source={footerLogo} style={styles.logo} resizeMode="contain" />
        <View style={styles.dotsBar}>
          {slides.map((slide, index) => (
            <View
              key={slide.key ?? index}
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
  slideContainer: {
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
    width: LOGO_WIDTH,
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
