import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Alert } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import {
  stackGapStyle,
  timerContentStackClassName,
} from '@/app/constants/screenLayout';
import BabyProfileForm from '@/app/sharedComponents/babies/BabyProfileForm';
import type { BabyProfileValues } from '@/app/utils/babyProfileForm';
import { updateUserProfile } from '@/app/utils/userProfile';
import OnboardingSlideShell from './OnboardingSlideShell';

type BabyProfileSlideProps = {
  babyName: string;
  babyBirthdate: string | null;
  onBabyNameChange: (name: string) => void;
  onBabyBirthdateChange: (date: string | null) => void;
  onPressNext?: () => void | Promise<void>;
};

const BabyProfileSlide: React.FC<BabyProfileSlideProps> = ({
  babyName,
  babyBirthdate,
  onBabyNameChange,
  onBabyBirthdateChange,
  onPressNext,
}) => {
  // During onboarding the account's first baby is saved through the profile.
  const handleSubmit = async (values: BabyProfileValues) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to continue.');
        return;
      }

      await updateUserProfile(token, {
        baby_name: values.name.trim(),
        baby_birthdate: values.birthdate,
        day_start_minutes: values.dayStartMinutes,
        day_end_minutes: values.dayEndMinutes,
      });
      void onPressNext?.();
    } catch {
      Alert.alert('Error', 'Could not save baby details. Please try again.');
    }
  };

  return (
    <OnboardingSlideShell>
      <VStack className={`${timerContentStackClassName} flex-1`} style={stackGapStyle}>
        <BabyProfileForm
          title="Tell us about baby"
          subtitle="We'll personalize nap guidance for your little one."
          submitLabel="Next"
          babyName={babyName}
          babyBirthdate={babyBirthdate}
          onBabyNameChange={onBabyNameChange}
          onBabyBirthdateChange={onBabyBirthdateChange}
          onSubmit={handleSubmit}
        />
      </VStack>
    </OnboardingSlideShell>
  );
};

export default BabyProfileSlide;
