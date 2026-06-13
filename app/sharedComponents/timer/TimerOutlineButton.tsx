import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { timerOutlineButtonClassName, timerPrimaryButtonClassName } from '@/app/constants/screenLayout';

type TimerOutlineButtonProps = {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  accessibilityLabel?: string;
  className?: string;
  variant?: 'outline' | 'primary';
  size?: 'md' | 'lg';
};

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
  const baseClassName =
    variant === 'primary' ? timerPrimaryButtonClassName : timerOutlineButtonClassName;
  const labelClassName =
    size === 'lg'
      ? 'text-white text-lg font-semibold'
      : 'text-white text-base font-semibold';
  const iconSize = size === 'lg' ? 22 : 20;

  return (
  <Pressable
    className={`${baseClassName}${className ? ` ${className}` : ''}${disabled ? ' opacity-40' : ''}`}
    onPress={onPress}
    disabled={disabled || isLoading}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
  >
    {isLoading ? (
      <ActivityIndicator color="white" size="small" />
    ) : (
      <>
        {iconName ? (
          <Ionicons
            name={iconName}
            size={iconSize}
            color="white"
            style={{ marginRight: 8 }}
          />
        ) : null}
        <Text className={labelClassName}>{label}</Text>
      </>
    )}
  </Pressable>
  );
};

export default TimerOutlineButton;
