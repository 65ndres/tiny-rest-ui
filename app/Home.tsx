import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassCardCenteredClassName,
  homeContentStackClassName,
  homeHintClassName,
  homeScrollContentClassName,
  mutedTextClassName,
} from '@/app/constants/screenLayout';
import {
  fetchSleepPrediction,
  formatPredictionDisplay,
} from '@/app/utils/sleepPrediction';
import { useAuth } from './context/AuthContext';
import { useRevenueCat } from './context/RevenueCatContext';
import HomeRoutineCard from './sharedComponents/home/HomeRoutineCard';
import HomeTipCard from './sharedComponents/home/HomeTipCard';
import ScreenScrollLayout from './sharedComponents/ScreenScrollLayout';

type RootDrawerParamList = {
  Home: undefined;
  Timer: undefined;
  NapTimeline: undefined;
  AddFeeding: undefined;
  Sounds: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const isProUser = user?.subscription_type === 'pro';
  const [heroLabel, setHeroLabel] = useState('next nap');
  const [heroValue, setHeroValue] = useState('--:--');
  const [heroSubtitle, setHeroSubtitle] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
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
        setHeroLabel('next nap');
        setHeroValue('--:--');
        setHeroSubtitle(undefined);
        return;
      }

      const prediction = await fetchSleepPrediction(token);

      const display = formatPredictionDisplay(prediction);
      setHeroLabel(display.label);
      setHeroValue(display.value);
      setHeroSubtitle(display.subtitle);
    } catch {
      setHeroLabel('next nap');
      setHeroValue('--:--');
      setHeroSubtitle(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  if (!loaded) {
    return null;
  }

  return (
    <ScreenScrollLayout
      contentContainerClassName={homeScrollContentClassName}
    >
      <VStack space="md" className={homeContentStackClassName}>
        <VStack className={glassCardCenteredClassName}>
          {isLoading ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <>
              <Text className={`${mutedTextClassName} text-lg`}>{heroLabel}</Text>
              <Text className="text-white text-5xl font-mono tracking-wider mt-2">
                {heroValue}
              </Text>
              {heroSubtitle ? (
                <Text className={`${homeHintClassName} mt-2`}>{heroSubtitle}</Text>
              ) : null}
            </>
          )}
        </VStack>

        <View style={{ paddingBottom: 40 }}></View>

        <HomeTipCard />

          <HomeRoutineCard
            title="Add sleep"
            subtitle="Log a nap session"
            iconName="moon-sharp"
            onPress={() => navigation.navigate('Timer')}
            accessibilityLabel="Add sleep"
          />

          <HomeRoutineCard
            title="Add feeding"
            subtitle="Log a bottle or nursing session"
            iconName="water-sharp"
            onPress={() => navigateOrPaywall('AddFeeding')}
            accessibilityLabel="Add feeding"
            dimmed={!isProUser}
          />

          <HomeRoutineCard
            title="View timeline"
            subtitle="See today's schedule"
            iconName="calendar-sharp"
            onPress={() => navigateOrPaywall('NapTimeline')}
            accessibilityLabel="View timeline"
            dimmed={!isProUser}
          />
          <HomeRoutineCard
            title="Soothing sounds"
            subtitle="White noise & lullabies"
            iconName="musical-notes-sharp"
            onPress={() => navigateOrPaywall('Sounds')}
            accessibilityLabel="Soothing sounds"
            dimmed={!isProUser}
          />
      </VStack>
    </ScreenScrollLayout>
  );
};

export default Home;
