import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  fetchUserProfile,
  updateUserProfile,
} from '@/app/utils/userProfile';
import {
  dateToMinutes,
  DEFAULT_DAY_END_MINUTES,
  DEFAULT_DAY_START_MINUTES,
  minutesToDate,
  minutesToDisplayTime,
  normalizeDayMinutes,
} from '@/app/utils/dayWindow';
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

const formatNapCount = (count: number): string =>
  count === 1 ? '1 nap' : `${count} naps`;

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
  const [nameError, setNameError] = useState('');
  const [dayWindowError, setDayWindowError] = useState('');
  const [dailyNapCount, setDailyNapCount] = useState(3);
  const [babyBirthdate, setBabyBirthdate] = useState<string | null>(null);
  const [dayStartMinutes, setDayStartMinutes] = useState(
    DEFAULT_DAY_START_MINUTES
  );
  const [dayEndMinutes, setDayEndMinutes] = useState(DEFAULT_DAY_END_MINUTES);
  const [birthdatePickerValue, setBirthdatePickerValue] = useState(new Date());
  const [dayStartPickerValue, setDayStartPickerValue] = useState(() =>
    minutesToDate(DEFAULT_DAY_START_MINUTES)
  );
  const [dayEndPickerValue, setDayEndPickerValue] = useState(() =>
    minutesToDate(DEFAULT_DAY_END_MINUTES)
  );
  const [isBirthdatePickerOpen, setIsBirthdatePickerOpen] = useState(false);
  const [isDayStartPickerOpen, setIsDayStartPickerOpen] = useState(false);
  const [isDayEndPickerOpen, setIsDayEndPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const profile = await fetchUserProfile(token);
      setBabyName(profile.baby_name || '');
      setNameError('');
      setDayWindowError('');
      setDailyNapCount(normalizeDailyNapCount(profile.daily_nap_count));
      setBabyBirthdate(profile.baby_birthdate);
      setBirthdatePickerValue(toDateInput(profile.baby_birthdate));
      const start = normalizeDayMinutes(
        profile.day_start_minutes,
        DEFAULT_DAY_START_MINUTES
      );
      const end = normalizeDayMinutes(
        profile.day_end_minutes,
        DEFAULT_DAY_END_MINUTES
      );
      setDayStartMinutes(start);
      setDayEndMinutes(end);
      setDayStartPickerValue(minutesToDate(start));
      setDayEndPickerValue(minutesToDate(end));
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

  const pickDailyNapCount = () => {
    Alert.alert('Daily naps', undefined, [
      ...NAP_OPTIONS.map((count) => ({
        text: formatNapCount(count),
        onPress: () => setDailyNapCount(count),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const saveSettings = async () => {
    const trimmedName = babyName.trim();
    if (!trimmedName) {
      setNameError('Baby name is required.');
      Alert.alert('Error', 'Baby name is required.');
      return;
    }

    if (dayStartMinutes >= dayEndMinutes) {
      setDayWindowError('Day end must be after day start.');
      Alert.alert('Error', 'Day end must be after day start.');
      return;
    }

    setNameError('');
    setDayWindowError('');
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save settings.');
        return;
      }

      await updateUserProfile(token, {
        baby_name: trimmedName,
        baby_birthdate: babyBirthdate,
        daily_nap_count: dailyNapCount,
        day_start_minutes: dayStartMinutes,
        day_end_minutes: dayEndMinutes,
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
        {isLoading ? (
          <TimerSectionCard>
            <Text className="text-white/75 text-base">Loading...</Text>
          </TimerSectionCard>
        ) : (
          <>
            <TimerSectionCard>
              <Text className={timerSectionLabelClassName}>Baby</Text>

              <View className={`${timerSettingRowClassName} border-t-0`}>
                <Text className="text-white text-xl font-semibold flex-1 mr-2">
                  Name:
                </Text>
                <TextInput
                  value={babyName}
                  onChangeText={(text) => {
                    setBabyName(text);
                    if (nameError) setNameError('');
                  }}
                  placeholder="Enter name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!isSaving}
                  accessibilityLabel="Baby name"
                  className="text-white text-lg font-semibold underline text-right min-w-[120px] py-0"
                  cursorColor="#ffffff"
                  selectionColor="white"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {nameError ? (
                <Text className="text-error-400 text-sm mt-1">{nameError}</Text>
              ) : null}

              <TimerSettingRow
                label="Birthdate:"
                value={formatBirthdate(babyBirthdate)}
                placeholder="Select date"
                onPress={() => setIsBirthdatePickerOpen(true)}
                disabled={isSaving}
                accessibilityLabel="Set baby birthdate"
                size="lg"
              />

              <TimerSettingRow
                label="Daily naps:"
                value={formatNapCount(dailyNapCount)}
                placeholder="Select naps"
                onPress={pickDailyNapCount}
                disabled={isSaving}
                accessibilityLabel="Select daily nap count"
                size="lg"
              />

              <Text className={`${timerSectionLabelClassName} mt-6`}>
                Day vs night
              </Text>
              <TimerSettingRow
                label="Start:"
                value={minutesToDisplayTime(dayStartMinutes)}
                placeholder="Select time"
                onPress={() => {
                  setDayStartPickerValue(minutesToDate(dayStartMinutes));
                  setIsDayStartPickerOpen(true);
                }}
                disabled={isSaving}
                accessibilityLabel="Set day start time"
                size="lg"
              />
              <TimerSettingRow
                label="End:"
                value={minutesToDisplayTime(dayEndMinutes)}
                placeholder="Select time"
                onPress={() => {
                  setDayEndPickerValue(minutesToDate(dayEndMinutes));
                  setIsDayEndPickerOpen(true);
                }}
                disabled={isSaving}
                accessibilityLabel="Set day end time"
                size="lg"
              />
              {dayWindowError ? (
                <Text className="text-error-400 text-sm mt-1">
                  {dayWindowError}
                </Text>
              ) : null}

              <TimerOutlineButton
                label="Save"
                iconName="save-sharp"
                onPress={() => void saveSettings()}
                disabled={isSaving}
                isLoading={isSaving}
                size="xl"
                variant="solid"
                className="mt-6"
              />
            </TimerSectionCard>
          </>
        )}
      </VStack>

      <TimerDateTimePickerDrawer
        isOpen={isBirthdatePickerOpen}
        title="Baby birthdate"
        value={birthdatePickerValue}
        mode="date"
        onChange={(date) => {
          setBirthdatePickerValue(date);
          setBabyBirthdate(toIsoDate(date));
        }}
        onClose={() => setIsBirthdatePickerOpen(false)}
      />

      <TimerDateTimePickerDrawer
        isOpen={isDayStartPickerOpen}
        title="Day start"
        value={dayStartPickerValue}
        mode="time"
        onChange={(date) => {
          setDayStartPickerValue(date);
          setDayStartMinutes(dateToMinutes(date));
          if (dayWindowError) setDayWindowError('');
        }}
        onClose={() => setIsDayStartPickerOpen(false)}
      />

      <TimerDateTimePickerDrawer
        isOpen={isDayEndPickerOpen}
        title="Day end"
        value={dayEndPickerValue}
        mode="time"
        onChange={(date) => {
          setDayEndPickerValue(date);
          setDayEndMinutes(dateToMinutes(date));
          if (dayWindowError) setDayWindowError('');
        }}
        onClose={() => setIsDayEndPickerOpen(false)}
      />
    </ScreenScrollLayout>
  );
};

export default SettingsScreen;
