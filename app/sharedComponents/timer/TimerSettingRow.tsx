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
  size?: 'md' | 'lg';
};

const TimerSettingRow: React.FC<TimerSettingRowProps> = ({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  accessibilityLabel,
  isFirst = false,
  size = 'md',
}) => {
  const isLg = size === 'lg';
  const labelClassName = isLg
    ? 'text-white text-xl font-semibold flex-1 mr-2'
    : 'text-white text-lg font-semibold flex-1 mr-2';
  const valueClassName = isLg
    ? 'text-white text-lg font-semibold underline mr-1'
    : 'text-white text-base font-semibold underline mr-1';

  return (
    <Pressable
      className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text className={labelClassName}>{label}</Text>
      <View className="flex-row items-center">
        <Text className={valueClassName}>{value || placeholder}</Text>
        <Ionicons
          name="chevron-down"
          size={isLg ? 18 : 16}
          color="rgba(255,255,255,0.5)"
        />
      </View>
    </Pressable>
  );
};

export default TimerSettingRow;
