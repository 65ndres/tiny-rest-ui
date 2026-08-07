import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { API_URL } from '../../../constants/Config';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../../constants/legalUrls';
import { proPlanDisplayName, subscriptionPlanPerks } from '../../../constants/subscriptionPlanPerks';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import { useAuth } from '../../context/AuthContext';
import { useRevenueCat } from '../../context/RevenueCatContext';
import OnboardingSlideShell from './OnboardingSlideShell';
import { onboardingWidth, vh } from './onboardingLayout';

const planCardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: vh(15),
  padding: vh(20),
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  width: onboardingWidth * 0.8,
} as ViewStyle;

const SubscriptionChoiceSlide: React.FC = () => {
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const {
    getPackages,
    presentPaywall,
    isLoading: revenueCatLoading,
  } = useRevenueCat();
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<'basic' | 'pro' | null>(null);
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: () => null });
  }, [navigation]);

  const monthlyPackage = React.useMemo(() => {
    const packages = getPackages();
    if (!packages) return null;
    const monthly = packages.find(
      (pkg) =>
        pkg.identifier === 'monthly' ||
        pkg.packageType === 'MONTHLY' ||
        pkg.product.identifier?.toLowerCase().includes('monthly'),
    );
    return monthly ?? (packages.length > 0 ? packages[0] : null);
  }, [getPackages]);

  const handleBasic = async () => {
    try {
      setIsSubscribing(true);
      await axios.post(`${API_URL}/subscription/create_basic_subscription`);

      await refreshUser();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'Could not create basic subscription. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePro = async () => {
    try {
      setIsSubscribing(true);
      await presentPaywall();
      await refreshUser();
    } catch (error) {
      console.error('Paywall error:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSelectPlan = (plan: 'basic' | 'pro') => {
    setSelectedPlan(plan);
  };

  if (revenueCatLoading) {
    return (
      <OnboardingSlideShell>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </OnboardingSlideShell>
    );
  }

  return (
    <OnboardingSlideShell>
      <View style={styles.subscriptionSlideRoot}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.subscriptionSlideContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subscriptionTitle}>Select your plan</Text>

          <Pressable
            onPress={() => handleSelectPlan('basic')}
            style={[
              styles.planCard,
              planCardStyle,
              selectedPlan === 'basic' && styles.planCardSelected,
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Basic</Text>
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
          </Pressable>

          <Pressable
            onPress={() => handleSelectPlan('pro')}
            style={[
              styles.planCard,
              planCardStyle,
              selectedPlan === 'pro' && styles.planCardSelected,
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{proPlanDisplayName}</Text>
            </View>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planPrice}>
                {monthlyPackage ? monthlyPackage.product.priceString : '...'}
              </Text>
              <Text style={styles.planInterval}>/month</Text>
            </View>
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
          </Pressable>

          <View style={styles.ctaBlock}>
            <Text style={styles.legalFinePrint}>
              <Text
                onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
                style={styles.legalLink}
              >
                Privacy Policy
              </Text>
              <Text style={styles.legalFinePrint}> · </Text>
              <Text
                onPress={() => void Linking.openURL(TERMS_OF_USE_URL)}
                style={styles.legalLink}
              >
                Terms of Use
              </Text>
            </Text>
            <TimerOutlineButton
              label={
                selectedPlan === null
                  ? 'Continue'
                  : selectedPlan === 'basic'
                    ? 'Continue with Basic'
                    : `Continue with ${proPlanDisplayName}`
              }
              onPress={() => {
                if (selectedPlan === 'basic') void handleBasic();
                else if (selectedPlan === 'pro') void handlePro();
              }}
              disabled={
                selectedPlan === null ||
                (selectedPlan === 'basic' && isSubscribing) ||
                (selectedPlan === 'pro' && (isSubscribing || !monthlyPackage))
              }
              isLoading={
                (selectedPlan === 'basic' || selectedPlan === 'pro') && isSubscribing
              }
              variant="solid"
              size="xl"
              className="mt-2"
              accessibilityLabel="Continue"
            />
          </View>
        </ScrollView>
      </View>
    </OnboardingSlideShell>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: '#FFFFFF',
    fontSize: vh(16),
    fontWeight: '600',
  } as TextStyle,
  subscriptionSlideRoot: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
  } as ViewStyle,
  ctaBlock: {
    width: onboardingWidth * 0.8,
    paddingTop: vh(4),
  } as ViewStyle,
  legalFinePrint: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: vh(11),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: vh(10),
    lineHeight: vh(15),
  } as TextStyle,
  legalLink: {
    color: 'rgba(255, 255, 255, 0.95)',
    textDecorationLine: 'underline',
    fontSize: vh(11),
    fontWeight: '600',
  } as TextStyle,
  scroll: {
    flex: 1,
  },
  subscriptionTitle: {
    color: '#FFFFFF',
    fontSize: vh(24),
    fontWeight: '700',
    textAlign: 'center',
    width: onboardingWidth * 0.8,
  } as TextStyle,
  subscriptionSlideContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: vh(20),
    paddingVertical: vh(20),
  } as ViewStyle,
  planCard: {
    alignSelf: 'center',
  } as ViewStyle,
  planCardSelected: {
    borderWidth: vh(2),
    borderColor: '#FFFFFF',
  } as ViewStyle,
  planHeader: {} as ViewStyle,
  planName: {
    color: '#FFFFFF',
    fontSize: vh(24),
    fontWeight: '700',
  } as TextStyle,
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  } as ViewStyle,
  planPrice: {
    color: '#FFFFFF',
    fontSize: vh(32),
    fontWeight: '700',
  } as TextStyle,
  planInterval: {
    color: '#FFFFFF',
    fontSize: vh(18),
    marginLeft: vh(6),
    fontWeight: '500',
    opacity: 1,
  } as TextStyle,
  featuresContainer: {
    // alignSelf: 'stretch',
    marginTop: vh(15),
    marginBottom: vh(10),
    paddingTop: vh(15),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  featuresTitle: {
    // alignSelf: 'stretch',
    color: '#FFFFFF',
    fontSize: vh(16),
    fontWeight: '700',
    marginBottom: vh(10),
    textAlign: 'left',
  } as TextStyle,
  featureItem: {
    // alignSelf: 'stretch',
    color: '#FFFFFF',
    fontSize: vh(14),
    fontWeight: '600',
    marginVertical: vh(4),
    opacity: 1,
    textAlign: 'left',
  } as TextStyle,
});

export default SubscriptionChoiceSlide;
