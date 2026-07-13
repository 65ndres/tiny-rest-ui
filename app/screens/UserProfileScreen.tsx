import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { API_URL } from '@/constants/Config';
import { fetchUserProfile, updateUserProfile } from '@/app/utils/userProfile';
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const profile = await fetchUserProfile(token);
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setUsername(profile.username || '');
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

      await updateUserProfile(token, {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
      });

      if (oldPassword.trim() && newPassword.trim()) {
        await axios.post(
          `${API_URL}/user`,
          { new_password: newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

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
              <Text className={timerSectionLabelClassName}>Profile</Text>

              <ProfileFieldRow label="First name:" isFirst>
                <TextInput
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (firstNameError) setFirstNameError('');
                  }}
                  placeholder="Enter first name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!fieldsDisabled}
                  accessibilityLabel="First name"
                  className={inputClassName}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </ProfileFieldRow>
              {firstNameError ? (
                <Text className="text-error-400 text-sm mt-1">{firstNameError}</Text>
              ) : null}

              <ProfileFieldRow label="Last name:">
                <TextInput
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (lastNameError) setLastNameError('');
                  }}
                  placeholder="Enter last name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  editable={!fieldsDisabled}
                  accessibilityLabel="Last name"
                  className={inputClassName}
                  cursorColor="#ffffff"
                  selectionColor="white"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </ProfileFieldRow>
              {lastNameError ? (
                <Text className="text-error-400 text-sm mt-1">{lastNameError}</Text>
              ) : null}

              <ProfileFieldRow label="Username:">
                <Text className={valueClassName}>{username || '—'}</Text>
              </ProfileFieldRow>

              <ProfileFieldRow label="Email:">
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
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
