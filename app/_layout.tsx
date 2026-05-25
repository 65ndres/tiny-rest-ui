// app/_layout.tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, ImageBackground, ImageStyle, StatusBar, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RevenueCatProvider, useRevenueCat } from "./context/RevenueCatContext";
import Home from './Home';
import SavedScreen from './Saved';
import ConversationScreen from './screens/ConversationScreen';
import ConversationsScreen from './screens/ConversationsScreen';
import FeaturedScreen from './screens/FeaturedScreen';
import FeaturedScreenGuest from './screens/FeaturedScreenGuest';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import LoginScreenGluestack from './screens/LoginScreenGluestack';
import NewConversationScreen from './screens/NewConversationScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignUpScreenGluestack from './screens/SignUpScreenGluestack';
import SubscriptionScreen from './screens/SubscriptionScreen';
import SupportScreen from './screens/SupportScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import BrowseScreen from './screens/BrowseScreen';
import TimerScreen from './screens/TimerScreen';
import BackButton from './SampleModule/BackButton';
import { APP_DISPLAY_NAME } from '@/constants/appBranding';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

// Set the animation options. This is optional.

const { width, height } = Dimensions.get('window');

type RootDrawerParamList = {
  Home: undefined;
  Search: undefined;
  Saved: undefined;
  FeaturedScreen: undefined;
  BrowseScreen: undefined;
  Profile: undefined;
  Subscription: undefined;
  Conversations: undefined;
  NewConversation: {
    item_id?: number;
  };
  Conversation: {
    other_user_id?: number;
    conversation_id?: number;
    item_id?: number;
  };
  Support: {
    conversation_id?: number;
    item_id?: number;
  };
  Timer: undefined;
};

type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  LoginGluestack: undefined;
  SignUp: undefined;
  SignUpGluestack: undefined;
  PasswordReset: undefined;
  PasswordCode: {
    email: string;
  };
  FeaturedScreenGuest: undefined;
  Timer: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const AuthDrawer = createDrawerNavigator<AuthStackParamList>();
const OnboardingStack = createStackNavigator<{
  Onboarding: undefined;
  FeaturedScreen: undefined;
}>();

const DrawerToggleButton: React.FC<{ size?: number }> = ({ size }) => {
  const navigation = useNavigation();
  const iconSize = size || height * 0.035; // scales with screen height
  
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={styles.drawerToggleButton}
    >
      <Ionicons name="menu-sharp" size={iconSize} color="white" />
    </TouchableOpacity>
  );
};

const CustomDrawerContent: React.FC<any> = (props) => {
  const { logout, user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isProUser = user?.subscription_type === 'pro';
  const alwaysAllowedRoutes = new Set(['Home', 'FeaturedScreen', 'Profile', 'Timer']);
  const hiddenRoutes = new Set(['NewConversation', 'Conversation', 'Subscription']);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Close while the authenticated drawer navigator is still mounted; after logout()
      // the tree swaps to UnauthenticatedNavigator and a late closeDrawer can leave the
      // new drawer appearing open.
      props.navigation.closeDrawer();
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.drawerOuter}>
      <DrawerContentScrollView
        {...props}
        style={styles.drawerScrollView}
        contentContainerStyle={styles.drawerScrollContent}
      >
        {props.state.routes
          .filter((route: { name: string }) => !hiddenRoutes.has(route.name))
          .map((route: { key: string; name: string }, index: number) => {
            const descriptor = props.descriptors[route.key];
            const options = descriptor?.options ?? {};
            const isAllowed = isProUser || alwaysAllowedRoutes.has(route.name);
            const drawerLabel = options.drawerLabel;
            const labelText =
              typeof drawerLabel === 'string'
                ? drawerLabel
                : options.title || route.name;

            return (
              <DrawerItem
                key={route.key}
                label={() => (
                  <View style={styles.drawerItemRow}>
                    <Text style={[styles.drawerLabel, !isAllowed && styles.disabledDrawerLabel]}>
                      {labelText}
                    </Text>
                    {!isAllowed && (
                      <View style={styles.proLabel}>
                        <Text style={styles.proLabelText}>Pro</Text>
                      </View>
                    )}
                  </View>
                )}
                onPress={() => {
                  if (isAllowed) {
                    props.navigation.navigate(route.name);
                  } else {
                    void presentPaywall();
                  }
                }}
              />
            );
          })}
        <DrawerItem
          label={isLoggingOut ? "Logging out..." : "Logout"}
          onPress={handleLogout}
          labelStyle={styles.logoutLabel}
          icon={isLoggingOut ? () => <ActivityIndicator size="small" color="white" /> : undefined}
        />
      </DrawerContentScrollView>
    </View>
  );
};

const UnauthenticatedDrawerContent: React.FC<any> = (props) => (
  <View style={styles.drawerOuter}>
    <View style={styles.drawerMain}>
      <DrawerItemList {...props} />
    </View>
  </View>
);

