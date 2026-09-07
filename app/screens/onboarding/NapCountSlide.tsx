import { Ionicons } from '@expo/vector-icons';
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
import { layout, mutedTextStyle, stackGapStyle } from '@/app/constants/screenLayout';
import { vh } from '@/constants/appViewport';
import OnboardingSlideShell from './OnboardingSlideShell';

const DROPDOWN_MAX_HEIGHT = vh(220);

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
            Daily naps
          </Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24, marginTop: layout.space16 }]}
          >
            How many naps does your baby usually take each day?
          </Text>

          <View className="w-full" style={{ marginBottom: layout.space8 }}>
            <Pressable
              onPress={() => setIsDropdownOpen((open) => !open)}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityState={{ expanded: isDropdownOpen }}
              accessibilityLabel={napSchedule?.label ?? 'Select how many naps per day'}
              className={`w-full flex-row items-center justify-between border ${
                isDropdownOpen || napSchedule
                  ? 'border-white bg-white/20'
                  : 'border-white/30 bg-white/10'
              }`}
              style={{
                borderRadius: layout.radius12,
                paddingHorizontal: layout.space16,
                paddingVertical: layout.space12,
              }}
            >
              <Text
                className={napSchedule ? 'text-white font-semibold' : 'text-white/60 font-semibold'}
                style={{ fontSize: layout.fontLg }}
              >
                {napSchedule?.label ?? 'Select naps'}
              </Text>
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={layout.iconLg}
                color="rgba(255,255,255,0.7)"
              />
            </Pressable>

            {isDropdownOpen ? (
              <View
                className="w-full border border-white/30 bg-white/10"
                style={{
                  marginTop: layout.space8,
                  borderRadius: layout.radius12,
                  maxHeight: DROPDOWN_MAX_HEIGHT,
                  overflow: 'hidden',
                }}
              >
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {NAP_SCHEDULE_OPTIONS.map((option, index) => {
                    const selected = napSchedule?.id === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          onNapScheduleChange(option);
                          if (error) setError('');
                          setIsDropdownOpen(false);
                        }}
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                        style={{
                          paddingHorizontal: layout.space16,
                          paddingVertical: layout.space12,
                          borderTopWidth: index === 0 ? 0 : 1,
                          borderTopColor: 'rgba(255, 255, 255, 0.15)',
                          backgroundColor: selected
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'transparent',
                        }}
                      >
                        <Text
                          className="text-white font-semibold"
                          style={{ fontSize: layout.fontLg }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </View>
          {error ? (
            <Text
              className="text-error-400 font-semibold"
              style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
            >
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
              style={{ marginTop: layout.space24 }}
              accessibilityLabel="Next"
            />
          ) : null}
        </TimerSectionCard>
      </VStack>
    </OnboardingSlideShell>
  );
};

export default NapCountSlide;
