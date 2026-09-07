import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { layout, timerSettingRowStyle } from '@/app/constants/screenLayout';
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
        size="lg"
      />
      <TimerSettingRow
        label="Type:"
        hint="optional"
        value={metadata.feeding_type ?? ''}
        placeholder="Set type"
        onPress={pickType}
        accessibilityLabel="Select feeding type"
        size="lg"
      />
      <TimerSettingRow
        label="Unit:"
        hint="optional"
        value={unit}
        placeholder="Select unit"
        onPress={pickUnit}
        accessibilityLabel="Select unit"
        size="lg"
      />

      <View
        className="flex-row items-center justify-between border-t border-white/10"
        style={timerSettingRowStyle}
      >
        <View>
          <Text className="text-white font-semibold" style={{ fontSize: layout.fontXl }}>
            Amount
          </Text>
          <Text className="text-white/75" style={{ fontSize: layout.fontSm }}>
            optional
          </Text>
        </View>
        <Pressable onPress={() => adjustAmount(1)}>
          <Text
            className="text-white font-semibold underline"
            style={{ fontSize: layout.fontLg }}
          >
            {amount > 0 ? `${amount} ${unit}` : 'Set amount'}
          </Text>
        </Pressable>
      </View>

      <View
        className="flex-row items-center"
        style={{ gap: layout.space8, marginBottom: layout.space8 }}
      >
        <Text
          className="text-white/75 text-center"
          style={{ fontSize: layout.fontSm, width: layout.space24 }}
        >
          0
        </Text>
        <View className="flex-1 flex-row items-center" style={{ gap: layout.space8 }}>
          <Pressable
            onPress={() => adjustAmount(-1)}
            className="rounded-full bg-white/10 items-center justify-center"
            style={{ width: layout.space36, height: layout.space36 }}
            accessibilityLabel="Decrease amount"
          >
            <Text className="text-white" style={{ fontSize: layout.fontXl, lineHeight: layout.space24 }}>
              −
            </Text>
          </Pressable>
          <View
            className="flex-1 rounded-full bg-white/20 overflow-hidden"
            style={{ height: layout.space6 }}
          >
            <View
              style={[styles.fill, { width: `${(amount / MAX_AMOUNT) * 100}%` }]}
              className="h-full bg-white rounded-full"
            />
          </View>
          <Pressable
            onPress={() => adjustAmount(1)}
            className="rounded-full bg-white/10 items-center justify-center"
            style={{ width: layout.space36, height: layout.space36 }}
            accessibilityLabel="Increase amount"
          >
            <Text className="text-white" style={{ fontSize: layout.fontXl, lineHeight: layout.space24 }}>
              +
            </Text>
          </Pressable>
        </View>
        <Text
          className="text-white/75 text-center"
          style={{ fontSize: layout.fontSm, width: layout.space24 }}
        >
          {MAX_AMOUNT}
        </Text>
      </View>

      <TimerOutlineButton
        label="Save"
        iconName="save-sharp"
        onPress={onSave}
        disabled={isSaving}
        isLoading={isSaving}
        size="xl"
        variant="solid"
        style={{ marginTop: layout.space24 }}
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
