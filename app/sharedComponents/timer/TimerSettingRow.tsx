import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  layout,
  timerSettingRowClassName,
  timerSettingRowStyle,
} from '@/app/constants/screenLayout';

type TimerSettingRowProps = {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  isFirst?: boolean;
  size?: 'md' | 'lg';
  /** Secondary line under the label (e.g. "optional"). */
  hint?: string;
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
  hint,
}) => {
  const isLg = size === 'lg';
  const labelSize = isLg ? layout.fontXl : layout.fontLg;
  const valueSize = isLg ? layout.fontLg : layout.fontBase;

  return (
    <Pressable
      className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}
      style={timerSettingRowStyle}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View className="flex-1" style={{ marginRight: layout.space8 }}>
        <Text className="text-white font-semibold" style={{ fontSize: labelSize }}>
          {label}
        </Text>
        {hint ? (
          <Text className="text-white/75" style={{ fontSize: layout.fontSm }}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center">
        <Text
          className="text-white font-semibold underline"
          style={{ fontSize: valueSize, marginRight: layout.space4 }}
        >
          {value || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={isLg ? layout.iconMd : layout.iconSm}
          color="rgba(255,255,255,0.5)"
        />
      </View>
    </Pressable>
  );
};

export default TimerSettingRow;
