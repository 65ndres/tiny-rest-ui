import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, type ViewStyle } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  TIMER_SOLID_BUTTON_CONTENT_COLOR,
  layout,
  timerButtonStyle,
  timerOutlineButtonClassName,
  timerPrimaryButtonClassName,
  timerSolidButtonClassName,
} from '@/app/constants/screenLayout';

type TimerOutlineButtonProps = {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  accessibilityLabel?: string;
  className?: string;
  style?: ViewStyle;
  variant?: 'outline' | 'primary' | 'solid';
  size?: 'md' | 'lg' | 'xl';
};

const variantClassName = {
  outline: timerOutlineButtonClassName,
  primary: timerPrimaryButtonClassName,
  solid: timerSolidButtonClassName,
} as const;

const sizeStyles = {
  md: { fontSize: layout.fontBase, iconSize: layout.iconLg },
  lg: { fontSize: layout.fontLg, iconSize: layout.iconXl },
  xl: { fontSize: layout.fontXl, iconSize: layout.icon2xl },
} as const;

const TimerOutlineButton: React.FC<TimerOutlineButtonProps> = ({
  label,
  iconName,
  onPress,
  disabled = false,
  isLoading = false,
  accessibilityLabel,
  className,
  style,
  variant = 'outline',
  size = 'md',
}) => {
  const baseClassName = variantClassName[variant];
  const contentColor =
    variant === 'solid' ? TIMER_SOLID_BUTTON_CONTENT_COLOR : 'white';
  const { fontSize, iconSize } = sizeStyles[size];

  return (
  <Pressable
    className={`${baseClassName}${className ? ` ${className}` : ''}${disabled ? ' opacity-40' : ''}`}
    style={[timerButtonStyle, style]}
    onPress={onPress}
    disabled={disabled || isLoading}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
  >
    {isLoading ? (
      <ActivityIndicator color={contentColor} size="small" />
    ) : (
      <>
        {iconName ? (
          <Ionicons
            name={iconName}
            size={iconSize}
            color={contentColor}
            style={{ marginRight: layout.space8 }}
          />
        ) : null}
        <Text className="font-semibold" style={{ color: contentColor, fontSize }}>
          {label}
        </Text>
      </>
    )}
  </Pressable>
  );
};

export default TimerOutlineButton;
