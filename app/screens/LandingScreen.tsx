import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassCardCenteredClassName,
  glassCardClassName,
  homeContentStackClassName,
  homeScrollContentClassName,
  mutedTextClassName,
  timerSessionResetLinkClassName,
} from '@/app/constants/screenLayout';
import {
  APP_DISPLAY_NAME,
  BASIC_PLAN_DISPLAY_NAME,
  PRO_PLAN_DISPLAY_NAME,
} from '@/constants/appBranding';
import ScreenScrollLayout from '../sharedComponents/ScreenScrollLayout';
import TimerOutlineButton from '../sharedComponents/timer/TimerOutlineButton';

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
    <ScreenScrollLayout contentContainerClassName={homeScrollContentClassName}>
      <VStack space="md" className={homeContentStackClassName}>
        <VStack className={glassCardCenteredClassName} space="sm">
          <Heading size="2xl" className="text-white text-center">
            Welcome to {APP_DISPLAY_NAME}
          </Heading>
          <Text className={`${mutedTextClassName} text-center`}>
            Track naps, feedings, and soothing sounds for your little one.
          </Text>
        </VStack>

        <VStack className={glassCardClassName}>
          <Text className={`${mutedTextClassName} text-center`}>
            Create a {BASIC_PLAN_DISPLAY_NAME} account for free or try{' '}
            {PRO_PLAN_DISPLAY_NAME} with a 14-day free trial.
          </Text>
        </VStack>

        <TimerOutlineButton
          label="Log in"
          iconName="log-in-sharp"
          onPress={handleLogin}
          variant="primary"
          size="lg"
          accessibilityLabel="Log in"
        />

        <TimerOutlineButton
          label="Sign up"
          iconName="person-add-sharp"
          onPress={handleSignUp}
          variant="outline"
          size="lg"
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
      </VStack>
    </ScreenScrollLayout>
  );
};

export default LandingScreen;
