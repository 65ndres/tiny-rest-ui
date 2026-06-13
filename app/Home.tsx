import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassCardCenteredClassName,
  homeContentStackClassName,
  homeHintClassName,
  homePageTitleClassName,
  homeScrollContentClassName,
  mutedTextClassName,
} from '@/app/constants/screenLayout';
import { fetchTimerRuns } from '@/app/utils/timerHistory';
import {
  formatNextNapTime,
  getBabyDisplayName,
  normalizeDailyNapCount,
  predictNextNap,
} from '@/app/utils/nextNapPrediction';
import { fetchUserProfile } from '@/app/utils/userProfile';
import HomeRoutineCard from './sharedComponents/home/HomeRoutineCard';
import HomeRoutineSection from './sharedComponents/home/HomeRoutineSection';
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
  const [babyName, setBabyName] = useState('');
  const [nextNapLabel, setNextNapLabel] = useState('--:--');
  const [isLoading, setIsLoading] = useState(true);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setBabyName('Baby');
        setNextNapLabel('--:--');
        return;
      }

      const [profile, timerSessions] = await Promise.all([
        fetchUserProfile(token),
        fetchTimerRuns(token, { run_type: 'sleeping' }),
      ]);

      const napCount = normalizeDailyNapCount(profile.daily_nap_count);
      const displayName = getBabyDisplayName(profile.baby_name);
      setBabyName(displayName);

      const nextNap = predictNextNap(napCount, timerSessions);
      setNextNapLabel(formatNextNapTime(nextNap));
    } catch {
      setBabyName('Baby');
      setNextNapLabel('--:--');
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

  const routineTitle = babyName ? `${babyName}'s Routine` : 'My Routine';

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
              <Text className={`${mutedTextClassName} text-lg`}>next nap</Text>
              <Text className="text-white text-5xl font-mono tracking-wider mt-2">
                {nextNapLabel}
              </Text>
            </>
          )}
        </VStack>

        <HomeTipCard />


          <HomeRoutineCard
            title="Add sleep"
            subtitle="Log a nap session"
            iconName="moon-outline"
            onPress={() => navigation.navigate('Timer')}
            accessibilityLabel="Add sleep"
          />

          <HomeRoutineCard
            title="Add feeding"
            subtitle="Log a bottle or nursing session"
            iconName="water-outline"
            onPress={() => navigation.navigate('AddFeeding')}
            accessibilityLabel="Add feeding"
          />

          <HomeRoutineCard
            title="View timeline"
            subtitle="See today's schedule"
            iconName="calendar-outline"
            onPress={() => navigation.navigate('NapTimeline')}
            accessibilityLabel="View timeline"
          />
          <HomeRoutineCard
            title="Soothing sounds"
            subtitle="White noise & lullabies"
            iconName="musical-notes-outline"
            onPress={() => navigation.navigate('Sounds')}
            accessibilityLabel="Soothing sounds"
          />
      </VStack>
    </ScreenScrollLayout>
  );
};

export default Home;
