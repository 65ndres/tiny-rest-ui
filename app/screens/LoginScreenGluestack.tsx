import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from '@/components/ui/checkbox';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
} from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Link, LinkText } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassInputClassName,
  homeContentStackClassName,
  mutedTextClassName,
  scrollContentClassName,
  timerSessionResetLinkClassName,
} from '@/app/constants/screenLayout';
import { useAuth } from '../context/AuthContext';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type AuthStackParamList = {
  SignUpGluestack: undefined;
  PasswordReset: undefined;
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;

const PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.75)';

const inputFieldClassName = 'text-white text-lg';
const labelClassName = 'text-white text-base';

const authScrollContentClassName = `${scrollContentClassName} justify-center`;

const LoginScreenGluestack: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (!success) {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  return (
    <ScreenScrollLayout
      contentContainerClassName={authScrollContentClassName}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className={homeContentStackClassName}>
        <TimerSectionCard>
          <Heading size="2xl" className="text-white">
            Log in
          </Heading>
          <Text className={`mt-2 ${mutedTextClassName}`}>Welcome back</Text>

          <FormControl isInvalid={!!emailError} size="lg" className="w-full mt-4">
            <FormControlLabel>
              <FormControlLabelText size="md" className={labelClassName}>
                Email
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              size="lg"
              isDisabled={isLoading}
              isInvalid={!!emailError}
              className={glassInputClassName}
            >
              <InputField
                placeholder="Enter your email"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={email}
                onChangeText={(text) => {
                  setEmail(text.toLowerCase());
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email"
                className={inputFieldClassName}
                cursorColor="#ffffff"
                selectionColor="white"
              />
            </Input>
            {emailError ? (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText size="md" className="text-error-400">
                  {emailError}
                </FormControlErrorText>
              </FormControlError>
            ) : null}
          </FormControl>

          <FormControl isInvalid={!!passwordError} size="lg" className="w-full mt-6">
            <FormControlLabel>
              <FormControlLabelText size="md" className={labelClassName}>
                Password
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              size="lg"
              isDisabled={isLoading}
              isInvalid={!!passwordError}
              className={glassInputClassName}
            >
              <InputField
                placeholder="Enter your password"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password"
                className={inputFieldClassName}
                cursorColor="#ffffff"
                selectionColor="white"
              />
              <InputSlot
                onPress={() => setShowPassword((prev) => !prev)}
                className="mr-3"
              >
                <InputIcon
                  as={showPassword ? EyeIcon : EyeOffIcon}
                  className="text-white"
                />
              </InputSlot>
            </Input>
            {passwordError ? (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText size="md" className="text-error-400">
                  {passwordError}
                </FormControlErrorText>
              </FormControlError>
            ) : null}
          </FormControl>

          <HStack className="justify-between my-5 items-center">
            <Checkbox
              value="remember"
              size="md"
              isChecked={rememberMe}
              onChange={setRememberMe}
              isDisabled={isLoading}
            >
              <CheckboxIndicator>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel className={mutedTextClassName}>Remember me</CheckboxLabel>
            </Checkbox>

            <Pressable
              onPress={() => navigation.navigate('PasswordReset')}
              disabled={isLoading}
              accessibilityRole="link"
            >
              <Text className={`${timerSessionResetLinkClassName} underline`}>
                Forgot password?
              </Text>
            </Pressable>
          </HStack>

          <TimerOutlineButton
            label="Log in"
            iconName="log-in-sharp"
            onPress={() => void handleLogin()}
            disabled={isLoading}
            isLoading={isLoading}
            variant="primary"
            size="lg"
            accessibilityLabel="Log in"
          />
        </TimerSectionCard>

        <Link onPress={() => navigation.navigate('SignUpGluestack')} disabled={isLoading}>
          <LinkText size="md" className={`${mutedTextClassName} text-center`}>
            Don&apos;t have an account? Sign up
          </LinkText>
        </Link>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default LoginScreenGluestack;
