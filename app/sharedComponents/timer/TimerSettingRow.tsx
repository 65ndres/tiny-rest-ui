import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
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
  style?: StyleProp<ViewStyle>;
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
  style,
  hint,
}) => {
  const isLg = size === 'lg';
  const labelSize = isLg ? layout.fontXl : layout.fontLg;
  const valueSize = isLg ? layout.fontLg : layout.fontBase;

  return (
    <Pressable
      className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}
      style={[timerSettingRowStyle, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/* The label keeps its full width; the value side shrinks instead. */}
      <View style={{ flexGrow: 1, flexShrink: 0, marginRight: layout.space8 }}>
        <Text
          className="text-white font-semibold"
          numberOfLines={1}
          style={{ fontSize: labelSize }}
        >
          {label}
        </Text>
        {hint ? (
          <Text className="text-white/75" style={{ fontSize: layout.fontSm }}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center" style={{ flexShrink: 1, minWidth: 0 }}>
        <Text
          className="text-white font-semibold underline"
          numberOfLines={1}
          style={{ flexShrink: 1, fontSize: valueSize, marginRight: layout.space4 }}
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
