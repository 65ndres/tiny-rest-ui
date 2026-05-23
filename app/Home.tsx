import { APP_DISPLAY_NAME } from '@/constants/appBranding';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import 'react-native-reanimated';
import { useAuth } from './context/AuthContext';
import { useRevenueCat } from './context/RevenueCatContext';
import ScreenComponent from './sharedComponents/ScreenComponent';

// Define the navigation stack param list
type RootStackParamList = {
  Home: undefined;
  FeaturedScreen: undefined;
  BrowseScreen: undefined;
};

// Type the navigation prop
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Type the Separator component
const Separator: React.FC = () => <View style={styles.separator} />;

// Type the Home component
const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Fade-in animation on component mount
  // useFocusEffect(() => {
  //   Animated.timing(fadeAnim, {
  //     toValue: 1,
  //     duration: 500, // Animation duration in milliseconds
  //     useNativeDriver: true, // Use native driver for better performance
  //   }).start();
  // }, [fadeAnim]);


  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000, // Animation duration in milliseconds
        useNativeDriver: true, // Use native driver for better performance
      }).start();
    }, [fadeAnim])
  );

  // Reusable function to fade out and navigate
  const navigateWithFadeOut = (screenName: keyof RootStackParamList) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500, // Animation duration in milliseconds
      useNativeDriver: true,
    }).start(() => {
      // Navigate after fade-out completes
      navigation.navigate(screenName);
    });
  };

  const isProUser = user?.subscription_type === 'pro';

  const handleBrowsePress = () => {
    if (!isProUser) {
      void presentPaywall();
      return;
    }
    navigateWithFadeOut('BrowseScreen');
  };

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ScreenComponent>
        <View style={{height: '15%'}}>
        </View>

        <View style={{height: '65%'}}>
          {/* <Image source={require('../assets/images/splash-icon.png')} style={styles.logoImage} /> */}
          <View style={{flex: 1, justifyContent: 'center'}}>
          
          <Pressable onPress={() => navigateWithFadeOut('FeaturedScreen')}>
            <Text style={styles.text}>FEATURED</Text>
          </Pressable>
          <Separator />
          <Pressable
            onPress={handleBrowsePress}
            accessibilityState={{ disabled: !isProUser }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.text, !isProUser && styles.disabledText]}>BROWSE</Text>
              {!isProUser && (
                <View style={styles.proLabel}>
                  <Text style={styles.proLabelText}>Pro</Text>
                </View>
              )}
            </View>
          </Pressable>
          </View>
        </View>
        <View style={{height: '20%'}}>
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '500', textAlign: 'center' }}>{APP_DISPLAY_NAME}</Text>
          {/* <Image source={require('../assets/images/splash-icon.png')} style={styles.logoImage} /> */}
          </View>
        </View>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  image: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  textt: {
    color: 'white',
    fontSize: 40,
    lineHeight: 64,
    fontWeight: '300', // Use numeric value for better TypeScript compatibility ('light' equivalent)
    textAlign: 'center',
  } as TextStyle,
  text: {
    color: 'white',
    fontSize: 35,
    fontWeight: '400',
    textAlign: 'center',
  } as TextStyle,
  disabledText: {
    opacity: 0.65,
  } as TextStyle,
  separator: {
    marginVertical: 8,
    width: '90%',
    borderBottomColor: 'white',
    borderBottomWidth: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 25,
    marginBottom: 25,
  } as ViewStyle,
  proLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  } as ViewStyle,
  proLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  } as TextStyle,
    logoImage: {
      height: 60,
      width: 60,
      alignSelf: 'center',
    } as TextStyle,
  welcomeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
});

export default Home;
