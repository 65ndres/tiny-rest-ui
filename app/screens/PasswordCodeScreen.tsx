import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Text } from '@rneui/themed';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import 'react-native-reanimated';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../context/AuthContext';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import BackButton from '../VerseModule/BackButton';

// Define the navigation stack param list
type RootStackParamList = {
  Home: undefined;
  VerseModule: undefined;
  PasswordReset: undefined;
  PasswordCode: {
    email: string;
  };
};

const width = Dimensions.get("window").width;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'PasswordCode';
  params: RootStackParamList['PasswordCode'];
};

const PasswordCodeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colorScheme = useColorScheme();
  const { login } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { email } = route.params || {};
  const [code, setCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState<string>('');
  const [codeVerified, setCodeVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Fade-in animation on component mount
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

  // Set header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <BackButton 
          text="" 
          onPress={handleBackPress}
        />
      ),
    });
  }, [navigation]);

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setCodeError('Code is required');
      return false;
    }
    setCodeError('');
    return true;
  };

  const validatePassword = (): boolean => {
    let isValid = true;

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!passwordConfirmation.trim()) {
      setPasswordConfirmationError('Password confirmation is required');
      isValid = false;
    } else if (password !== passwordConfirmation) {
      setPasswordConfirmationError('Passwords do not match');
      isValid = false;
    } else {
      setPasswordConfirmationError('');
    }

    return isValid;
  };

  const handleVerifyCode = async () => {
    if (!validateCode()) {
      return;
    }

    setIsVerifying(true);
    try {
      await axios.post(`${API_URL}/auth/password/verify`, {
        email: email,
        code: code.trim()
      });
      setCodeVerified(true);
    } catch (error: any) {
      console.error('Code verification failed', error);
      setCodeError(error.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsUpdating(true);
    try {
      await axios.put(`${API_URL}/auth/password`, {
        email: email,
        code: code.trim(),
        password: password.trim(),
        password_confirmation: passwordConfirmation.trim()
      });
      
      // Automatically sign the user in with the new password
      const loginSuccess = await login(email, password.trim());
      if (loginSuccess) {
        // User is now signed in - navigation will be handled by AuthContext
        // The app will automatically navigate to the authenticated screens
      } else {
        // If auto-login fails, show error but password was still updated
        setPasswordError('Password updated successfully, but automatic login failed. Please log in manually.');
      }
    } catch (error: any) {
      console.error('Password update failed', error);
      setPasswordError(error.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <ScreenComponent>
      <Animated.View style={{opacity: fadeAnim }}>
        <View style={{height: "22%"}}>
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <Text h2 style={{color: 'white', textAlign: 'center'}}>FORGOT?</Text>
          </View>
        </View>
        <View style={{height: "58%"}}>
          <View style={{flex: 1, justifyContent: 'flex-start', marginTop: 60}}>
            {!codeVerified ? (
              <>
                <View style={{paddingBottom: 5}}>
                  <Input
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (codeError) setCodeError('');
                    }}
                    cursorColor={"#ffffff"}
                    placeholder='Enter verification code'
                    selectionColor={'white'}
                    placeholderTextColor={'#d8d8d8ff'}
                    leftIcon={{ type: 'font-awesome', name: 'key', color: '#ffffffff', size: 30 }}
                    inputStyle={{color: 'white', fontSize: 22, paddingLeft: 20}}
                    labelStyle={{color: 'white'}}
                    inputContainerStyle={{borderBottomColor: 'white'}}
                    errorMessage={codeError}
                    errorStyle={{color: '#ff6b6b'}}
                    disabled={isVerifying}
                    keyboardType="number-pad"
                  />
                </View>
                <Button
                  title={isVerifying ? "VERIFYING..." : "VERIFY CODE"}
                  buttonStyle={{
                    backgroundColor: 'white',
                    borderWidth: 2,
                    borderColor: 'white',
                    borderRadius: 30,
                  }}
                  containerStyle={{
                    marginHorizontal: 50,
                    marginVertical: 10,
                  }}
                  titleStyle={{ fontWeight: 'bold', color: '#ac8861ff' }}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                  loading={isVerifying}
                />
              </>
            ) : (
              <>
                <View style={{paddingBottom: 5}}>
                  <Input
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                    cursorColor={"#ffffff"}
                    placeholder='New password'
                    selectionColor={'white'}
                    placeholderTextColor={'#d8d8d8ff'}
                    leftIcon={{ type: 'font-awesome', name: 'lock', color: '#ffffffff', size: 30 }}
                    inputStyle={{color: 'white', fontSize: 22, paddingLeft: 20}}
                    labelStyle={{color: 'white'}}
                    inputContainerStyle={{borderBottomColor: 'white'}}
                    errorMessage={passwordError}
                    errorStyle={{color: '#ff6b6b'}}
                    secureTextEntry
                    disabled={isUpdating}
                  />
                </View>
                <View style={{paddingBottom: 20}}>
                  <Input
                    value={passwordConfirmation}
                    onChangeText={(text) => {
                      setPasswordConfirmation(text);
                      if (passwordConfirmationError) setPasswordConfirmationError('');
                    }}
                    cursorColor={"#ffffff"}
                    placeholder='Confirm new password'
                    selectionColor={'white'}
                    placeholderTextColor={'#d8d8d8ff'}
                    leftIcon={{ type: 'font-awesome', name: 'lock', color: '#ffffffff', size: 30 }}
                    inputStyle={{color: 'white', fontSize: 22, paddingLeft: 20}}
                    labelStyle={{color: 'white'}}
                    inputContainerStyle={{borderBottomColor: 'white'}}
                    errorMessage={passwordConfirmationError}
                    errorStyle={{color: '#ff6b6b'}}
                    secureTextEntry
                    disabled={isUpdating}
                  />
                </View>
                <Button
                  title={isUpdating ? "UPDATING..." : "UPDATE PASSWORD"}
                  buttonStyle={{
                    backgroundColor: 'white',
                    borderWidth: 2,
                    borderColor: 'white',
                    borderRadius: 30,
                  }}
                  containerStyle={{
                    marginHorizontal: 50,
                    marginVertical: 10,
                  }}
                  titleStyle={{ fontWeight: 'bold', color: '#ac8861ff' }}
                  onPress={handleUpdatePassword}
                  disabled={isUpdating}
                  loading={isUpdating}
                />
              </>
            )}
          </View>
        </View>
        <View style={{height: "20%"}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <View style={styles.bottomSectionInner}>
            <Image source={require('../../assets/images/splash-icon.png')} style={styles.logoImage} />
          </View> 
          </View>
        </View>
      </Animated.View>
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
  text: {
    color: 'white',
    fontSize: 44,
    lineHeight: 84,
    fontWeight: '300',
    textAlign: 'center',
  } as TextStyle,
  separator: {
    marginVertical: 8,
    width: '80%',
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    marginLeft: 'auto',
    marginRight: 'auto',
  } as ViewStyle,
  logoImage: {
    height: 80,
    width: 80,
    alignSelf: 'center',
  },
  bottomSectionInner: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
});

export default PasswordCodeScreen;

