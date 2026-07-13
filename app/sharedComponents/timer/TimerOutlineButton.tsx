import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  TIMER_SOLID_BUTTON_CONTENT_COLOR,
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
  variant?: 'outline' | 'primary' | 'solid';
  size?: 'md' | 'lg' | 'xl';
};

const variantClassName = {
  outline: timerOutlineButtonClassName,
  primary: timerPrimaryButtonClassName,
  solid: timerSolidButtonClassName,
} as const;

const sizeStyles = {
  md: { labelClassName: 'text-base font-semibold', iconSize: 20 },
  lg: { labelClassName: 'text-lg font-semibold', iconSize: 22 },
  xl: { labelClassName: 'text-xl font-semibold', iconSize: 24 },
} as const;

const TimerOutlineButton: React.FC<TimerOutlineButtonProps> = ({
  label,
  iconName,
  onPress,
  disabled = false,
  isLoading = false,
  accessibilityLabel,
  className,
  variant = 'outline',
  size = 'md',
}) => {
  const baseClassName = variantClassName[variant];
  const contentColor =
    variant === 'solid' ? TIMER_SOLID_BUTTON_CONTENT_COLOR : 'white';
  const { labelClassName, iconSize } = sizeStyles[size];

  return (
  <Pressable
    className={`${baseClassName}${className ? ` ${className}` : ''}${disabled ? ' opacity-40' : ''}`}
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
            style={{ marginRight: 8 }}
          />
        ) : null}
        <Text className={labelClassName} style={{ color: contentColor }}>
          {label}
        </Text>
      </>
    )}
  </Pressable>
  );
};

export default TimerOutlineButton;