const AuthenticatedNavigator: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Drawer.Navigator
      initialRouteName="Home"

      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right',
        drawerActiveBackgroundColor:'transparent',
        sceneStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        drawerStyle: {
          backgroundColor: 'transparent', 
          width: width * 0.75, // scales with screen width (~75% of screen width)
        },
        drawerLabelStyle: {
          color: 'white', 
          lineHeight: height * 0.04, // scales with screen height
          fontSize: height * 0.031, // scales with screen height
          fontWeight: '300',
          textAlign: 'center'
          
        },
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          color: 'white',
          fontSize: height * 0.031, // scales with screen height
        },
        headerRight: () => <DrawerToggleButton size={height * 0.043} />,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{ 
          headerLeft: () => <Image source={require('../assets/images/splash-icon.png')} style={styles.logoImage} />,
          drawerLabel: 'HOME', headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>HOME</Text> }}
      />
      <Drawer.Screen
        name="FeaturedScreen"
        component={FeaturedScreen}
        options={{
          drawerLabel: 'FEATURED',
          headerLeft: () => <BackButton text="" /> ,
          headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>FEATURED</Text>,
        }}
      />
      <Drawer.Screen
        name="BrowseScreen"
        component={BrowseScreen}
        options={{headerLeft: () => <BackButton text="" /> ,drawerLabel: 'BROWSE', headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>BROWSE</Text>}}
      />
      <Drawer.Screen
        name="Timer"
        component={TimerScreen}
        options={{
          drawerLabel: 'TIMER',
          headerLeft: () => <BackButton text="" />,
          headerTitle: () => (
            <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>
              TIMER
            </Text>
          ),
        }}
      />
      <Drawer.Screen
        name="Saved"
        component={SavedScreen}
        options={{ drawerLabel: 'SAVED', headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>SAVED</Text> }}
      />
      <Drawer.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          drawerLabel: 'CONVERSATIONS', headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>CONVERSATIONS</Text>,
          headerLeft: () => <BackButton text="" />,
        }}
      />
      <Drawer.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ 
          drawerLabel: () => null, // Hide from drawer
          drawerItemStyle: { display: 'none' }, 
          headerLeft: () => <BackButton text="" />,
          headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>NEW CONVERSATION</Text>,
        }}
      />
      <Drawer.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{ 
          drawerLabel: () => null, // Hide from drawer
          drawerItemStyle: { display: 'none' }, 
          headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>CONVERSATION</Text>,
        }}
      />
      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{ 
          drawerLabel: 'SUPPORT',
          headerLeft: () => <BackButton text="" />,
          headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>SUPPORT</Text>,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{ drawerLabel: 'PROFILE',
          headerLeft: () => <BackButton text="" /> ,
          headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>PROFILE</Text>,
         }}
      />
      <Drawer.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ 
          drawerLabel: () => null, // Hide from drawer
          drawerItemStyle: { display: 'none' },
          headerLeft: () => <BackButton text="" />,
          headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>SUBSCRIPTION</Text>,
        }}
      />
    </Drawer.Navigator>
    </>
  );
};



