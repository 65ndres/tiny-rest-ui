import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { EyeIcon, EyeOffIcon, Icon } from '@/components/ui/icon';
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
import { useAuth } from '../context/AuthContext';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type AuthStackParamList = {
  LoginGluestack: undefined;
  SignUpCode: { email: string };
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

const SignUpScreenGluestack: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');

  const handleSignup = async () => {
    setEmailError('');
    setPasswordError('');
    setPasswordConfirmationError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (!passwordConfirmation.trim()) {
      setPasswordConfirmationError('Password confirmation is required');
      hasError = true;
    }
    if (hasError) return;

    if (password !== passwordConfirmation) {
      setPasswordError('Passwords do not match');
      setPasswordConfirmationError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password, passwordConfirmation);

    if (result.success) {
      if (result.needsVerification) {
        setIsLoading(false);
        navigation.navigate('SignUpCode', { email: result.email });
        return;
      }
      // Session already set — root layout advances to onboarding.
      return;
    }

    setIsLoading(false);
    const unmappedErrors: string[] = [];
    result.errors.forEach((msg) => {
      const lower = msg.toLowerCase();
      if (lower.includes('email')) {
        setEmailError((prev) => (prev ? `${prev}. ${msg}` : msg));
        return;
      }
      if (lower.includes('password')) {
        if (lower.includes('confirmation') || lower.includes('match')) {
          setPasswordConfirmationError((prev) => (prev ? `${prev}. ${msg}` : msg));
        } else {
          setPasswordError((prev) => (prev ? `${prev}. ${msg}` : msg));
        }
        return;
      }
      unmappedErrors.push(msg);
    });

    if (unmappedErrors.length) {
      Alert.alert('Error', unmappedErrors.join('\n'));
    }
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
            Sign up
          </Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24 }]}
          >
            Create your account
          </Text>

          <FieldRow label="Email:" isFirst>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text.toLowerCase());
                if (emailError) setEmailError('');
              }}
              placeholder="Enter email"
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!isLoading}
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
            <Text
              className="text-error-400 font-semibold"
              style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
            >
              {emailError}
            </Text>
          ) : null}

          <FieldRow label="Password:">
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
                if (passwordConfirmationError) setPasswordConfirmationError('');
              }}
              placeholder="Enter password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!isLoading}
              accessibilityLabel="Password"
              className={inputClassName}
              style={{ ...fieldInputStyle, minWidth: layout.space32 * 4 - layout.space8 }}
              cursorColor="#ffffff"
              selectionColor="white"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              style={{ marginLeft: layout.space8, padding: layout.space4 }}
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
                if (passwordError) setPasswordError('');
                if (passwordConfirmationError) setPasswordConfirmationError('');
              }}
              placeholder="Confirm password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              editable={!isLoading}
              accessibilityLabel="Confirm password"
              className={inputClassName}
              style={{ ...fieldInputStyle, minWidth: layout.space32 * 4 - layout.space8 }}
              cursorColor="#ffffff"
              selectionColor="white"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
              }
              style={{ marginLeft: layout.space8, padding: layout.space4 }}
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
          <View style={{ marginTop: layout.space32 }}>
            <TimerOutlineButton
              label="Create account"
              iconName="person-add-sharp"
              onPress={() => void handleSignup()}
              disabled={isLoading}
              isLoading={isLoading}
              variant="solid"
              size="xl"
              style={{ marginTop: layout.space16 }}
              accessibilityLabel="Create account"
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
          <Link
            onPress={() => navigation.navigate('LoginGluestack')}
            disabled={isLoading}
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
              Already have an account? Log in
            </LinkText>
          </Link>
        </View>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default SignUpScreenGluestack;
