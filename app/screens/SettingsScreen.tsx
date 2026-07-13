import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  fetchUserProfile,
  updateUserProfile,
} from '@/app/utils/userProfile';
import { normalizeDailyNapCount } from '@/app/utils/nextNapPrediction';
import {
  timerContentStackClassName,
  timerScrollContentClassName,
  timerSectionLabelClassName,
  timerSettingRowClassName,
} from '@/app/constants/screenLayout';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';

const NAP_OPTIONS = [1, 2, 3, 4, 5] as const;

const formatBirthdate = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
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
  const [babyName, setBabyName] = useState('');
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
      setBabyName(profile.baby_name || '');
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

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save settings.');
        return;
      }

      await updateUserProfile(token, {
        baby_name: babyName.trim() || null,
        baby_birthdate: babyBirthdate,
        daily_nap_count: dailyNapCount,
      });
      Alert.alert('Success', 'Settings saved.');
    } catch {
      Alert.alert('Error', 'Could not save settings. Please try again.');
      void loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenScrollLayout
      contentContainerClassName={timerScrollContentClassName}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className={timerContentStackClassName}>
        <TimerSectionCard>
          <Text className={timerSectionLabelClassName}>Baby</Text>

          {isLoading ? (
            <Text className="text-white/75 text-base mt-2">Loading...</Text>
          ) : (
            <>
              <View className={`${timerSettingRowClassName} border-t-0`}>
                <Text className="text-white text-lg font-semibold flex-1 mr-2">
                  Name:
                </Text>
                <TextInput
                  value={babyName}
                  onChangeText={setBabyName}
                  placeholder="Enter name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!isSaving}
                  accessibilityLabel="Baby name"
                  className="text-white text-base font-semibold underline text-right min-w-[120px] py-0"
                  cursorColor="#ffffff"
                  selectionColor="white"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <TimerSettingRow
                label="Birthdate:"
                value={formatBirthdate(babyBirthdate)}
                placeholder="Select date"
                onPress={() => setIsBirthdatePickerOpen(true)}
                disabled={isSaving}
                accessibilityLabel="Set baby birthdate"
              />

              <Text className={`${timerSectionLabelClassName} mt-6`}>
                Daily naps
              </Text>
              <Text className="text-white/75 text-sm mb-3">
                How many naps does your baby usually take per day?
              </Text>
              <View className="flex-row flex-wrap justify-between gap-3">
                {NAP_OPTIONS.map((count) => {
                  const isSelected = dailyNapCount === count;
                  return (
                    <Pressable
                      key={count}
                      onPress={() => setDailyNapCount(count)}
                      disabled={isSaving}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={`w-[18%] min-w-[52px] aspect-square rounded-[15px] border items-center justify-center ${
                        isSelected
                          ? 'border-white/50 bg-white/30'
                          : 'border-white/30 bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-2xl font-semibold ${
                          isSelected ? 'text-white' : 'text-white/75'
                        }`}
                      >
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TimerOutlineButton
                label="Save"
                iconName="save-sharp"
                onPress={() => void saveSettings()}
                disabled={isSaving}
                isLoading={isSaving}
                size="lg"
                className="mt-6"
              />
            </>
          )}
        </TimerSectionCard>
      </VStack>

      <TimerDateTimePickerDrawer
        isOpen={isBirthdatePickerOpen}
        title="Baby birthdate"
        value={birthdatePickerValue}
        mode="date"
        onChange={(date) => {
          setBirthdatePickerValue(date);
          setBabyBirthdate(toIsoDate(date));
          setIsBirthdatePickerOpen(false);
        }}
        onClose={() => setIsBirthdatePickerOpen(false)}
      />
    </ScreenScrollLayout>
  );
};

export default SettingsScreen;
