import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  buttonTextClassName,
  cardCenteredClassName,
  cardClassName,
  mutedTextClassName,
} from '@/app/constants/screenLayout';
import { fetchTimerRuns, type TimerSession } from '@/app/utils/timerHistory';
import {
  formatNextNapTime,
  getBabyDisplayName,
  normalizeDailyNapCount,
  predictNextNap,
} from '@/app/utils/nextNapPrediction';
import { fetchUserProfile } from '@/app/utils/userProfile';
import ScreenScrollLayout from './sharedComponents/ScreenScrollLayout';
import TimerHistoryPanel from './sharedComponents/TimerHistoryPanel';

type RootDrawerParamList = {
  Home: undefined;
  Timer: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [babyName, setBabyName] = useState('');
  const [nextNapLabel, setNextNapLabel] = useState('--:--');
  const [history, setHistory] = useState<TimerSession[]>([]);
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
        setHistory([]);
        return;
      }

      const [profile, timerSessions] = await Promise.all([
        fetchUserProfile(token),
        fetchTimerRuns(token),
      ]);

      const napCount = normalizeDailyNapCount(profile.daily_nap_count);
      const displayName = getBabyDisplayName(profile.baby_name);
      setBabyName(displayName);
      setHistory(timerSessions);

      const nextNap = predictNextNap(napCount, timerSessions);
      setNextNapLabel(formatNextNapTime(nextNap));
    } catch {
      setBabyName('Baby');
      setNextNapLabel('--:--');
      setHistory([]);
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
      <VStack className={cardCenteredClassName}>
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

      <VStack className={cardClassName} space="md">
        <Button
          variant="solid"
          className="w-full border-2 border-white bg-white"
          size="md"
          onPress={() => navigation.navigate('Timer')}
        >
          <ButtonText className={`${buttonTextClassName} text-black`}>
            Start timer
          </ButtonText>
        </Button>
        <Button
          variant="outline"
          className="w-full border-2 border-white/50 bg-transparent opacity-60"
          size="md"
          isDisabled
        >
          <ButtonText className={buttonTextClassName}>Coming soon</ButtonText>
        </Button>
      </VStack>

      <TimerHistoryPanel sessions={history} isLoading={isLoading} />
    </ScreenScrollLayout>
  );
};

export default Home;
