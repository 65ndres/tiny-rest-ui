import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '@rneui/themed';
import { useFonts } from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import ScreenComponent from '../sharedComponents/ScreenComponent';

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signup } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!loaded) {
    return <Text>Loading fonts...</Text>;
  }

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
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
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
    }
  };

  const handleNavigateToLogin = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Login');
    });
  };

  const handleNavigateToPasswordReset = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('PasswordReset');
    });
  };

  return (
    <ScreenComponent style={styles.screen}>
      {/* <Animated.View style={[styles.animatedView, { opacity: fadeAnim }]}> */}
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.welcomeText}>WELCOME</Text>
            <View style={styles.formStack}>
              <Input
                cursorColor="#ffffff"
                placeholder="user@email.com"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{ type: 'font-awesome', name: 'user', color: '#ffffffff', size: s(22) }}
                inputStyle={styles.inputStyle}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={email}
                onChangeText={(text) => {
                  setEmail(text.toLowerCase());
                  if (emailError) setEmailError('');
                }}
                errorMessage={emailError}
                errorStyle={styles.errorStyle}
                accessibilityLabel="Email"
                disabled={isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                cursorColor="#ffffff"
                placeholder="New Password"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{ type: 'font-awesome', name: 'lock', color: '#ffffffff', size: s(22) }}
                inputStyle={styles.inputStyle}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (passwordConfirmationError) setPasswordConfirmationError('');
                }}
                errorMessage={passwordError}
                errorStyle={styles.errorStyle}
                secureTextEntry
                accessibilityLabel="New Password"
                disabled={isLoading}
              />

              <Input
                cursorColor="#ffffff"
                placeholder="Confirm New Password"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{ type: 'font-awesome', name: 'lock', color: '#ffffffff', size: s(22) }}
                inputStyle={styles.inputStyle}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={passwordConfirmation}
                onChangeText={(text) => {
                  setPasswordConfirmation(text);
                  if (passwordError) setPasswordError('');
                  if (passwordConfirmationError) setPasswordConfirmationError('');
                }}
                errorMessage={passwordConfirmationError}
                errorStyle={styles.errorStyle}
                secureTextEntry
                accessibilityLabel="Confirm New Password"
                disabled={isLoading}
              />

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ac8861" />
                ) : (
                  <Text style={styles.signupButtonTitle}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>
              <Button
                containerStyle={styles.secondaryButtonContainer}
                title="Log in"
                type="clear"
                titleStyle={styles.secondaryLinkTitle}
                onPress={handleNavigateToLogin}
                disabled={isLoading}
              />
              <Button
                title="Password Reset"
                type="clear"
                titleStyle={styles.secondaryLinkTitle}
                onPress={handleNavigateToPasswordReset}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
        <View style={styles.logoWrap}>
            <Image source={require('../../assets/images/splash-icon.png')} style={styles.logoImage} />
          </View>
      {/* </Animated.View> */}
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  } as ViewStyle,
  animatedView: {
    flex: 1,
  } as ViewStyle,
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: s(28),
    paddingBottom: s(18),
  } as ViewStyle,
  content: {
    paddingHorizontal: s(18),
    paddingTop: s(18),
  } as ViewStyle,
  formStack: {
    width: '100%',
    marginTop: s(14),
  } as ViewStyle,
  welcomeText: {
    color: 'white',
    textAlign: 'center',
    fontSize: s(26),
    letterSpacing: s(1),
    fontWeight: '700',
  } as TextStyle,
  inputStyle: {
    color: 'white',
    fontSize: s(18),
    paddingLeft: s(12),
  } as TextStyle,
  labelStyle: {
    color: 'white',
  } as TextStyle,
  inputContainerStyle: {
    borderBottomColor: 'white',
  } as ViewStyle,
  errorStyle: {
    color: '#ff6b6b',
    fontSize: s(12),
    fontWeight: 'bold',
  } as TextStyle,
  signupButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
    marginHorizontal: s(22),
    marginTop: s(14),
    paddingVertical: s(14),
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  signupButtonDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  signupButtonTitle: {
    fontWeight: 'bold',
    color: '#ac8861',
    fontSize: s(16),
  } as TextStyle,
  secondaryButtonContainer: {
    marginTop: s(8),
  } as ViewStyle,
  secondaryLinkTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: s(16),
    textDecorationLine: 'underline',
  } as TextStyle,
  logoWrap: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: s(10),
  } as ViewStyle,
  logoImage: {
    height: s(64),
    width: s(64),
    alignSelf: 'center',
  } as ImageStyle,
});

export default SignUpScreen;
