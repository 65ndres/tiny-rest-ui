import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { EyeIcon, EyeOffIcon, Icon } from '@/components/ui/icon';
import { Link, LinkText } from '@/components/ui/link';
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
  LoginGluestack: undefined;
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
      contentContainerClassName={`${timerScrollContentClassName} justify-center`}
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
            Sign up
          </Text>
          <Text className={`${mutedTextClassName} text-lg mb-6`}>
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
              cursorColor="#ffffff"
              selectionColor="white"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </FieldRow>
          {emailError ? (
            <Text className="text-error-400 text-sm mt-1">{emailError}</Text>
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
            <Text className="text-error-400 text-sm mt-1">{passwordError}</Text>
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
            <Text className="text-error-400 text-sm mt-1">
              {passwordConfirmationError}
            </Text>
          ) : null}
          <View style={{marginTop: 30}}>
            <TimerOutlineButton
              label="Create account"
              iconName="person-add-sharp"
              onPress={() => void handleSignup()}
              disabled={isLoading}
              isLoading={isLoading}
              variant="solid"
              size="xl"
              className="mt-4"
              accessibilityLabel="Create account"
            />
            </View>
        </TimerSectionCard>

        <View className="w-full items-center mt-6 mb-2 gap-6">
          <Link
            onPress={() => navigation.navigate('LoginGluestack')}
            disabled={isLoading}
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
              Already have an account? Log in
            </LinkText>
          </Link>
        </View>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default SignUpScreenGluestack;
