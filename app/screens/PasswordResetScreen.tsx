import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Link, LinkText } from '@/components/ui/link';
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
import { vh } from '@/constants/appViewport';
import { API_URL } from '../../constants/Config';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type AuthStackParamList = {
  LoginGluestack: undefined;
  SignUpGluestack: undefined;
  PasswordCode: { email: string };
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;

const inputClassName =
  'text-white font-semibold underline text-right flex-1 py-0';
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

const PasswordResetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailSubmit = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/password`, {
        email: email.trim(),
      });
      setEmailSubmitted(true);
    } catch (error: unknown) {
      console.error('Password reset request failed', error);
      const err = error as { response?: { data?: { error?: string } } };
      setEmailError(
        err.response?.data?.error || 'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSubmitted(false);
    setEmail('');
    setEmailError('');
  };

  const handleInputCode = () => {
    navigation.navigate('PasswordCode', { email: email.trim() });
  };

  return (
    <ScreenScrollLayout
      contentContainerClassName={`${timerScrollContentClassName}`}
      contentContainerStyle={timerScrollContentStyle}
      keyboardShouldPersistTaps="handled"
    >
      <VStack className={timerContentStackClassName} style={stackGapStyle}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: vh(34),
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: vh(40),
            }}
          >
            Forgot password
          </Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24 }]}
          >
            {emailSubmitted
              ? 'Check your inbox for a reset code'
              : 'Enter your email to receive a reset code'}
          </Text>

          {!emailSubmitted ? (
            <>
              <FieldRow label="Email:" isFirst>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase());
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Enter email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!isSubmitting}
                  accessibilityLabel="Email"
                  className={inputClassName}
                  style={{
                    ...fieldInputStyle,
                    minWidth: layout.space32 * 4 - layout.space8,
                    lineHeight: vh(25),
                    height: layout.space32,
                  }}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </FieldRow>
              {emailError ? (
                <Text className="text-error-400 text-lg font-semibold mt-1">
                  {emailError}
                </Text>
              ) : null}

              <TimerOutlineButton
                label="Reset password"
                iconName="mail-sharp"
                onPress={() => void handleEmailSubmit()}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                variant="solid"
                size="xl"
                style={{ marginTop: layout.space16 }}
                accessibilityLabel="Reset password"
              />
            </>
          ) : (
            <>
              <Text
                className={mutedTextClassName}
                style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space16 }]}
              >
                We will send you an email if the email is registered.
              </Text>
              <Text
                className={mutedTextClassName}
                style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24 }]}
              >
                If you don&apos;t receive an email, please check your spam folder.
              </Text>

              <TimerOutlineButton
                label="Try again"
                iconName="refresh-sharp"
                onPress={handleTryAgain}
                variant="solid"
                size="xl"
                style={{ marginTop: layout.space8 }}
                accessibilityLabel="Try again"
              />
              <TimerOutlineButton
                label="Input code"
                iconName="keypad-sharp"
                onPress={handleInputCode}
                variant="solid"
                size="xl"
                style={{ marginTop: layout.space12 }}
                accessibilityLabel="Input code"
              />
            </>
          )}
        </TimerSectionCard>

        <View
          className="w-full items-center"
          style={{
            marginTop: layout.space24,
            marginBottom: layout.space8,
            gap: layout.space24,
          }}
        >
          <Pressable
            onPress={() => navigation.navigate('LoginGluestack')}
            disabled={isSubmitting}
            accessibilityRole="link"
            className="items-center"
          >
            <Text
              style={{
                fontSize: layout.fontLg,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: layout.iconLg,
              }}
            >
              Log in
            </Text>
          </Pressable>

          <Link
            onPress={() => navigation.navigate('SignUpGluestack')}
            disabled={isSubmitting}
            className="items-center"
          >
            <LinkText
              style={{
                fontSize: layout.fontLg,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: layout.iconLg,
              }}
            >
              Don&apos;t have an account? Sign up
            </LinkText>
          </Link>
        </View>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default PasswordResetScreen;
