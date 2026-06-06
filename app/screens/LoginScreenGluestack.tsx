import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
} from 'react-native';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
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
import { useAuth } from '../context/AuthContext';
import ScreenComponent from '../sharedComponents/ScreenComponent';

type AuthStackParamList = {
  SignUpGluestack: undefined;
  PasswordReset: undefined;
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;

const PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.75)';

const inputClassName =
  'border-white data-[hover=true]:border-white data-[focus=true]:border-white';
const inputFieldClassName = 'text-white text-lg';
const labelClassName = 'text-white text-lg';
const bodyTextClassName = 'text-white text-lg';
const linkTextClassName = 'text-white text-lg';
const buttonTextClassName = 'text-white text-lg';

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
    <ScreenComponent>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-6 pb-4 items-center justify-center"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <VStack space="md" className="w-full max-w-[336px] items-center">
        <VStack className="rounded-xl border border-white/90 p-6 w-full">
          <Heading size="2xl" className="text-white">
            Log in
          </Heading>
          <Text size="lg" className={`mt-2 ${bodyTextClassName}`}>
            Login to start using gluestack
          </Text>

          <FormControl isInvalid={!!emailError} size="lg" className="w-full mt-4">
            <FormControlLabel>
              <FormControlLabelText size="lg" className={labelClassName}>
                Email
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              size="lg"
              isDisabled={isLoading}
              isInvalid={!!emailError}
              className={inputClassName}
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
              <FormControlLabelText size="lg" className={labelClassName}>
                Password
              </FormControlLabelText>
            </FormControlLabel>
            <Input
              size="lg"
              isDisabled={isLoading}
              isInvalid={!!passwordError}
              className={inputClassName}
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
              <CheckboxLabel className={bodyTextClassName}>Remember me</CheckboxLabel>
            </Checkbox>

            <Button
              variant="link"
              size="md"
              onPress={() => navigation.navigate('PasswordReset')}
              isDisabled={isLoading}
            >
              <ButtonText className={`${buttonTextClassName} underline underline-offset-1`}>
                Forgot Password?
              </ButtonText>
            </Button>
          </HStack>

          <Button
            variant="solid"
            className="w-full border-2 border-white bg-white"
            size="md"
            onPress={handleLogin}
            isDisabled={isLoading}
          >
            {isLoading ? (
              <ButtonSpinner color="white" />
            ) : (
              <ButtonText className={`${buttonTextClassName} text-black`}>Log in</ButtonText>
            )}
          </Button>
        </VStack>

        <Link onPress={() => navigation.navigate('SignUpGluestack')} disabled={isLoading}>
          <LinkText size="lg" className={`${linkTextClassName} mt-2`}>
            Don&apos;t have an account? Sign up
          </LinkText>
        </Link>
      </VStack>
      </ScrollView>
    </ScreenComponent>
  );
};

export default LoginScreenGluestack;
