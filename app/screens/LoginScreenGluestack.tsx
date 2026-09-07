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
  PasswordReset: undefined;
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
      contentContainerClassName={`${timerScrollContentClassName}`}
      contentContainerStyle={timerScrollContentStyle}
      keyboardShouldPersistTaps="handled"
    >
      <VStack className={timerContentStackClassName} style={stackGapStyle}>
        <TimerSectionCard>
          <Text style={{fontSize: vh(34), fontWeight: 'bold', color: '#ffffff', lineHeight: vh(40)}}>Log in</Text>
          <Text
            className={mutedTextClassName}
            style={[mutedTextStyle, { fontSize: layout.fontLg, marginBottom: layout.space24 }]}
          >
            Welcome back
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



          <TimerOutlineButton
            label="Log in"
            iconName="log-in-sharp"
            onPress={() => void handleLogin()}
            disabled={isLoading}
            isLoading={isLoading}
            variant="solid"
            size="xl"
            style={{ marginTop: layout.space16 }}
            accessibilityLabel="Log in"
          />
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
            onPress={() => navigation.navigate('PasswordReset')}
            disabled={isLoading}
            accessibilityRole="link"
            className="items-center"
          >
            <Text style={{fontSize: layout.fontLg, fontWeight: 'bold', color: '#ffffff', lineHeight: layout.iconLg}}>
              Forgot password?
            </Text>
          </Pressable>

          <Link
            onPress={() => navigation.navigate('SignUpGluestack')}
            disabled={isLoading}
            className="items-center"
          >
            <LinkText style={{fontSize: layout.fontLg, fontWeight: 'bold', color: '#ffffff', lineHeight: layout.iconLg}}>
              Don&apos;t have an account? Sign up
            </LinkText>
          </Link>
        </View>


      </VStack>
    </ScreenScrollLayout>
  );
};

export default LoginScreenGluestack;
