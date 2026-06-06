import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassActionTileClassName,
  glassCardCenteredClassName,
  homeActionTileTextClassName,
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
  { label: 'Add sleep', route: 'Timer' },
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
    PlaywriteGBJ: require('../assets/fonts/PlaywriteGBJ-VariableFont_wght.ttf'),
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
      <VStack className={glassCardCenteredClassName} style={{ marginBottom: 20 }}>
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
            <Text className={homeActionTileTextClassName}>{label}</Text>
          </Pressable>
        ))}
      </VStack>
      <VStack className="w-full items-center" space="sm">
        <Image
          source={require('@/assets/images/newer-logo.png')}
          style={{ height: '30%', aspectRatio: 1, alignSelf: 'center' }}
          resizeMode="contain"
        />
        <Text
          className="text-white text-center text-3xl"
          style={{ fontFamily: 'PlaywriteGBJ', fontWeight: '700' }}
        >
          Tiny Rest
        </Text>
      </VStack>
  </ScreenScrollLayout>
  );
};

export default Home;
