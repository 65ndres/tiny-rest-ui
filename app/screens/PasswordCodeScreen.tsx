import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { EyeIcon, EyeOffIcon, Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  fieldInputStyle,
  fieldLabelStyle,
  layout,
  mutedTextClassName,
  mutedTextStyle,
  stackGapStyle,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerScrollContentStyle,
  timerSettingRowClassName,
  timerSettingRowStyle,
} from '@/app/constants/screenLayout';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../context/AuthContext';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type RootStackParamList = {
  PasswordCode: {
    email: string;
  };
};

type RouteProp = {
  key: string;
  name: 'PasswordCode';
  params: RootStackParamList['PasswordCode'];
};

const inputClassName =
  'text-white font-semibold underline text-right min-w-[120px] flex-1 py-0';
const labelClassName = 'text-white font-semibold';

type FieldRowProps = {
  label: string;
  isFirst?: boolean;
  children: React.ReactNode;
};

const FieldRow: React.FC<FieldRowProps> = ({ label, isFirst = false, children }) => (
  <View
    className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}
    style={timerSettingRowStyle}
  >
    <Text className={labelClassName} style={fieldLabelStyle}>
      {label}
    </Text>
    {children}
  </View>
);

const PasswordCodeScreen: React.FC = () => {
  const route = useRoute<RouteProp>();
  const { login } = useAuth();

  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setCodeError('Code is required');
      return false;
    }
    setCodeError('');
    return true;
  };

  const validatePassword = (): boolean => {
    let isValid = true;

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!passwordConfirmation.trim()) {
      setPasswordConfirmationError('Password confirmation is required');
      isValid = false;
    } else if (password !== passwordConfirmation) {
      setPasswordConfirmationError('Passwords do not match');
      isValid = false;
    } else {
      setPasswordConfirmationError('');
    }

    return isValid;
  };

  const handleVerifyCode = async () => {
    if (!validateCode()) {
      return;
    }

    setIsVerifying(true);
    try {
      await axios.post(`${API_URL}/auth/password/verify`, {
        email: email,
        code: code.trim()
      });
      setCodeVerified(true);
    } catch (error: any) {
      console.error('Code verification failed', error);
      setCodeError(error.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsUpdating(true);
    try {
      await axios.put(`${API_URL}/auth/password`, {
        email: email,
        code: code.trim(),
        password: password.trim(),
        password_confirmation: passwordConfirmation.trim()
      });
      
      // Automatically sign the user in with the new password
      const loginSuccess = await login(email, password.trim());
      if (loginSuccess) {
        // User is now signed in - navigation will be handled by AuthContext
        // The app will automatically navigate to the authenticated screens
      } else {
        // If auto-login fails, show error but password was still updated
        setPasswordError('Password updated successfully, but automatic login failed. Please log in manually.');
      }
    } catch (error: any) {
      console.error('Password update failed', error);
      setPasswordError(error.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScreenScrollLayout
      contentContainerClassName={timerScrollContentClassName}
      contentContainerStyle={timerScrollContentStyle}
      keyboardShouldPersistTaps="handled"
    >
      <VStack className={timerContentStackClassName} style={stackGapStyle}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: layout.font3xl,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: layout.space36,
            }}
          >
            {codeVerified ? 'New password' : 'Enter code'}
          </Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24 }]}
          >
            {codeVerified
              ? 'Choose a new password for your account'
              : 'Enter the verification code we sent you'}
          </Text>

          {!codeVerified ? (
            <>
              <FieldRow label="Code:" isFirst>
                <TextInput
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    if (codeError) setCodeError('');
                  }}
                  placeholder="Enter code"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!isVerifying}
                  accessibilityLabel="Verification code"
                  className={inputClassName}
                  style={fieldInputStyle}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  keyboardType="number-pad"
                  autoCorrect={false}
                />
              </FieldRow>
              {codeError ? (
                <Text
                  className="text-error-400 font-semibold"
                  style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
                >
                  {codeError}
                </Text>
              ) : null}

              <TimerOutlineButton
                label="Verify code"
                iconName="checkmark-sharp"
                onPress={() => void handleVerifyCode()}
                disabled={isVerifying}
                isLoading={isVerifying}
                variant="solid"
                size="xl"
                style={{ marginTop: layout.space16 }}
                accessibilityLabel="Verify code"
              />
            </>
          ) : (
            <>
              <FieldRow label="Password:" isFirst>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="New password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!isUpdating}
                  accessibilityLabel="New password"
                  className={inputClassName}
                  style={fieldInputStyle}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword((previous) => !previous)}
                  disabled={isUpdating}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  className="ml-2 p-1"
                >
                  <Icon
                    as={showPassword ? EyeIcon : EyeOffIcon}
                    className="text-white"
                    size="md"
                  />
                </Pressable>
              </FieldRow>
              {passwordError ? (
                <Text
                  className="text-error-400 font-semibold"
                  style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
                >
                  {passwordError}
                </Text>
              ) : null}

              <FieldRow label="Confirm:">
                <TextInput
                  value={passwordConfirmation}
                  onChangeText={(text) => {
                    setPasswordConfirmation(text);
                    if (passwordConfirmationError) setPasswordConfirmationError('');
                  }}
                  placeholder="Confirm password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!isUpdating}
                  accessibilityLabel="Confirm password"
                  className={inputClassName}
                  style={fieldInputStyle}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((previous) => !previous)}
                  disabled={isUpdating}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                  className="ml-2 p-1"
                >
                  <Icon
                    as={showConfirmPassword ? EyeIcon : EyeOffIcon}
                    className="text-white"
                    size="md"
                  />
                </Pressable>
              </FieldRow>
              {passwordConfirmationError ? (
                <Text
                  className="text-error-400 font-semibold"
                  style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
                >
                  {passwordConfirmationError}
                </Text>
              ) : null}

              <TimerOutlineButton
                label="Update password"
                iconName="lock-closed-sharp"
                onPress={() => void handleUpdatePassword()}
                disabled={isUpdating}
                isLoading={isUpdating}
                variant="solid"
                size="xl"
                style={{ marginTop: layout.space16 }}
                accessibilityLabel="Update password"
              />
            </>
          )}
        </TimerSectionCard>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default PasswordCodeScreen;

