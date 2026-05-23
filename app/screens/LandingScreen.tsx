import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { Button, Text } from '@rneui/themed';
import { Image } from 'expo-image';
import React from 'react';
import {
  Dimensions,
  ImageStyle,
  Pressable,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { APP_DISPLAY_NAME } from '@/constants/appBranding';
import ScreenComponent from '../sharedComponents/ScreenComponent';

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  FeaturedScreenGuest: undefined;
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleContinueGuest = () => {
    navigation.navigate('FeaturedScreenGuest');
  };

  return (
    <ScreenComponent style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.headline}>Welcome to {APP_DISPLAY_NAME}</Text>
          <Text style={styles.supporting}>Explore the word of the Lord in the simplest way possible.</Text>
          <Text style={styles.trial}>
            Create a <Text style={styles.trialEmphasis}>Basic</Text> account for free or try our{' '}
            <Text style={styles.trialEmphasis}>Pro</Text> account the get the most out of {APP_DISPLAY_NAME}. Includes a{' '}
            <Text style={styles.trialEmphasis}>14-day free trial.</Text>
          </Text>
          <View style={styles.buttonsContainer}>
            <Button
              title="LOG IN"
              buttonStyle={styles.primaryButton}
              containerStyle={styles.primaryButtonContainer}
              titleStyle={styles.primaryButtonTitle}
              onPress={handleLogin}
            />
            <Button
              title="SIGN UP"
              buttonStyle={styles.primaryButton}
              containerStyle={styles.primaryButtonContainer}
              titleStyle={styles.primaryButtonTitle}
              type="outline"
              onPress={handleSignUp}
            />
            <Pressable
              accessibilityRole="link"
              hitSlop={12}
              onPress={handleContinueGuest}
              style={styles.continueLinkWrap}
            >
              <Text style={styles.continueLink}>Continue as a guest</Text>
            </Pressable>
          </View>
        </View>

      </View>
      <View style={styles.bottomImageWrap}>
          <Image source={require('../../assets/images/splash-icon.png')} style={styles.splashIcon} />
        </View>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  } as ViewStyle,
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: s(28),
    paddingBottom: s(18),
  } as ViewStyle,
  bottomImageWrap: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  } as ViewStyle,
  content: {
    paddingHorizontal: s(24),
    paddingTop: s(18),
    alignItems: 'center',
  } as ViewStyle,
  headline: {
    color: 'white',
    textAlign: 'center',
    fontSize: s(26),
    lineHeight: s(33),
    fontWeight: '700',
    marginBottom: s(14),
  } as TextStyle,
  supporting: {
    color: 'white',
    textAlign: 'center',
    fontSize: s(18),
    lineHeight: s(26),
    fontWeight: '400',
    opacity: 0.95,
    marginBottom: s(14),
    paddingHorizontal: s(8),
  } as TextStyle,
  trial: {
    color: 'white',
    textAlign: 'center',
    fontSize: s(17),
    lineHeight: s(24),
    fontWeight: '400',
    marginBottom: s(18),
    paddingHorizontal: s(8),
  } as TextStyle,
  trialEmphasis: {
    fontWeight: '700',
    color: 'white',
  } as TextStyle,
  buttonsContainer: {
    width: '100%',
    maxWidth: Math.min(s(320), screenWidth),
  } as ViewStyle,
  primaryButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
  } as ViewStyle,
  primaryButtonContainer: {
    marginHorizontal: s(14),
    marginVertical: s(8),
  } as ViewStyle,
  primaryButtonTitle: {
    fontWeight: 'bold',
    color: '#ac8861ff',
    fontSize: s(16),
  } as TextStyle,
  continueLinkWrap: {
    alignSelf: 'center',
    marginTop: s(10),
    paddingVertical: s(6),
    paddingHorizontal: s(12),
  } as ViewStyle,
  continueLink: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: s(18),
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  } as TextStyle,
  logoImage: {
    width: s(64),
    height: s(64),
    alignSelf: 'center',
  } as ImageStyle,
  splashIcon: {
    width: s(64),
    height: s(64),
    alignSelf: 'center',
    marginTop: s(12),
  } as ImageStyle,
});

export default LandingScreen;
