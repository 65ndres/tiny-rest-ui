import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
} from '@/app/constants/screenLayout';
import { updateUserProfile } from '@/app/utils/userProfile';
import {
  NAP_SCHEDULE_OPTIONS,
  type NapScheduleOption,
} from '@/app/utils/napSchedule';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import OnboardingSlideShell from './OnboardingSlideShell';

type NapCountSlideProps = {
  napSchedule: NapScheduleOption | null;
  onNapScheduleChange: (option: NapScheduleOption) => void;
  onPressNext?: () => void | Promise<void>;
};

const NapCountSlide: React.FC<NapCountSlideProps> = ({
  napSchedule,
  onNapScheduleChange,
  onPressNext,
}) => {
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = async () => {
    if (napSchedule == null) {
      setError('Please select how many naps per day.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to continue.');
        return;
      }

      await updateUserProfile(token, {
        daily_nap_count: napSchedule.daily_nap_count,
        daily_nap_count_alt: napSchedule.daily_nap_count_alt,
      });
      onPressNext?.();
    } catch {
      Alert.alert('Error', 'Could not save nap count. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingSlideShell>
      <ScrollView
        className="flex-1 w-full"
        contentContainerClassName="flex-grow items-center pb-4"
        showsVerticalScrollIndicator={false}
      >
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
              Daily naps
            </Text>
            <Text className={`${mutedTextClassName} text-lg mb-6 mt-4`}>
              How many naps does your baby usually take each day?
            </Text>

            <View className="w-full gap-3 mb-2">
              {NAP_SCHEDULE_OPTIONS.map((option) => {
                const selected = napSchedule?.id === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onNapScheduleChange(option);
                      if (error) setError('');
                    }}
                    disabled={isSaving}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    className={`w-full rounded-xl border px-4 py-3 ${
                      selected
                        ? 'border-white bg-white/20'
                        : 'border-white/30 bg-white/10'
                    }`}
                  >
                    <Text className="text-white text-lg font-semibold text-center">
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? (
              <Text className="text-error-400 text-lg font-semibold mt-1">
                {error}
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
      </ScrollView>
    </OnboardingSlideShell>
  );
};

export default NapCountSlide;