const UnauthenticatedNavigator: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AuthDrawer.Navigator
        initialRouteName="Landing"
        drawerContent={(props) => <UnauthenticatedDrawerContent {...props} />}
        screenOptions={{
          drawerPosition: 'right',
          drawerActiveBackgroundColor: 'transparent',
          sceneStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          drawerStyle: {
            backgroundColor: 'transparent',
            width: width * 0.75,
          },
          drawerLabelStyle: {
            color: 'white',
            lineHeight: height * 0.04,
            fontSize: height * 0.031,
            fontWeight: '300',
            textAlign: 'center',
          },
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            color: 'white',
            fontSize: height * 0.031,
          },
          headerRight: () => <DrawerToggleButton size={height * 0.043} />,
        }}
      >
        <AuthDrawer.Screen
          name="Landing"
          component={LandingScreen}
          options={{
            drawerLabel: 'HOME',
            headerLeft: () => null,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
        <AuthDrawer.Screen
          name="Timer"
          component={TimerScreen}
          options={{
            drawerLabel: 'TIMER',
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => (
              <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>
                TIMER
              </Text>
            ),
          }}
        />
        <AuthDrawer.Screen
          name="Login"
          component={LoginScreen}
          options={{
            drawerLabel: 'LOG IN',
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
        <AuthDrawer.Screen
          name="LoginGluestack"
          component={LoginScreenGluestack}
          options={{
            drawerLabel: 'LOG IN (GLUESTACK)',
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
        <AuthDrawer.Screen
          name="FeaturedScreenGuest"
          component={FeaturedScreenGuest}
          options={({ navigation }) => ({
            drawerLabel: 'FEATURED',
            headerLeft: () => <BackButton text=" " onPress={() => navigation.navigate('Landing')} />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>FEATURED</Text>,
          })}
        />
        <AuthDrawer.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            drawerLabel: 'SIGN UP',
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
        <AuthDrawer.Screen
          name="SignUpGluestack"
          component={SignUpScreenGluestack}
          options={{
            drawerLabel: 'SIGN UP (GLUESTACK)',
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
        <AuthDrawer.Screen
          name="PasswordReset"
          component={PasswordResetScreen}
          options={{
            drawerLabel: 'RESET PASSWORD',
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
        <AuthDrawer.Screen
          name="PasswordCode"
          component={PasswordCodeScreen}
          options={{
            drawerLabel: () => null,
            drawerItemStyle: { display: 'none' },
            headerLeft: () => <BackButton text=" " />,
            headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>,
          }}
        />
      </AuthDrawer.Navigator>
    </SafeAreaProvider>
  );
};

const OnboardingRootLayout: React.FC = () => {
  const { logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <OnboardingStack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerTransparent: true,
            headerTitleStyle: { color: 'white', fontSize: height * 0.025, fontWeight: '400' },
            cardStyle: { backgroundColor: 'transparent', flex: 1 },
            headerTintColor: 'white',
          }}
        >
          <OnboardingStack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => void logout()}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text style={{ color: 'white', fontSize: height * 0.02, fontWeight: '500' }}>
                    Log out
                  </Text>
                </TouchableOpacity>
              ),
              headerTitle: () => (
                <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>{APP_DISPLAY_NAME}</Text>
              ),
            }}
          />
          <OnboardingStack.Screen
            name="FeaturedScreen"
            component={FeaturedScreen}
            options={{
              headerLeft: () => <BackButton text="" />,
              headerTitle: () => <Text style={{ color: 'white', fontSize: height * 0.025, fontWeight: '400' }}>FEATURED</Text>,
            }}
          />
        </OnboardingStack.Navigator>
      </Animated.View>
    </SafeAreaProvider>
  );
};

const RootLayout: React.FC = () => {
  const { user, loading, refreshUser } = useAuth();
  const didSessionRefreshRef = useRef(false);

  useEffect(() => {
    if (!user) {
      didSessionRefreshRef.current = false;
      return;
    }
    if (!loading && user.token && !didSessionRefreshRef.current) {
      didSessionRefreshRef.current = true;
      void refreshUser();
    }
  }, [loading, user, refreshUser]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <UnauthenticatedNavigator />;
  }

  // Show onboarding when authenticated but onboarding not completed (sign up always; login when JWT has onboarding_completed false)
  // const onboardingCompleted =  AsyncStorage.getItem('onboarding_completed');
  console.log('user.subscription_type', user.subscription_type);
  if (user.onboarding_completed !== true) {
    return <OnboardingRootLayout />;
  }

  return <AuthenticatedNavigator />;
};

const styles = StyleSheet.create({
  text: {
    color: 'white',
    fontSize: height * 0.025, 
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: height * 0.04, 
  },
  drawerBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    // backgroundColor: '#6E9AB1',
  } as ViewStyle,
  drawerOuter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
  } as ViewStyle,
  drawerMain: {
    flex: 1,
    paddingTop: height * 0.185,
  } as ViewStyle,
  drawerScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
  drawerScrollContent: {
    flexGrow: 1,
    paddingTop: height * 0.185,
  } as ViewStyle,
  drawerFooter: {
    paddingBottom: height * 0.04,
  } as ViewStyle,
  drawerLabel: {
    color: 'white',
    lineHeight: height * 0.04,
    fontSize: height * 0.031,
    fontWeight: '300',
    textAlign: 'center',
  },
  disabledDrawerLabel: {
    opacity: 0.45,
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  logoutLabel: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 300,
    fontSize: height * 0.032,
    lineHeight: height * 0.04,
  },
  footerLabel: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    fontSize: height * 0.018,
    lineHeight: height * 0.02,
    textDecorationLine: 'underline',
    // marginTop: height * 0.005,
  },
  logoImage: {
    width: width * 0.08, 
    height: width * 0.08, 
    marginLeft: width * 0.053, 
  } as ImageStyle,
  drawerToggleButton: {
    marginRight: width * 0.053, 
  } as ViewStyle,
  appBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as ViewStyle,
});

const BG_JPG = require('../assets/images/bg.jpg');
const BGRD_JPG = require('../assets/images/bgrd.jpg');

function prefetchBackgroundAssets() {
  const bg = Image.resolveAssetSource(BG_JPG);
  const bgrd = Image.resolveAssetSource(BGRD_JPG);
  if (bg?.uri) void Image.prefetch(bg.uri);
  if (bgrd?.uri) void Image.prefetch(bgrd.uri);
}

export default function Layout() {
  useEffect(() => {
    // prefetchBackgroundAssets();
  }, []);

  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <RevenueCatProvider>
          <ImageBackground
            source={BG_JPG}
            resizeMode="cover"
            style={{ flex: 1, backgroundColor: '#6E9AB1' } as ViewStyle}
          >
            <RootLayout />
          </ImageBackground>
        </RevenueCatProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}