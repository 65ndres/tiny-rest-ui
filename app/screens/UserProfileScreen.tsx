import { APP_DISPLAY_NAME } from '@/constants/appBranding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Button, Input } from '@rneui/themed';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import 'react-native-reanimated';
import PasswordInputs from '../../components/PasswordInputs';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../context/AuthContext';
import ScreenComponent from '../sharedComponents/ScreenComponent';

type RootDrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Subscription: undefined;
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');
  const [newPasswordError, setNewPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useFocusEffect(
    useCallback(() => {
      contentFadeAnim.setValue(0);
      fetchProfile();
    }, [contentFadeAnim])
  );

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setFirstName(response.data.first_name || '');
        setLastName(response.data.last_name || '');
        setUsername(response.data.username || '');
        setEmail(response.data.email || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isLoadingProfile && (firstName || lastName || email || username)) {
      contentFadeAnim.setValue(0);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingProfile, firstName, lastName, email, username, contentFadeAnim]);

  const updateProfile = async () => {
    setFirstNameError('');
    setLastNameError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      hasError = true;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      hasError = true;
    }

    const hasOldPassword = oldPassword.trim().length > 0;
    const hasNewPasswordFilled = newPassword.trim().length > 0;

    if (hasOldPassword || hasNewPasswordFilled) {
      if (oldPassword !== newPassword) {
        setNewPasswordError('Passwords do not match');
        setConfirmPasswordError('Passwords do not match');
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      const payload: {
        first_name: string;
        last_name: string;
        email: string;
        new_password?: string;
      } = {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
      };

      if (oldPassword.trim() && newPassword.trim()) {
        payload.new_password = newPassword;
      }

      await axios.post(`${API_URL}/user`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Profile updated successfully');

      setOldPassword('');
      setNewPassword('');
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      const token = await AsyncStorage.getItem('token');
      // await axios.delete(`${API_URL}/user`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      await axios.post(`${API_URL}/user/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await logout();
    } catch (error: unknown) {
      Alert.alert('Error', 'Failed to delete account, please contact support');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and sign you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => void performDeleteAccount(),
        },
      ]
    );
  };

  if (!loaded) {
    return null;
  }

  return (
    <ScreenComponent style={styles.screen}>
      <Animated.View style={[styles.animatedView, { opacity: contentFadeAnim }]}>
        <View style={styles.wrapper}>
          <View style={styles.main}>
            <View style={styles.form}>
              <Input
                cursorColor="#ffffff"
                placeholder="First name"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{ type: 'font-awesome', name: 'user', color: '#ffffffff', size: s(22) }}
                inputStyle={styles.inputStyle}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (firstNameError) setFirstNameError('');
                }}
                errorMessage={firstNameError}
                errorStyle={styles.errorStyle}
                disabled={isLoadingProfile || isLoading}
              />
              <Input
                cursorColor="#ffffff"
                placeholder="Last name"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{ type: 'font-awesome', name: 'user', color: '#ffffffff', size: s(22) }}
                inputStyle={styles.inputStyle}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (lastNameError) setLastNameError('');
                }}
                errorMessage={lastNameError}
                errorStyle={styles.errorStyle}
                disabled={isLoadingProfile || isLoading}
              />
              <Input
                cursorColor="#ffffff"
                placeholder="Username"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{ type: 'font-awesome', name: 'user', color: '#ffffffff', size: s(22) }}
                inputStyle={styles.inputStyle}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={username}
                onChangeText={(text) => setUsername(text)}
                disabled
              />
              <Input
                cursorColor="#ffffff"
                placeholder="user@email.com"
                selectionColor="white"
                placeholderTextColor="#d8d8d8ff"
                leftIcon={{
                  type: 'materialIcons',
                  name: 'alternate-email',
                  color: '#ffffffff',
                  size: s(22),
                }}
                inputStyle={styles.inputStyleEmail}
                labelStyle={styles.labelStyle}
                inputContainerStyle={styles.inputContainerStyle}
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
                disabled
              />
              <Text style={styles.passwordNotice}>
                *You will be signed out if the password is changed.
              </Text>
              <PasswordInputs
                newPassword={oldPassword}
                confirmPassword={newPassword}
                onNewPasswordChange={(text) => {
                  setOldPassword(text);
                  if (newPasswordError || confirmPasswordError) {
                    setNewPasswordError('');
                    setConfirmPasswordError('');
                  }
                }}
                onConfirmPasswordChange={(text) => {
                  setNewPassword(text);
                  if (newPasswordError || confirmPasswordError) {
                    setNewPasswordError('');
                    setConfirmPasswordError('');
                  }
                }}
                newPasswordError={newPasswordError}
                confirmPasswordError={confirmPasswordError}
                disabled={isLoadingProfile || isLoading}
              />
              <Button
                title="Update"
                buttonStyle={styles.updateButton}
                containerStyle={styles.updateButtonContainer}
                titleStyle={styles.updateButtonTitle}
                onPress={updateProfile}
                disabled={isLoading || isLoadingProfile}
                loading={isLoading}
              />
              <Button
                title="Subscription"
                buttonStyle={styles.subscriptionButton}
                containerStyle={styles.subscriptionButtonContainer}
                titleStyle={styles.subscriptionTitle}
                onPress={() => navigation.navigate('Subscription')}
                disabled={isLoading || isLoadingProfile}
              />
              <Button
                title="Delete account"
                buttonStyle={styles.deleteAccountButton}
                containerStyle={styles.deleteAccountButtonContainer}
                titleStyle={styles.deleteAccountTitle}
                onPress={confirmDeleteAccount}
                disabled={isLoading || isLoadingProfile || isDeletingAccount}
                loading={isDeletingAccount}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{APP_DISPLAY_NAME}</Text>
          </View>
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
    paddingTop: s(12),
    paddingBottom: s(18),
  } as ViewStyle,
  main: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    paddingHorizontal: s(18),
  } as ViewStyle,
  form: {
    width: '100%',
    paddingBottom: s(8),
  } as ViewStyle,
  inputStyle: {
    color: 'white',
    fontSize: s(18),
    paddingLeft: s(12),
  } as TextStyle,
  inputStyleEmail: {
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
  passwordNotice: {
    color: 'white',
    fontSize: s(16),
    fontWeight: '300',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingBottom: s(10),
    marginTop: s(4),
  } as TextStyle,
  subscriptionButton: {
    backgroundColor: 'transparent',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
    paddingVertical: s(12),
    minHeight: s(48),
    justifyContent: 'center',
  } as ViewStyle,
  subscriptionButtonContainer: {
    marginHorizontal: s(22),
    marginTop: s(10),
  } as ViewStyle,
  subscriptionTitle: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: s(16),
  } as TextStyle,
  updateButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
    paddingVertical: s(12),
    minHeight: s(48),
    justifyContent: 'center',
  } as ViewStyle,
  updateButtonContainer: {
    marginHorizontal: s(22),
    marginTop: s(10),
  } as ViewStyle,
  updateButtonTitle: {
    fontWeight: 'bold',
    color: '#ac8861ff',
    fontSize: s(16),
  } as TextStyle,
  deleteAccountButton: {
    backgroundColor: 'transparent',
    borderWidth: s(2),
    borderColor: '#e53935',
    borderRadius: s(30),
    paddingVertical: s(12),
    minHeight: s(48),
    justifyContent: 'center',
  } as ViewStyle,
  deleteAccountButtonContainer: {
    marginHorizontal: s(22),
    marginTop: s(10),
  } as ViewStyle,
  deleteAccountTitle: {
    fontWeight: 'bold',
    color: '#e53935',
    fontSize: s(16),
  } as TextStyle,
  footer: {
    paddingTop: s(10),
    alignItems: 'center',
    justifyContent: 'flex-end',
  } as ViewStyle,
  footerText: {
    color: 'white',
    fontSize: s(14),
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
});

export default UserProfileScreen;
