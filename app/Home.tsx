import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassActionTileClassName,
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
import ScreenScrollLayout from './sharedComponents/ScreenScrollLayout';

type RootDrawerParamList = {
  Home: undefined;
  Timer: undefined;
  NapTimeline: undefined;
  AddFeeding: undefined;
  Sounds: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

const HOME_ACTIONS: {
  label: string;
  route: keyof RootDrawerParamList;
}[] = [
  { label: 'Start timer', route: 'Timer' },
  { label: 'Add feeding', route: 'AddFeeding' },
  { label: 'View timeline', route: 'NapTimeline' },
  { label: 'Sounds', route: 'Sounds' },
];

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

  return (
    <ScreenScrollLayout>
      <VStack className="w-full items-center py-4">
        {isLoading ? (
          <ActivityIndicator color="white" size="large" />
        ) : (
          <>
            <Heading size="2xl" className="text-white text-center">
              {babyName}
            </Heading>
            <Text className={`${mutedTextClassName} mt-4 text-lg`}>
              next nap
            </Text>
            <Text className="text-white text-5xl font-mono tracking-wider mt-2">
              {nextNapLabel}
            </Text>
          </>
        )}
      </VStack>

      <VStack className="w-full" space="md">
        {HOME_ACTIONS.map(({ label, route }) => (
          <Pressable
            key={route}
            className={glassActionTileClassName}
            onPress={() => navigation.navigate(route)}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text className="text-white text-xl font-semibold">{label}</Text>
          </Pressable>
        ))}
      </VStack>
    </ScreenScrollLayout>
  );
};

export default Home;
