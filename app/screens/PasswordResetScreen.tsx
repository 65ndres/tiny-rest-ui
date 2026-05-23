import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Text } from '@rneui/themed';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageStyle, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import 'react-native-reanimated';
import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import BackButton from '../VerseModule/BackButton';

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
  PasswordCode: {
    email: string;
  };
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const PasswordResetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleBackPress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton text="" onPress={handleBackPress} />,
    });
  }, [navigation]);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailSubmit = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/password`, {
        email: email.trim(),
      });
      setEmailSubmitted(true);
    } catch (error: unknown) {
      console.error('Password reset request failed', error);
      const err = error as { response?: { data?: { error?: string } } };
      setEmailError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSubmitted(false);
    setEmail('');
    setEmailError('');
  };

  const handleInputCode = () => {
    navigation.navigate('PasswordCode', { email: email.trim() });
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

  const handleNavigateToSignUp = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('SignUp');
    });
  };

  if (!loaded) {
    return null;
  }

  return (
    <ScreenComponent style={styles.screen}>
      <Animated.View style={[styles.animatedView, { opacity: fadeAnim }]}>
        <View style={styles.wrapper}>
          <View style={styles.main}>
            <Text style={styles.headline}>FORGOT?</Text>

            {!emailSubmitted ? (
              <View style={styles.form}>
                <Input
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  cursorColor="#ffffff"
                  placeholder="user@email.com"
                  selectionColor="white"
                  placeholderTextColor="#d8d8d8ff"
                  leftIcon={{ type: 'font-awesome', name: 'user', color: '#ffffffff', size: s(22) }}
                  inputStyle={styles.inputStyle}
                  labelStyle={styles.labelStyle}
                  inputContainerStyle={styles.inputContainerStyle}
                  errorMessage={emailError}
                  errorStyle={styles.errorStyle}
                  disabled={isSubmitting}
                />
                <Button
                  title={isSubmitting ? 'SENDING...' : 'RESET PASSWORD'}
                  buttonStyle={styles.primaryButton}
                  containerStyle={styles.primaryButtonContainer}
                  titleStyle={styles.primaryButtonTitle}
                  onPress={handleEmailSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
                <Button
                  containerStyle={styles.secondaryButtonContainer}
                  title="Log in"
                  type="clear"
                  titleStyle={styles.secondaryLinkTitle}
                  onPress={handleNavigateToLogin}
                  disabled={isSubmitting}
                />
                <Button
                  title="Sign up"
                  type="clear"
                  titleStyle={styles.secondaryLinkTitle}
                  onPress={handleNavigateToSignUp}
                  disabled={isSubmitting}
                />
              </View>
            ) : (
              <View style={styles.successBlock}>
                <Text style={styles.successTitle}>
                  We will send you an email if the email is registered.
                </Text>
                <Text style={styles.successSubtitle}>
                  If you don't receive an email, please check your spam folder.
                </Text>
                <View style={styles.dualButtonRow}>
                  <Button
                    title="TRY AGAIN"
                    buttonStyle={styles.secondaryPrimaryButton}
                    containerStyle={styles.dualButtonFlex}
                    titleStyle={styles.primaryButtonTitle}
                    onPress={handleTryAgain}
                  />
                  <Button
                    title="INPUT CODE"
                    buttonStyle={styles.secondaryPrimaryButton}
                    containerStyle={styles.dualButtonFlex}
                    titleStyle={styles.primaryButtonTitle}
                    onPress={handleInputCode}
                  />
                </View>
                <Button
                  containerStyle={styles.secondaryButtonContainer}
                  title="Log in"
                  type="clear"
                  titleStyle={styles.secondaryLinkTitle}
                  onPress={handleNavigateToLogin}
                />
                <Button
                  title="Sign up"
                  type="clear"
                  titleStyle={styles.secondaryLinkTitle}
                  onPress={handleNavigateToSignUp}
                />
              </View>
            )}
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
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: s(28),
    paddingBottom: s(18),
  } as ViewStyle,
  main: {
    flex: 1,
    paddingHorizontal: s(18),
    paddingTop: s(8),
  } as ViewStyle,
  headline: {
    color: 'white',
    textAlign: 'center',
    fontSize: s(30),
    fontWeight: '700',
    letterSpacing: s(1),
    marginBottom: s(18),
  } as TextStyle,
  form: {
    marginTop: s(8),
    width: '100%',
  } as ViewStyle,
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
  } as TextStyle,
  primaryButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
    paddingVertical: s(12),
    minHeight: s(48),
    justifyContent: 'center',
  } as ViewStyle,
  primaryButtonContainer: {
    marginHorizontal: s(22),
    marginTop: s(14),
  } as ViewStyle,
  primaryButtonTitle: {
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
  successBlock: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  } as ViewStyle,
  successTitle: {
    color: 'white',
    fontSize: s(18),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: s(12),
  } as TextStyle,
  successSubtitle: {
    color: 'white',
    fontSize: s(16),
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: s(22),
  } as TextStyle,
  dualButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: s(12),
    marginBottom: s(8),
  } as ViewStyle,
  dualButtonFlex: {
    flex: 1,
    maxWidth: s(180),
  } as ViewStyle,
  secondaryPrimaryButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
    paddingVertical: s(12),
    minHeight: s(48),
    justifyContent: 'center',
  } as ViewStyle,
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

export default PasswordResetScreen;
