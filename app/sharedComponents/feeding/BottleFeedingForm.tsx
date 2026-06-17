import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { FEEDING_TYPE_OPTIONS } from '@/app/constants/feedingTheme';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';
import type { BottleMetadata } from '@/app/utils/timerHistory';

type BottleFeedingFormProps = {
  startTimeLabel: string;
  onPressStartTime: () => void;
  metadata: BottleMetadata;
  onMetadataChange: (metadata: BottleMetadata) => void;
  onSave: () => void;
  isSaving: boolean;
};

const MAX_AMOUNT = 12;
const UNIT_OPTIONS = ['oz', 'mL'] as const;

const BottleFeedingForm: React.FC<BottleFeedingFormProps> = ({
  startTimeLabel,
  onPressStartTime,
  metadata,
  onMetadataChange,
  onSave,
  isSaving,
}) => {
  const unit = metadata.unit ?? 'oz';
  const amount = metadata.amount ?? 0;

  const pickType = () => {
    Alert.alert(
      'Feeding type',
      undefined,
      [
        ...FEEDING_TYPE_OPTIONS.map((option) => ({
          text: option,
          onPress: () =>
            onMetadataChange({ ...metadata, feeding_type: option }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickUnit = () => {
    Alert.alert(
      'Unit',
      undefined,
      [
        ...UNIT_OPTIONS.map((option) => ({
          text: option,
          onPress: () => onMetadataChange({ ...metadata, unit: option }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const adjustAmount = (delta: number) => {
    const next = Math.min(MAX_AMOUNT, Math.max(0, amount + delta));
    onMetadataChange({ ...metadata, amount: next });
  };

  return (
    <View className="w-full">
      <TimerSettingRow
        label="Start time:"
        value={startTimeLabel === 'Set time' ? '' : startTimeLabel}
        placeholder="Set time"
        onPress={onPressStartTime}
        accessibilityLabel="Select start time"
        isFirst
      />
      <TimerSettingRow
        label="Type:"
        value={metadata.feeding_type ?? ''}
        placeholder="Set type"
        onPress={pickType}
        accessibilityLabel="Select feeding type"
      />
      <TimerSettingRow
        label="Unit:"
        value={unit}
        placeholder="Select unit"
        onPress={pickUnit}
        accessibilityLabel="Select unit"
      />

      <View className="flex-row items-center justify-between py-3 border-t border-white/10">
        <View>
          <Text className="text-white text-lg font-semibold">Amount</Text>
          <Text className="text-white/75 text-sm">optional</Text>
        </View>
        <Pressable onPress={() => adjustAmount(1)}>
          <Text className="text-white text-base font-semibold underline">
            {amount > 0 ? `${amount} ${unit}` : 'Set amount'}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-white/75 text-sm w-6 text-center">0</Text>
        <View className="flex-1 flex-row items-center gap-2">
          <Pressable
            onPress={() => adjustAmount(-1)}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
            accessibilityLabel="Decrease amount"
          >
            <Text className="text-white text-xl leading-6">−</Text>
          </Pressable>
          <View className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <View
              style={[styles.fill, { width: `${(amount / MAX_AMOUNT) * 100}%` }]}
              className="h-full bg-white rounded-full"
            />
          </View>
          <Pressable
            onPress={() => adjustAmount(1)}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
            accessibilityLabel="Increase amount"
          >
            <Text className="text-white text-xl leading-6">+</Text>
          </Pressable>
        </View>
        <Text className="text-white/75 text-sm w-6 text-center">{MAX_AMOUNT}</Text>
      </View>

      <TimerOutlineButton
        label="Save"
        iconName="save-sharp"
        onPress={onSave}
        disabled={isSaving}
        isLoading={isSaving}
        size="lg"
        className="mt-6"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    height: '100%',
  },
});

export default BottleFeedingForm;
