import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  mutedTextClassName,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerSessionResetLinkClassName,
} from '@/app/constants/screenLayout';
import {
  APP_DISPLAY_NAME,
  BASIC_PLAN_DISPLAY_NAME,
  PRO_PLAN_DISPLAY_NAME,
} from '@/constants/appBranding';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '../sharedComponents/timer/TimerSectionCard';

type AuthStackParamList = {
  LoginGluestack: undefined;
  SignUpGluestack: undefined;
  Timer: undefined;
};

type NavigationProp = DrawerNavigationProp<AuthStackParamList>;

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = () => {
    navigation.navigate('LoginGluestack');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpGluestack');
  };

  const handleContinueGuest = () => {
    navigation.navigate('Timer');
  };

  return (
    <ScreenScrollLayout
      contentContainerClassName={`${timerScrollContentClassName} justify-center`}
    >
      <VStack space="md" className={timerContentStackClassName}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 40,
            }}
          >
            Welcome to {APP_DISPLAY_NAME}
          </Text>
          <View style={{ marginVertical: 30 }}>
            <Text className={`${mutedTextClassName} text-xl mb-4`}>
              Track naps, feedings, and soothing sounds for your little one.
            </Text>
            <Text className={`${mutedTextClassName} text-xl`}>
              Create a {BASIC_PLAN_DISPLAY_NAME} account for free or try{' '}
              {PRO_PLAN_DISPLAY_NAME} with a 14-day free trial.
            </Text>
          </View>

          <TimerOutlineButton
            label="Log in"
            iconName="log-in-sharp"
            onPress={handleLogin}
            variant="solid"
            size="xl"
            className="mt-2"
            accessibilityLabel="Log in"
          />

          <TimerOutlineButton
            label="Sign up"
            iconName="person-add-sharp"
            onPress={handleSignUp}
            variant="outline"
            size="xl"
            className="mt-3"
            accessibilityLabel="Sign up"
          />

          <Pressable
            accessibilityRole="link"
            hitSlop={12}
            onPress={handleContinueGuest}
          >
            <Text className={timerSessionResetLinkClassName}>
              Continue as a guest
            </Text>
          </Pressable>
        </TimerSectionCard>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default LandingScreen;
