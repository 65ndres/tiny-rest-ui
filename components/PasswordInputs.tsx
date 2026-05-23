import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';

const { width, height } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(height / REFERENCE_HEIGHT, width / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

interface PasswordInputsProps {
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  newPasswordError?: string;
  confirmPasswordError?: string;
  disabled?: boolean;
}

const PasswordInputs: React.FC<PasswordInputsProps> = ({
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  newPasswordError,
  confirmPasswordError,
  disabled = false,
}) => {
  return (
    <>
      <View style={styles.fieldContainer}>
        <View style={styles.inputRow}>
          <View style={styles.iconSlot}>
            <Ionicons name="lock-closed" size={s(22)} color="white" />
          </View>
          <TextInput
            secureTextEntry
            placeholder="New Password"
            value={newPassword}
            onChangeText={onNewPasswordChange}
            placeholderTextColor="#d8d8d8"
            style={[styles.inputField, disabled && styles.inputDisabled]}
            editable={!disabled}
          />
        </View>
        {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.inputRow}>
          <View style={styles.iconSlot}>
            <Ionicons name="lock-closed" size={s(22)} color="white" />
          </View>
          <TextInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            placeholderTextColor="#d8d8d8"
            placeholder="Confirm New Password"
            style={[styles.inputField, disabled && styles.inputDisabled]}
            editable={!disabled}
            accessibilityLabel="Confirm New Password"
          />
        </View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: s(14),
  } as ViewStyle,
  labelText: {
    color: 'white',
    fontSize: s(16),
  } as TextStyle,
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: 'white',
    borderBottomWidth: s(1),
  } as ViewStyle,
  inputField: {
    flex: 1,
    color: 'white',
    fontSize: s(18),
    paddingLeft: s(12),
    paddingVertical: s(10),
  } as TextStyle,
  inputDisabled: {
    opacity: 0.6,
  } as TextStyle,
  iconSlot: {
    justifyContent: 'center',
  } as ViewStyle,
  errorText: {
    color: '#ff6b6b',
    fontSize: s(12),
    fontWeight: 'bold',
    marginTop: s(4),
  } as TextStyle,
});

export default PasswordInputs;
