import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from '@/components/ui/checkbox';
import { CheckIcon, EyeIcon, EyeOffIcon, Icon } from '@/components/ui/icon';
import { Link, LinkText } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerSectionLabelClassName,
  timerSettingRowClassName,
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
      contentContainerClassName={`${timerScrollContentClassName} justify-center`}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className={timerContentStackClassName}>
        <TimerSectionCard>
          <Text style={{fontSize: 34, fontWeight: 'bold', color: '#ffffff', lineHeight: 40}}>Log in</Text>
          <Text className={`${mutedTextClassName} text-lg mb-6`}>Welcome back</Text>

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



          <TimerOutlineButton
            label="Log in"
            iconName="log-in-sharp"
            onPress={() => void handleLogin()}
            disabled={isLoading}
            isLoading={isLoading}
            variant="solid"
            size="xl"
            className="mt-4"
            accessibilityLabel="Log in"
          />
        </TimerSectionCard>


        <View className="w-full items-center mt-6 mb-2 gap-6">
          <Pressable
            onPress={() => navigation.navigate('PasswordReset')}
            disabled={isLoading}
            accessibilityRole="link"
            className="items-center"
          >
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#ffffff', lineHeight: 20}}>
              Forgot password?
            </Text>
          </Pressable>

          <Link
            onPress={() => navigation.navigate('SignUpGluestack')}
            disabled={isLoading}
            className="items-center"
          >
            <LinkText style={{fontSize: 18, fontWeight: 'bold', color: '#ffffff', lineHeight: 20}}>
              Don&apos;t have an account? Sign up
            </LinkText>
          </Link>
        </View>


      </VStack>
    </ScreenScrollLayout>
  );
};

export default LoginScreenGluestack;
