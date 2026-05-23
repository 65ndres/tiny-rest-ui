import { API_URL } from '@/constants/Config';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/legalUrls';
import { APP_DISPLAY_NAME, BASIC_PLAN_DISPLAY_NAME } from '@/constants/appBranding';
import { proPlanDisplayName, subscriptionPlanPerks } from '@/constants/subscriptionPlanPerks';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@rneui/themed';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { ENTITLEMENT_IDENTIFIER, useRevenueCat } from '../context/RevenueCatContext';
import ScreenComponent from '../sharedComponents/ScreenComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

/** Matches phone-proportioned content width on iPad (same pattern as LandingScreen). */
const contentMaxWidth = Math.min(s(340), screenWidth);

type RootDrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Subscription: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const {
    customerInfo,
    offerings,
    isLoading: revenueCatLoading,
    isPro,
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    presentCustomerCenter,
    getPackages,
  } = useRevenueCat();
  const { refreshUser } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [serverSubscriptionType, setServerSubscriptionType] = useState<string | null>(null);
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const revenueCatLoadingRef = useRef(revenueCatLoading);
  revenueCatLoadingRef.current = revenueCatLoading;
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get<{
        subscription_type?: string;
        user?: { subscription_type?: string };
      }>(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = response.data;
      const type = d.subscription_type ?? d.user?.subscription_type ?? null;
      setServerSubscriptionType(type ?? null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  // Focus: refresh data, reset opacity; fade in when Revenue Cat is ready (including return visits).
  useEffect(() => {
    const fadeInContent = () => {
      contentFadeAnim.setValue(0);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    };

    const unsubscribe = navigation.addListener('focus', () => {
      contentFadeAnim.setValue(0);
      void refreshCustomerInfo();
      void fetchProfile();
      if (!revenueCatLoadingRef.current) {
        fadeInContent();
      }
    });

    if (!revenueCatLoading) {
      fadeInContent();
    }

    return unsubscribe;
  }, [
    navigation,
    revenueCatLoading,
    contentFadeAnim,
    refreshCustomerInfo,
    fetchProfile,
  ]);

  // Handle upgrade using RevenueCat Paywall
  const handleUpgrade = async () => {
    try {
      setIsSubscribing(true);
      await presentPaywall();
      console.log('response handleUpgrade() PACA');
      
    } catch (error) {
      console.error('Error presenting paywall:', error);
    } finally {
      await refreshUser();
      setIsSubscribing(false);
    }
  };

  // Handle direct package purchase (alternative to paywall)
  const handlePurchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsSubscribing(true);
      const success = await purchasePackage(packageToPurchase);
      if (success) {
        await refreshCustomerInfo();
        // navigation.navigate('Home'); I need to make the call the the api to ensure I save the succesfull purchase
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const success = await restorePurchases();
      if (success) {
        await refreshCustomerInfo();
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle manage subscription (Customer Center)
  const handleManageSubscription = async () => {
    try {
      await presentCustomerCenter();
      // Refresh customer info after customer center interaction
      await refreshCustomerInfo();
    } catch (error) {
      console.error('Error opening customer center:', error);
    }
  };

  // Handle Basic subscription — call your server here
  const handleBasicSubscribe = async () => {
    // TODO: Add your server call for Basic subscription
  };

  // Format price from RevenueCat package
  const formatPrice = (packageToFormat: PurchasesPackage | null) => {
    if (!packageToFormat) return 'Loading...';
    return packageToFormat.product.priceString;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get expiration date from customer info
  const getExpirationDate = (): string | null => {
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER];
    if (!entitlement) return null;
    return entitlement.expirationDate || null;
  };

  // Get active subscription period
  const getSubscriptionPeriod = (): string | null => {
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER];
    if (!entitlement) return null;
    
    // Get the latest transaction
    const latestTransaction = entitlement.latestPurchaseDate;
    if (!latestTransaction) return null;
    
    // Get period type from product identifier
    const productIdentifier = entitlement.productIdentifier;
    if (productIdentifier?.includes('monthly')) {
      return 'Monthly';
    } else if (productIdentifier?.includes('annual') || productIdentifier?.includes('yearly')) {
      return 'Annual';
    }
    return 'Subscription';
  };

  // Get monthly package from offerings
  const getMonthlyPackage = (): PurchasesPackage | null => {
    const packages = getPackages();
    if (!packages) return null;
    
    // Look for monthly package
    const monthlyPackage = packages.find(
      pkg => pkg.identifier === 'monthly' || 
             pkg.packageType === 'MONTHLY' ||
             pkg.product.identifier?.toLowerCase().includes('monthly')
    );
    
    return monthlyPackage || (packages.length > 0 ? packages[0] : null);
  };

  const monthlyPackage = getMonthlyPackage();
  const expirationDate = getExpirationDate();
  const subscriptionPeriod = getSubscriptionPeriod();
  const isBasicServerTier = serverSubscriptionType === 'basic';
  const isProTier =
    isPro || serverSubscriptionType?.toLowerCase() === 'pro';
  const showProFeatureList = isBasicServerTier || !isPro;

  if (revenueCatLoading) {
    return (
      <ScreenComponent style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent style={styles.screen}>
      <View style={styles.topSpacer} />

      <Animated.View style={[styles.scrollWrap, { opacity: contentFadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentColumn}>
            <View style={styles.plansContainer}>
            {/* Basic Plan Card — hidden when user is on Pro (RevenueCat or server) */}
            {!isProTier && (
              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{BASIC_PLAN_DISPLAY_NAME}</Text>
                  {isBasicServerTier ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Current</Text>
                    </View>
                  ) : (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Subscription</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>Free</Text>
                </View>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>
                    {subscriptionPlanPerks.basic.sectionTitle}
                  </Text>
                  {subscriptionPlanPerks.basic.lines.map((line) => (
                    <Text key={line} style={styles.featureItem}>
                      • {line}
                    </Text>
                  ))}
                </View>

                <View style={styles.actionButtonContainer}>
                  {isBasicServerTier ? (
                    <Button
                      title="Selected"
                      disabled
                      buttonStyle={styles.selectedPlanButton}
                      containerStyle={styles.planButtonContainer}
                      titleStyle={styles.selectedPlanButtonTitle}
                    />
                  ) : (
                    <Button
                      title="Subscribe to Basic"
                      buttonStyle={styles.primaryPlanButton}
                      containerStyle={styles.planButtonContainer}
                      titleStyle={styles.primaryPlanButtonTitle}
                      onPress={handleBasicSubscribe}
                    />
                  )}
                </View>
              </View>
            )}

            {/* TinyRest Pro Plan Card */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{proPlanDisplayName}</Text>
                {isProTier && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
                {!isProTier && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.planPriceContainer}>
                <Text style={styles.planPrice}>
                  {monthlyPackage ? formatPrice(monthlyPackage) : 'Loading...'}
                </Text>
                {monthlyPackage && (
                  <Text style={styles.planInterval}>/month</Text>
                )}
              </View>

              {/* Subscription Details */}
              {isProTier && customerInfo && (
                <View style={styles.subscriptionDetails}>
                  {subscriptionPeriod && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Plan:</Text>
                      <Text style={styles.detailValue}>{subscriptionPeriod}</Text>
                    </View>
                  )}
                  {expirationDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Renews:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(expirationDate)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Features List */}
              {showProFeatureList && (
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>
                    {subscriptionPlanPerks.pro.sectionTitle}
                  </Text>
                  {subscriptionPlanPerks.pro.lines.map((line) => (
                    <Text key={line} style={styles.featureItem}>
                      • {line}
                    </Text>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtonContainer}>
                {!isProTier ? (
                  <Button
                    title={isBasicServerTier ? 'Upgrade to pro' : 'Subscribe to Pro'}
                    buttonStyle={styles.primaryPlanButton}
                    containerStyle={styles.planButtonContainer}
                    titleStyle={styles.primaryPlanButtonTitle}
                    onPress={handleUpgrade}
                    disabled={isSubscribing || !monthlyPackage}
                    loading={isSubscribing}
                  />
                ) : (
                  <Button
                    title="Manage Subscription"
                    buttonStyle={styles.managePlanButton}
                    containerStyle={styles.planButtonContainer}
                    titleStyle={styles.managePlanButtonTitle}
                    onPress={handleManageSubscription}
                  />
                )}
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
              </Text>
              <Text style={styles.infoText}>
                Manage your subscription and billing in your account settings or through the App Store.
              </Text>
              <Text style={styles.infoText}>
                <Text
                  onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
                  style={styles.legalLink}
                >
                  Privacy Policy
                </Text>
                <Text style={styles.infoText}>{' · '}</Text>
                <Text
                  onPress={() => void Linking.openURL(TERMS_OF_USE_URL)}
                  style={styles.legalLink}
                >
                  Terms of Use
                </Text>
              </Text>
            </View>
          </View>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{APP_DISPLAY_NAME}</Text>
      </View>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  } as ViewStyle,
  topSpacer: {
    paddingTop: s(45),
  } as ViewStyle,
  scrollWrap: {
    flex: 1,
    minHeight: 0,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: 'white',
    fontSize: s(18),
    fontWeight: '300',
    marginTop: s(10),
  } as TextStyle,
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: s(18),
    paddingHorizontal: s(0),
  } as ViewStyle,
  contentColumn: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
  } as ViewStyle,
  plansContainer: {
    gap: s(20),
  } as ViewStyle,
  footer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: s(18),
    paddingTop: s(8),
  } as ViewStyle,
  footerLabel: {
    color: 'white',
    fontSize: s(15),
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  primaryPlanButton: {
    backgroundColor: 'white',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
  } as ViewStyle,
  managePlanButton: {
    backgroundColor: 'transparent',
    borderWidth: s(2),
    borderColor: 'white',
    borderRadius: s(30),
  } as ViewStyle,
  planButtonContainer: {
    marginHorizontal: s(14),
    marginVertical: s(8),
  } as ViewStyle,
  primaryPlanButtonTitle: {
    fontWeight: 'bold',
    color: '#ac8861ff',
    fontSize: s(16),
  } as TextStyle,
  managePlanButtonTitle: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: s(16),
  } as TextStyle,
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: s(15),
    padding: s(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s(15),
  } as ViewStyle,
  planName: {
    color: 'white',
    fontSize: s(24),
    fontWeight: '600',
  } as TextStyle,
  activeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: s(12),
    paddingVertical: s(4),
    borderRadius: s(12),
  } as ViewStyle,
  activeBadgeText: {
    color: 'white',
    fontSize: s(12),
    fontWeight: '600',
    textTransform: 'uppercase',
  } as TextStyle,
  inactiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: s(12),
    paddingVertical: s(4),
    borderRadius: s(12),
  } as ViewStyle,
  inactiveBadgeText: {
    color: 'white',
    fontSize: s(12),
    fontWeight: '600',
    textTransform: 'uppercase',
  } as TextStyle,
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: s(10),
  } as ViewStyle,
  planPrice: {
    color: 'white',
    fontSize: s(32),
    fontWeight: '700',
  } as TextStyle,
  planInterval: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: s(18),
    fontWeight: '400',
    marginLeft: s(4),
  } as TextStyle,
  subscriptionDetails: {
    marginTop: s(15),
    marginBottom: s(10),
    paddingTop: s(15),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: s(8),
  } as ViewStyle,
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: s(14),
    fontWeight: '300',
  } as TextStyle,
  detailValue: {
    color: 'white',
    fontSize: s(14),
    fontWeight: '500',
  } as TextStyle,
  featuresContainer: {
    marginTop: s(15),
    marginBottom: s(10),
    paddingTop: s(15),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  featuresTitle: {
    color: 'white',
    fontSize: s(16),
    fontWeight: '600',
    marginBottom: s(10),
  } as TextStyle,
  featureItem: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: s(14),
    fontWeight: '300',
    marginVertical: s(4),
  } as TextStyle,
  actionButtonContainer: {
    marginTop: s(10),
  } as ViewStyle,
  selectedPlanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: s(2),
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: s(30),
  } as ViewStyle,
  selectedPlanButtonTitle: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: s(16),
  } as TextStyle,
  infoContainer: {
    marginTop: s(10),
    padding: s(15),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: s(10),
  } as ViewStyle,
  infoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: s(12),
    fontWeight: '300',
    lineHeight: s(18),
    marginVertical: s(4),
    textAlign: 'center',
  } as TextStyle,
  legalLink: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: s(12),
    fontWeight: '500',
    textDecorationLine: 'underline',
  } as TextStyle,
});

export default SubscriptionScreen;
