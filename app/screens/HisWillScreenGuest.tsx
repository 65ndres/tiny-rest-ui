import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import VerseModule from '../VerseModule/VerseModule';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

const quoteContentMaxWidth = Math.min(s(340), screenWidth);

type AuthStackParamList = {
  Login: undefined;
  HisWillScreenGuest: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
  PasswordCode: { email: string };
};

/**
 * Non-authenticated version of His Will.
 * Like and Share buttons navigate to the Login screen instead of performing actions.
 */
const HisWillScreenGuest: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const API_URL_HIS_WILL = `${API_URL}/verses/his_will_guest`;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <ScreenComponent style={styles.screen}>
      <Animated.View style={[styles.fadeRoot, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <View style={styles.topContent}>
            <View style={styles.quoteColumn}>
              <Text style={styles.quoteText}>
                {'"Trust in the LORD with all your heart..."'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.middleSection}>
          <VerseModule
            data={[]}
            url={API_URL_HIS_WILL}
            active={0}
            requireAuth={false}
            onLikePress={goToLogin}
            onSharePress={goToLogin}
          />
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.bottomContent}>
            <Text style={styles.appNameText}>Promesas</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenComponent>
  );
};

export default HisWillScreenGuest;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fadeRoot: {
    flex: 1,
  },
  topSection: {
    flex: 2,
    minHeight: 0,
  },
  topContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: s(12),
  },
  quoteColumn: {
    width: '100%',
    maxWidth: quoteContentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: s(24),
  },
  middleSection: {
    flex: 6,
    minHeight: 0,
  },
  bottomSection: {
    flex: 2,
    minHeight: 0,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: s(18),
  },
  quoteText: {
    color: 'white',
    fontSize: s(22),
    fontWeight: '300',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  appNameText: {
    color: 'white',
    fontSize: s(15),
    fontWeight: '500',
    textAlign: 'center',
  },
});
