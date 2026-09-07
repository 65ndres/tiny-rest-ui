import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  fieldLabelStyle,
  layout,
  mutedTextClassName,
  mutedTextStyle,
  stackGapStyle,
  timerContentStackClassName,
  timerSectionLabelClassName,
  timerSectionLabelStyle,
  timerSettingRowClassName,
  timerSettingRowStyle,
} from '@/app/constants/screenLayout';
import { vh } from '@/constants/appViewport';
import {
  dateToMinutes,
  DEFAULT_DAY_END_MINUTES,
  DEFAULT_DAY_START_MINUTES,
  minutesToDate,
  minutesToDisplayTime,
} from '@/app/utils/dayWindow';
import { updateUserProfile } from '@/app/utils/userProfile';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';
import OnboardingSlideShell from './OnboardingSlideShell';

type BabyProfileSlideProps = {
  babyName: string;
  babyBirthdate: string | null;
  onBabyNameChange: (name: string) => void;
  onBabyBirthdateChange: (date: string | null) => void;
  onPressNext?: () => void | Promise<void>;
};

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

const BabyProfileSlide: React.FC<BabyProfileSlideProps> = ({
  babyName,
  babyBirthdate,
  onBabyNameChange,
  onBabyBirthdateChange,
  onPressNext,
}) => {
  const [nameError, setNameError] = useState('');
  const [birthdateError, setBirthdateError] = useState('');
  const [dayWindowError, setDayWindowError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBirthdatePickerOpen, setIsBirthdatePickerOpen] = useState(false);
  const [birthdatePickerValue, setBirthdatePickerValue] = useState(() =>
    toDateInput(babyBirthdate)
  );
  const [dayStartMinutes, setDayStartMinutes] = useState(
    DEFAULT_DAY_START_MINUTES
  );
  const [dayEndMinutes, setDayEndMinutes] = useState(DEFAULT_DAY_END_MINUTES);
  const [dayStartPickerValue, setDayStartPickerValue] = useState(() =>
    minutesToDate(DEFAULT_DAY_START_MINUTES)
  );
  const [dayEndPickerValue, setDayEndPickerValue] = useState(() =>
    minutesToDate(DEFAULT_DAY_END_MINUTES)
  );
  const [isDayStartPickerOpen, setIsDayStartPickerOpen] = useState(false);
  const [isDayEndPickerOpen, setIsDayEndPickerOpen] = useState(false);

  const handleNext = async () => {
    const trimmedName = babyName.trim();
    let hasError = false;

    if (!trimmedName) {
      setNameError('Baby name is required.');
      hasError = true;
    } else {
      setNameError('');
    }

    if (!babyBirthdate) {
      setBirthdateError('Birthdate is required.');
      hasError = true;
    } else {
      setBirthdateError('');
    }

    if (dayStartMinutes >= dayEndMinutes) {
      setDayWindowError('Day end must be after day start.');
      hasError = true;
    } else {
      setDayWindowError('');
    }

    if (hasError) return;

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to continue.');
        return;
      }

      await updateUserProfile(token, {
        baby_name: trimmedName,
        baby_birthdate: babyBirthdate,
        day_start_minutes: dayStartMinutes,
        day_end_minutes: dayEndMinutes,
      });
      onPressNext?.();
    } catch {
      Alert.alert('Error', 'Could not save baby details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingSlideShell>
      <VStack className={`${timerContentStackClassName} flex-1`} style={stackGapStyle}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: vh(34),
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: vh(40),
            }}
          >
            Tell us about baby
          </Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24, marginTop: layout.space16 }]}
          >
            We&apos;ll personalize nap guidance for your little one.
          </Text>

          <View className={`${timerSettingRowClassName} border-t-0`} style={timerSettingRowStyle}>
            <Text className="text-white font-semibold flex-1" style={fieldLabelStyle}>
              Name:
            </Text>
            <TextInput
              value={babyName}
              onChangeText={(text) => {
                onBabyNameChange(text);
                if (nameError) setNameError('');
              }}
              placeholder="Enter name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!isSaving}
              style={{
                lineHeight: layout.iconLg,
                fontSize: layout.fontLg,
                minWidth: layout.space32 * 4 - layout.space8,
              }}
              accessibilityLabel="Baby name"
              className="text-white font-semibold underline text-right py-0"
              cursorColor="#ffffff"
              selectionColor="white"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {nameError ? (
            <Text
              className="text-error-400 font-semibold"
              style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
            >
              {nameError}
            </Text>
          ) : null}

          <TimerSettingRow
            label="Birthdate:"
            value={formatBirthdate(babyBirthdate)}
            placeholder="Select date"
            onPress={() => {
              setBirthdatePickerValue(toDateInput(babyBirthdate));
              setIsBirthdatePickerOpen(true);
            }}
            disabled={isSaving}
            accessibilityLabel="Set baby birthdate"
            size="lg"
          />
          {birthdateError ? (
            <Text
              className="text-error-400 font-semibold"
              style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
            >
              {birthdateError}
            </Text>
          ) : null}

          <Text
            className={timerSectionLabelClassName}
            style={[timerSectionLabelStyle, { marginTop: layout.space24 }]}
          >
            Start and end of the day (normally)
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
            <Text
              className="text-error-400 font-semibold"
              style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
            >
              {dayWindowError}
            </Text>
          ) : null}

          {onPressNext ? (
            <TimerOutlineButton
              label="Next"
              iconName="arrow-forward-sharp"
              onPress={() => void handleNext()}
              disabled={isSaving}
              isLoading={isSaving}
              variant="solid"
              size="xl"
              style={{ marginTop: layout.space24 }}
              accessibilityLabel="Next"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>

      <TimerDateTimePickerDrawer
        isOpen={isBirthdatePickerOpen}
        title="Baby birthdate"
        value={birthdatePickerValue}
        mode="date"
        onChange={(date) => {
          setBirthdatePickerValue(date);
          onBabyBirthdateChange(toIsoDate(date));
          if (birthdateError) setBirthdateError('');
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
    </OnboardingSlideShell>
  );
};

export default BabyProfileSlide;
