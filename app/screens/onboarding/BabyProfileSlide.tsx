import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
  timerSettingRowClassName,
} from '@/app/constants/screenLayout';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isBirthdatePickerOpen, setIsBirthdatePickerOpen] = useState(false);
  const [birthdatePickerValue, setBirthdatePickerValue] = useState(() =>
    toDateInput(babyBirthdate)
  );

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
      <VStack space="md" className={`${timerContentStackClassName} flex-1`}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 40,
            }}
          >
            Tell us about baby
          </Text>
          <Text className={`${mutedTextClassName} text-lg mb-6 mt-4`}>
            We&apos;ll personalize nap guidance for your little one.
          </Text>

          <View className={`${timerSettingRowClassName} border-t-0`}>
            <Text className="text-white text-xl font-semibold flex-1 mr-2">
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
                lineHeight: 20,
                fontSize: 18,
              }}
              accessibilityLabel="Baby name"
              className="text-white text-lg font-semibold underline text-right min-w-[120px] py-0"
              cursorColor="#ffffff"
              selectionColor="white"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {nameError ? (
            <Text className="text-error-400 text-lg font-semibold mt-1">
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
            <Text className="text-error-400 text-lg font-semibold mt-1">
              {birthdateError}
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
              className="mt-6"
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
    </OnboardingSlideShell>
  );
};

export default BabyProfileSlide;
