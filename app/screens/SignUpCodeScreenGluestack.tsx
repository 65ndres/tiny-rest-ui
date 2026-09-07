import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
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
  'text-white font-semibold underline text-right flex-1 py-0';
const labelClassName = 'text-white font-semibold';

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
            Verify email
          </Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24 }]}
          >
            Enter the 6-digit code we sent to {email || 'your email'}.
          </Text>

          <View className={`${timerSettingRowClassName} border-t-0`} style={timerSettingRowStyle}>
            <Text className={labelClassName} style={fieldLabelStyle}>
              Code:
            </Text>
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
                ...fieldInputStyle,
                lineHeight: vh(25),
                height: layout.space32,
                letterSpacing: vh(4),
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
            <Text
              className="text-error-400 font-semibold"
              style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
            >
              {codeError}
            </Text>
          ) : null}

          <View style={{ marginTop: layout.space32 }}>
            <TimerOutlineButton
              label="Verify"
              iconName="checkmark-circle"
              onPress={() => void handleVerify()}
              disabled={isVerifying || isResending}
              isLoading={isVerifying}
              variant="solid"
              size="xl"
              style={{ marginTop: layout.space16 }}
              accessibilityLabel="Verify code"
            />
          </View>
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
            onPress={() => void handleResend()}
            disabled={isVerifying || isResending}
            accessibilityRole="button"
            className="items-center"
          >
            <Text
              style={{
                fontSize: layout.fontLg,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: layout.iconLg,
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
                fontSize: layout.fontLg,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: layout.iconLg,
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
