import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  layout,
  mutedTextClassName,
  mutedTextStyle,
  stackGapStyle,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerScrollContentStyle,
  timerSessionResetLinkClassName,
  timerSessionResetLinkStyle,
} from '@/app/constants/screenLayout';
import { vh } from '@/constants/appViewport';
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
      contentContainerClassName={`${timerScrollContentClassName}`}
      contentContainerStyle={timerScrollContentStyle}
    >
      <VStack className={timerContentStackClassName} style={stackGapStyle}>
        <TimerSectionCard>
          <Text
            style={{
              fontSize: vh(34),
              fontWeight: '800',
              color: '#ffffff',
              lineHeight: vh(40),
            }}
          >
            Welcome to {APP_DISPLAY_NAME}
          </Text>
          <View style={{ marginVertical: layout.space32 }}>
            <Text
              className={mutedTextClassName}
              style={[
                mutedTextStyle,
                { fontSize: layout.fontXl, fontWeight: '600', marginBottom: layout.space16 },
              ]}
            >
              Track naps, feedings, and soothing sounds for your little one.
            </Text>
            <Text
              className={mutedTextClassName}
              style={[mutedTextStyle, { fontSize: layout.fontXl, fontWeight: '600' }]}
            >
              Create a {BASIC_PLAN_DISPLAY_NAME} account for free or try{' '}
              {PRO_PLAN_DISPLAY_NAME} with a{' '}
              <Text style={{ fontSize: layout.fontXl, fontWeight: '800', color: "#FFD700" }}>
                14-day free trial
              </Text>
              .
            </Text>
          </View>

          <TimerOutlineButton
            label="Log in"
            iconName="log-in-sharp"
            onPress={handleLogin}
            variant="solid"
            size="xl"
            style={{ marginTop: layout.space8 }}
            accessibilityLabel="Log in"
          />

          <TimerOutlineButton
            label="Sign up"
            iconName="person-add-sharp"
            onPress={handleSignUp}
            variant="solid"
            size="xl"
            style={{ marginTop: layout.space12 }}
            accessibilityLabel="Sign up"
          />

          <Pressable
            accessibilityRole="link"
            hitSlop={12}
            onPress={handleContinueGuest}
          >
            <Text className={timerSessionResetLinkClassName} style={timerSessionResetLinkStyle}>
              Continue as a guest
            </Text>
          </Pressable>
        </TimerSectionCard>
      </VStack>
    </ScreenScrollLayout>
  );
};

export default LandingScreen;
