import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerSettingRowClassName,
} from '@/app/constants/screenLayout';
import { useAuth } from '../context/AuthContext';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type AuthStackParamList = {
  SignUpGluestack: undefined;
  SignUpCode: { email: string };
  LoginGluestack: undefined;
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;
type SignUpCodeRouteProp = RouteProp<AuthStackParamList, 'SignUpCode'>;

const inputClassName =
  'text-white text-lg font-semibold underline text-right min-w-[120px] flex-1 py-0';
const labelClassName = 'text-white text-xl font-semibold mr-2';

const SignUpCodeScreenGluestack: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SignUpCodeRouteProp>();
  const { verifySignup, resendSignupCode } = useAuth();
  const email = route.params?.email ?? '';

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    setCodeError('');
    if (!code.trim()) {
      setCodeError('Code is required');
      return;
    }
    if (code.trim().length !== 6) {
      setCodeError('Enter the 6-digit code');
      return;
    }
    if (!email) {
      setCodeError('Missing email. Please sign up again.');
      return;
    }

    setIsVerifying(true);
    const result = await verifySignup(email, code.trim());
    if (result.success) {
      return;
    }
    setIsVerifying(false);
    setCodeError(result.error);
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Error', 'Missing email. Please sign up again.');
      return;
    }

    setIsResending(true);
    const result = await resendSignupCode(email);
    setIsResending(false);

    if (result.success) {
      Alert.alert('Code sent', 'Check your email for a new verification code.');
      return;
    }
    Alert.alert('Error', result.error);
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
            Verify email
          </Text>
          <Text className={`${mutedTextClassName} text-lg mb-6`}>
            Enter the 6-digit code we sent to {email || 'your email'}.
          </Text>

          <View className={`${timerSettingRowClassName} border-t-0`}>
            <Text className={labelClassName}>Code:</Text>
            <TextInput
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                if (codeError) setCodeError('');
              }}
              placeholder="000000"
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!isVerifying && !isResending}
              accessibilityLabel="Verification code"
              className={inputClassName}
              style={{
                lineHeight: 25,
                height: 30,
                letterSpacing: 4,
              }}
              cursorColor="#ffffff"
              selectionColor="white"
              autoCapitalize="none"
              keyboardType="number-pad"
              autoCorrect={false}
              maxLength={6}
              textContentType="oneTimeCode"
            />
          </View>
          {codeError ? (
            <Text className="text-error-400 text-lg font-semibold mt-1">{codeError}</Text>
          ) : null}

          <View style={{ marginTop: 30 }}>
            <TimerOutlineButton
              label="Verify"
              iconName="checkmark-circle"
              onPress={() => void handleVerify()}
              disabled={isVerifying || isResending}
              isLoading={isVerifying}
              variant="solid"
              size="xl"
              className="mt-4"
              accessibilityLabel="Verify code"
            />
          </View>
        </TimerSectionCard>

        <View className="w-full items-center mt-6 mb-2 gap-6">
          <Pressable
            onPress={() => void handleResend()}
            disabled={isVerifying || isResending}
            accessibilityRole="button"
            className="items-center"
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 20,
                opacity: isResending ? 0.6 : 1,
              }}
            >
              {isResending ? 'Sending…' : 'Resend code'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('SignUpGluestack')}
            disabled={isVerifying || isResending}
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
              Back to sign up
            </Text>
          </Pressable>
        </View>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default SignUpCodeScreenGluestack;
