import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Link, LinkText } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassInputClassName,
  homeContentStackClassName,
  mutedTextClassName,
  scrollContentClassName,
} from '@/app/constants/screenLayout';
import { useAuth } from '../context/AuthContext';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type AuthStackParamList = {
  LoginGluestack: undefined;
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;

const PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.75)';

const inputFieldClassName = 'text-white text-lg';
const labelClassName = 'text-white text-base';

const authScrollContentClassName = `${scrollContentClassName} justify-center`;

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
      contentContainerClassName={authScrollContentClassName}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className={homeContentStackClassName}>
        <TimerSectionCard>
          <Heading size="2xl" className="text-white">
            Sign up
          </Heading>
          <Text className={`mt-2 ${mutedTextClassName}`}>Create your account</Text>

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
                autoCorrect={false}
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
                  if (passwordConfirmationError) setPasswordConfirmationError('');
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

          <FormControl isInvalid={!!passwordConfirmationError} size="lg" className="w-full mt-6">
            <FormControlLabel>
              <FormControlLabelText size="md" className={labelClassName}>
                Confirm password
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              size="lg"
              isDisabled={isLoading}
              isInvalid={!!passwordConfirmationError}
              className={glassInputClassName}
            >
              <InputField
                placeholder="Confirm your password"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={passwordConfirmation}
                onChangeText={(text) => {
                  setPasswordConfirmation(text);
                  if (passwordError) setPasswordError('');
                  if (passwordConfirmationError) setPasswordConfirmationError('');
                }}
                secureTextEntry={!showConfirmPassword}
                accessibilityLabel="Confirm password"
                className={inputFieldClassName}
                cursorColor="#ffffff"
                selectionColor="white"
              />
              <InputSlot
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                className="mr-3"
              >
                <InputIcon
                  as={showConfirmPassword ? EyeIcon : EyeOffIcon}
                  className="text-white"
                />
              </InputSlot>
            </Input>
            {passwordConfirmationError ? (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText size="md" className="text-error-400">
                  {passwordConfirmationError}
                </FormControlErrorText>
              </FormControlError>
            ) : null}
          </FormControl>

          <TimerOutlineButton
            label="Create account"
            iconName="person-add-sharp"
            onPress={() => void handleSignup()}
            disabled={isLoading}
            isLoading={isLoading}
            variant="primary"
            size="lg"
            className="mt-6"
            accessibilityLabel="Create account"
          />
        </TimerSectionCard>

        <Link onPress={() => navigation.navigate('LoginGluestack')} disabled={isLoading}>
          <LinkText size="md" className={`${mutedTextClassName} text-center`}>
            Already have an account? Log in
          </LinkText>
        </Link>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default SignUpScreenGluestack;
