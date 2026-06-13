import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { timerSettingRowClassName } from '@/app/constants/screenLayout';

type TimerSettingRowProps = {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  isFirst?: boolean;
};

const TimerSettingRow: React.FC<TimerSettingRowProps> = ({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  accessibilityLabel,
  isFirst = false,
}) => (
  <Pressable
    className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <Text className="text-white text-base font-semibold flex-1 mr-2">{label}</Text>
    <View className="flex-row items-center">
      <Text className="text-white/75 text-base mr-1">
        {value || placeholder}
      </Text>
      <Ionicons
        name="chevron-down"
        size={16}
        color="rgba(255,255,255,0.5)"
      />
    </View>
  </Pressable>
);

export default TimerSettingRow;
