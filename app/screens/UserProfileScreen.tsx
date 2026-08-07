import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import { EyeIcon, EyeOffIcon, Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { API_URL } from '@/constants/Config';
import {
  changePasswordAndSignOut,
  fetchUserProfile,
  updateUserProfile,
} from '@/app/utils/userProfile';
import {
  timerContentStackClassName,
  timerOutlineButtonClassName,
  timerScrollContentClassName,
  timerSectionLabelClassName,
  timerSettingRowClassName,
} from '@/app/constants/screenLayout';
import { useAuth } from '../context/AuthContext';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type RootDrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Subscription: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

const inputClassName =
  'text-white text-lg font-semibold underline text-right min-w-[120px] flex-1 py-0';
const labelClassName = 'text-white text-xl font-semibold mr-2';
const valueClassName = 'text-white text-lg font-semibold underline text-right flex-1';

type ProfileFieldRowProps = {
  label: string;
  isFirst?: boolean;
  children: React.ReactNode;
};

const ProfileFieldRow: React.FC<ProfileFieldRowProps> = ({
  label,
  isFirst = false,
  children,
}) => (
  <View className={`${timerSettingRowClassName}${isFirst ? ' border-t-0' : ''}`}>
    <Text className={labelClassName}>{label}</Text>
    {children}
  </View>
);

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const profile = await fetchUserProfile(token);
      setEmail(profile.email || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchProfile();
    }, [fetchProfile])
  );

  const updateProfile = async () => {
    setNewPasswordError('');
    setConfirmPasswordError('');

    const hasOldPassword = oldPassword.trim().length > 0;
    const hasNewPasswordFilled = newPassword.trim().length > 0;

    if (!hasOldPassword && !hasNewPasswordFilled) {
      Alert.alert('Nothing to save', 'Enter a new password to update your account.');
      return;
    }

    if (oldPassword !== newPassword) {
      setNewPasswordError('Passwords do not match');
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      await changePasswordAndSignOut({
        token,
        password: newPassword,
        updateUserProfile,
        logout,
      });

      setOldPassword('');
      setNewPassword('');

      Alert.alert(
        'Password updated',
        'Your password was changed. Please sign in again.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const err = error as {
        response?: { data?: { message?: string; errors?: string[] } };
      };
      const errorMessage =
        err.response?.data?.errors?.join('\n') ||
        err.response?.data?.message ||
        'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      const token = await AsyncStorage.getItem('token');

      await axios.post(`${API_URL}/user/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await logout();
    } catch {
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

  const fieldsDisabled = isLoadingProfile || isLoading;

  return (
    <ScreenScrollLayout
      contentContainerClassName={timerScrollContentClassName}
      keyboardShouldPersistTaps="handled"
    >
      <VStack space="md" className={timerContentStackClassName}>
        {isLoadingProfile ? (
          <TimerSectionCard>
            <Text className="text-white/75 text-base">Loading...</Text>
          </TimerSectionCard>
        ) : (
          <>
            <TimerSectionCard>
  

              <ProfileFieldRow label="Email:" isFirst>
                <Text className={valueClassName}>{email || '—'}</Text>
              </ProfileFieldRow>

              <Text className={`${timerSectionLabelClassName} mt-6`}>Password</Text>
              <Text className="text-white/75 text-lg mb-2">
                You will be signed out if the password is changed.
              </Text>

              <ProfileFieldRow label="New:" isFirst>
                <TextInput
                  value={oldPassword}
                  onChangeText={(text) => {
                    setOldPassword(text);
                    if (newPasswordError || confirmPasswordError) {
                      setNewPasswordError('');
                      setConfirmPasswordError('');
                    }
                  }}
                  placeholder="New password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!fieldsDisabled}
                  accessibilityLabel="New password"
                  className={inputClassName}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  disabled={fieldsDisabled}
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
              </ProfileFieldRow>
              {newPasswordError ? (
                <Text className="text-error-400 text-sm mt-1">{newPasswordError}</Text>
              ) : null}

              <ProfileFieldRow label="Confirm:">
                <TextInput
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError || confirmPasswordError) {
                      setNewPasswordError('');
                      setConfirmPasswordError('');
                    }
                  }}
                  placeholder="Confirm password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!fieldsDisabled}
                  accessibilityLabel="Confirm password"
                  className={inputClassName}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={fieldsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  className="ml-2 p-1"
                >
                  <Icon
                    as={showConfirmPassword ? EyeIcon : EyeOffIcon}
                    className="text-white"
                    size="md"
                  />
                </Pressable>
              </ProfileFieldRow>
              {confirmPasswordError ? (
                <Text className="text-error-400 text-sm mt-1">{confirmPasswordError}</Text>
              ) : null}

              <TimerOutlineButton
                label="Save"
                iconName="save-sharp"
                onPress={() => void updateProfile()}
                disabled={fieldsDisabled}
                isLoading={isLoading}
                size="xl"
                variant="solid"
                className="mt-6"
              />

              <TimerOutlineButton
                label="Subscription"
                onPress={() => navigation.navigate('Subscription')}
                disabled={fieldsDisabled}
                size="xl"
                variant="solid"
                className="mt-3"
              />
            </TimerSectionCard>

            <TimerSectionCard>
              <Text className={timerSectionLabelClassName}>Delete account</Text>
              <Text className="text-white/75 text-lg mb-4">
                To delete your account, cancel any active subscription first.
                Deletion is permanent and cannot be undone.
              </Text>
              <Pressable
                className={`${timerOutlineButtonClassName} bg-[#e53935] border-[#e53935]${
                  fieldsDisabled || isDeletingAccount ? ' opacity-40' : ''
                }`}
                onPress={confirmDeleteAccount}
                disabled={fieldsDisabled || isDeletingAccount}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-lg font-semibold">
                    Delete account
                  </Text>
                )}
              </Pressable>
            </TimerSectionCard>
          </>
        )}
      </VStack>
    </ScreenScrollLayout>
  );
};

export default UserProfileScreen;
