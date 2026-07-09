import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { ButtonSpinner } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  fetchUserProfile,
  updateUserProfile,
} from '@/app/utils/userProfile';
import { normalizeDailyNapCount } from '@/app/utils/nextNapPrediction';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';

const NAP_OPTIONS = [1, 2, 3, 4, 5] as const;

const formatBirthdate = (value: string | null): string => {
  if (!value) return 'Not set';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const toDateInput = (value: string | null): Date => {
  if (!value) return new Date();
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SettingsScreen: React.FC = () => {
  const [dailyNapCount, setDailyNapCount] = useState(3);
  const [babyBirthdate, setBabyBirthdate] = useState<string | null>(null);
  const [birthdatePickerValue, setBirthdatePickerValue] = useState(new Date());
  const [isBirthdatePickerOpen, setIsBirthdatePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const profile = await fetchUserProfile(token);
      setDailyNapCount(normalizeDailyNapCount(profile.daily_nap_count));
      setBabyBirthdate(profile.baby_birthdate);
      setBirthdatePickerValue(toDateInput(profile.baby_birthdate));
    } catch {
      Alert.alert('Error', 'Could not load settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings])
  );

  const saveNapCount = async (count: number) => {
    setDailyNapCount(count);
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save settings.');
        return;
      }

      await updateUserProfile(token, { daily_nap_count: count });
    } catch {
      Alert.alert('Error', 'Could not save settings. Please try again.');
      void loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const saveBirthdate = async (date: Date) => {
    const isoDate = toIsoDate(date);
    setBabyBirthdate(isoDate);
    setBirthdatePickerValue(date);
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save settings.');
        return;
      }

      await updateUserProfile(token, { baby_birthdate: isoDate });
    } catch {
      Alert.alert('Error', 'Could not save birthdate. Please try again.');
      void loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenComponent>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow p-6 items-center"
        showsVerticalScrollIndicator={false}
      >
          <VStack space="md" className="w-full max-w-[336px] items-center pt-10">
            <VStack className="rounded-xl border border-white/90 p-6 w-full">
              <Heading size="lg" className="text-white">
                Baby birthdate
              </Heading>
              <Text className="text-white/75 text-base mt-2">
                Used to calculate age-appropriate wake windows for nap predictions.
              </Text>

              {isLoading ? (
                <Text className="text-white/75 text-base mt-6">Loading...</Text>
              ) : (
                <Pressable
                  onPress={() => setIsBirthdatePickerOpen(true)}
                  disabled={isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Set baby birthdate"
                  className="mt-6 rounded-xl border-2 border-white/90 px-4 py-4"
                >
                  <Text className="text-white text-lg font-semibold">
                    {formatBirthdate(babyBirthdate)}
                  </Text>
                </Pressable>
              )}
            </VStack>

            <VStack className="rounded-xl border border-white/90 p-6 w-full">
              <Heading size="lg" className="text-white">
                Daily naps
              </Heading>
              <Text className="text-white/75 text-base mt-2">
                How many naps does your baby usually take per day?
              </Text>

              {isLoading ? (
                <Text className="text-white/75 text-base mt-6">Loading...</Text>
              ) : (
                <View className="flex-row flex-wrap justify-between mt-6 gap-3">
                  {NAP_OPTIONS.map((count) => {
                    const isSelected = dailyNapCount === count;
                    return (
                      <Pressable
                        key={count}
                        onPress={() => void saveNapCount(count)}
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        className={`w-[18%] min-w-[52px] aspect-square rounded-xl border-2 items-center justify-center ${
                          isSelected
                            ? 'border-white bg-white'
                            : 'border-white/90 bg-transparent'
                        }`}
                      >
                        <Text
                          className={`text-2xl font-semibold ${
                            isSelected ? 'text-black' : 'text-white'
                          }`}
                        >
                          {count}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {isSaving ? (
                <View className="mt-6 items-center">
                  <ButtonSpinner color="white" />
                </View>
              ) : null}
            </VStack>
          </VStack>
        </ScrollView>

      <TimerDateTimePickerDrawer
        isOpen={isBirthdatePickerOpen}
        title="Baby birthdate"
        value={birthdatePickerValue}
        mode="date"
        onChange={(date) => {
          setBirthdatePickerValue(date);
          void saveBirthdate(date);
        }}
        onClose={() => setIsBirthdatePickerOpen(false)}
      />
    </ScreenComponent>
  );
};

export default SettingsScreen;
