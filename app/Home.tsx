import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import {
  glassCardCenteredClassName,
  glassCardStyle,
  HOME_HORIZONTAL_PADDING,
  homeContentStackClassName,
  layout,
} from '@/app/constants/screenLayout';
import {
  fetchSleepPrediction,
  formatPredictionDisplay,
  isSleepTimerRunning,
  type SleepPrediction,
} from '@/app/utils/sleepPrediction';
import { formatExactNapCount } from '@/app/utils/napSchedule';
import { refreshWidgetState } from '@/app/utils/widgetStorage';
import { useAuth } from './context/AuthContext';
import { useRevenueCat } from './context/RevenueCatContext';
import HomeNapPredictionCarousel, {
  type HomeNapPredictionSlide,
} from './sharedComponents/home/HomeNapPredictionCarousel';
import HomeRoutineCard from './sharedComponents/home/HomeRoutineCard';
import ScreenComponent from './sharedComponents/ScreenComponent';

type RootDrawerParamList = {
  Home: undefined;
  Timer: undefined;
  NapTimeline: undefined;
  AddFeeding: undefined;
  Sounds: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

const PREDICTION_PANEL_HEIGHT = '32%';
const ACTIONS_HEIGHT = '58%';
const HOME_SECTION_GAP = '5%';

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const isProUser = user?.subscription_type === 'pro';
  const [prediction, setPrediction] = useState<SleepPrediction | null>(null);
  const [activeNapCount, setActiveNapCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const navigateOrPaywall = useCallback(
    (route: keyof Omit<RootDrawerParamList, 'Home' | 'Timer'>) => {
      if (!isProUser) {
        void presentPaywall();
        return;
      }
      navigation.navigate(route);
    },
    [isProUser, navigation, presentPaywall]
  );
  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setPrediction(null);
        setActiveNapCount(null);
        return;
      }

      const nextPrediction = await fetchSleepPrediction(token);
      setPrediction(nextPrediction);
      setActiveNapCount((current) => {
        const counts = [
          nextPrediction.daily_nap_count,
          nextPrediction.daily_nap_count_alt,
        ].filter((count): count is number => count != null);
        if (current != null && counts.includes(current)) return current;
        return nextPrediction.daily_nap_count;
      });
      void refreshWidgetState(token);
    } catch {
      setPrediction(null);
      setActiveNapCount(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  const napTabCounts = prediction
    ? [
        prediction.daily_nap_count,
        prediction.daily_nap_count_alt,
      ].filter((count): count is number => count != null)
    : [];
  const timerRunning = isSleepTimerRunning(prediction?.status);
  const slides: HomeNapPredictionSlide[] = useMemo(() => {
    if (!prediction) return [];

    const runningDisplay = timerRunning
      ? formatPredictionDisplay(prediction)
      : null;

    return napTabCounts.map((count) => {
      const countPrediction =
        runningDisplay != null
          ? prediction
          : (prediction.range_predictions?.find(
              (entry) => entry.daily_nap_count === count
            ) ?? prediction);

      return {
        count,
        countLabel: formatExactNapCount(count),
        display:
          runningDisplay ?? formatPredictionDisplay(countPrediction),
      };
    });
  }, [napTabCounts, prediction, timerRunning]);

  if (!loaded) {
    return null;
  }

  return (
    <ScreenComponent contentFlex>
      <View
        className="flex-1 min-h-0"
        style={{
          paddingTop: layout.space8,
          paddingBottom: layout.space8,
          paddingHorizontal: HOME_HORIZONTAL_PADDING,
        }}
      >
        <View className={`${homeContentStackClassName} flex-1 min-h-0`}>
          <VStack
            className={`${glassCardCenteredClassName} justify-center`}
            style={[
              glassCardStyle,
              { height: PREDICTION_PANEL_HEIGHT, minHeight: 0 },
            ]}
          >
            <View
              className="w-full"
              onLayout={(event) => {
                const nextWidth = Math.round(event.nativeEvent.layout.width);
                if (nextWidth > 0 && nextWidth !== carouselWidth) {
                  setCarouselWidth(nextWidth);
                }
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="large" />
              ) : slides.length > 0 ? (
                <HomeNapPredictionCarousel
                  slides={slides}
                  activeCount={activeNapCount ?? slides[0].count}
                  onChange={setActiveNapCount}
                  width={carouselWidth}
                  disabled={timerRunning}
                />
              ) : null}
            </View>
          </VStack>

          <View style={{ height: HOME_SECTION_GAP }} />

          <VStack
            className="w-full"
            style={{ height: ACTIONS_HEIGHT, gap: layout.space12 }}
          >
            <HomeRoutineCard
              title="Add sleep"
              subtitle="Log a nap session"
              iconName="moon-sharp"
              onPress={() => navigation.navigate('Timer')}
              accessibilityLabel="Add sleep"
              style={{ flex: 1, minHeight: 0 }}
            />

            <HomeRoutineCard
              title="Add feeding"
              subtitle="Bottle or nursing session"
              iconName="water-sharp"
              onPress={() => navigateOrPaywall('AddFeeding')}
              accessibilityLabel="Add feeding"
              dimmed={!isProUser}
              style={{ flex: 1, minHeight: 0 }}
            />

            <HomeRoutineCard
              title="View timeline"
              subtitle="See today's schedule"
              iconName="calendar-sharp"
              onPress={() => navigateOrPaywall('NapTimeline')}
              accessibilityLabel="View timeline"
              dimmed={!isProUser}
              style={{ flex: 1, minHeight: 0 }}
            />
            <HomeRoutineCard
              title="Soothing sounds"
              subtitle="White noise & lullabies"
              iconName="musical-notes-sharp"
              onPress={() => navigateOrPaywall('Sounds')}
              accessibilityLabel="Soothing sounds"
              dimmed={!isProUser}
              style={{ flex: 1, minHeight: 0 }}
            />
          </VStack>
        </View>
      </View>
    </ScreenComponent>
  );
};

export default Home;
