import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Link, LinkText } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerSettingRowClassName,
} from '@/app/constants/screenLayout';
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
  'text-white text-lg font-semibold underline text-right min-w-[120px] flex-1 py-0';
const labelClassName = 'text-white text-xl font-semibold mr-2';

type FieldRowProps = {
  label: string;
  isFirst?: boolean;
  children: React.ReactNode;
};

const FieldRow: React.FC<FieldRowProps> = ({ label, isFirst = false, children }) => (
  <View className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}>
    <Text className={labelClassName}>{label}</Text>
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
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className={timerContentStackClassName}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 40,
            }}
          >
            Forgot password
          </Text>
          <Text className={`${mutedTextClassName} text-lg mb-6`}>
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
                    lineHeight: 25,
                    height: 30,
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
                className="mt-4"
                accessibilityLabel="Reset password"
              />
            </>
          ) : (
            <>
              <Text className={`${mutedTextClassName} text-lg mb-4`}>
                We will send you an email if the email is registered.
              </Text>
              <Text className={`${mutedTextClassName} text-lg mb-6`}>
                If you don&apos;t receive an email, please check your spam folder.
              </Text>

              <TimerOutlineButton
                label="Try again"
                iconName="refresh-sharp"
                onPress={handleTryAgain}
                variant="solid"
                size="xl"
                className="mt-2"
                accessibilityLabel="Try again"
              />
              <TimerOutlineButton
                label="Input code"
                iconName="keypad-sharp"
                onPress={handleInputCode}
                variant="solid"
                size="xl"
                className="mt-3"
                accessibilityLabel="Input code"
              />
            </>
          )}
        </TimerSectionCard>

        <View className="w-full items-center mt-6 mb-2 gap-6">
          <Pressable
            onPress={() => navigation.navigate('LoginGluestack')}
            disabled={isSubmitting}
            accessibilityRole="link"
            className="items-center"
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 20,
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
                fontSize: 18,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 20,
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
