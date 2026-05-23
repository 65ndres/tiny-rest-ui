// src/screens/LoginScreen.tsx
import { useColorScheme } from '@/hooks/useColorScheme'; // Adjust path if needed
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Text } from '@rneui/themed';
import { useFonts } from 'expo-font';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, StyleSheet, View, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenComponent from '../sharedComponents/ScreenComponent';

type RootStackParamList = {
  Home: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    // Validate required fields
    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    }
    
    if (hasError) {
      return;
    }
    
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (!success) {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  const handleNavigateToSignUp = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('SignUp');
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
      <Animated.View style={[styles.animatedView, { opacity: fadeAnim }]}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.welcomeText}>WELCOME BACK</Text>
            <View style={styles.form}>
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
              />
              <Input
                cursorColor="#ffffff"
                placeholder="password"
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
                }}
                errorMessage={passwordError}
                errorStyle={styles.errorStyle}
                secureTextEntry
                accessibilityLabel="Password"
                disabled={isLoading}
              />
              <Button
                title="LOG IN"
                buttonStyle={styles.loginButton}
                containerStyle={styles.loginButtonContainer}
                titleStyle={styles.loginButtonTitle}
                onPress={handleLogin}
                disabled={isLoading}
                loading={isLoading}
              />
              <Button
                containerStyle={styles.secondaryButtonContainer}
                title="Sign up"
                type="clear"
                titleStyle={styles.secondaryLinkTitle}
                onPress={handleNavigateToSignUp}
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
      </Animated.View>
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
  form: {
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
  loginButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
  } as ViewStyle,
  loginButtonContainer: {
    marginHorizontal: s(22),
    marginTop: s(8),
    marginBottom: s(8),
  } as ViewStyle,
  loginButtonTitle: {
    fontWeight: 'bold',
    color: '#ac8861ff',
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
  errorStyle: {
    color: '#ff6b6b',
    fontSize: s(12),
    fontWeight: 'bold',
  } as TextStyle,
});

export default LoginScreen;