import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { MAX_FONT_SCALE } from '@/app/constants/screenLayout';

/**
 * React Native Text / TextInput that follow the system text size only up to
 * MAX_FONT_SCALE. Import these instead of the react-native ones.
 */
export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>(
  function Text(props, ref) {
    return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} ref={ref} />;
  }
);

export const TextInput = React.forwardRef<
  React.ComponentRef<typeof RNTextInput>,
  TextInputProps
>(function TextInput(props, ref) {
  return (
    <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} ref={ref} />
  );
});
