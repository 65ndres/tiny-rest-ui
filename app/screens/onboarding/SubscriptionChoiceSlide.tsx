import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { API_URL } from '../../../constants/Config';
import { BASIC_PLAN_DISPLAY_NAME } from '../../../constants/appBranding';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../../constants/legalUrls';
import { PLAN_COMPARISON_FEATURES, proPlanDisplayName, subscriptionPlanPerks } from '../../../constants/subscriptionPlanPerks';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import { upgradeFromSubscriptionScreen } from '@/app/utils/subscriptionUpgrade';
import { fetchUserProfile } from '@/app/utils/userProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useRevenueCat } from '../../context/RevenueCatContext';
import OnboardingSlideShell from './OnboardingSlideShell';
import { vh } from './onboardingLayout';
import { padX } from '@/constants/appViewport';

type PlanId = 'basic' | 'pro';

const PLAN_SLIDES: PlanId[] = ['pro', 'basic'];

const planCardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: vh(15),
  paddingVertical: vh(24),
  paddingHorizontal: vh(24),
  borderWidth: vh(2),
  borderColor: 'rgba(255, 255, 255, 0.2)',
  flex: 1,
} as ViewStyle;

type PlanCardProps = {
  plan: PlanId;
  monthlyPrice: string;
};

const PlanCard: React.FC<PlanCardProps> = ({ plan, monthlyPrice }) => {
  const isBasic = plan === 'basic';
  const perks = isBasic ? subscriptionPlanPerks.basic : subscriptionPlanPerks.pro;

  return (
    <View style={[styles.planCard, planCardStyle, styles.planCardSelected]}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>
          {isBasic ? BASIC_PLAN_DISPLAY_NAME : proPlanDisplayName}
        </Text>
      </View>
      <View style={styles.planPriceContainer}>
        {isBasic ? (
          <Text style={styles.planPrice}>Free</Text>
        ) : (
          <>
            <Text style={styles.planPrice}>{monthlyPrice}</Text>
            <Text style={styles.planInterval}>/month</Text>
          </>
        )}
      </View>
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>{perks.sectionTitle}</Text>
        {PLAN_COMPARISON_FEATURES.map((feature) => {
          const crossedOut = isBasic && !feature.includedInBasic;
          return (
            <Text
              key={feature.label}
              style={[styles.featureItem, crossedOut ? styles.featureItemCrossedOut : null]}
            >
              • {feature.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const SubscriptionChoiceSlide: React.FC = () => {
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  const {
    getPackages,
    presentPaywall,
    refreshCustomerInfo,
    reloadOfferings,
    isLoading: revenueCatLoading,
  } = useRevenueCat();
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [isReloadingOfferings, setIsReloadingOfferings] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<PlanId>('pro');
  const [carouselSize, setCarouselSize] = React.useState({ width: 0, height: 0 });

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

  const monthlyPrice = monthlyPackage ? monthlyPackage.product.priceString : '...';
  const activeIndex = PLAN_SLIDES.indexOf(selectedPlan);

  const fetchProfile = React.useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    await fetchUserProfile(token);
  }, []);

  const handleBasic = async () => {
    try {
      setIsSubscribing(true);
      await axios.post(`${API_URL}/subscription/create_basic_subscription`);

      await refreshUser();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) &&
        (error.response?.data?.message || error.response?.data?.error)
          ? String(error.response.data.message || error.response.data.error)
          : 'Could not create basic subscription. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePro = async () => {
    try {
      setIsSubscribing(true);
      await upgradeFromSubscriptionScreen({
        presentPaywall,
        refreshCustomerInfo,
        fetchProfile,
        refreshUser,
      });
    } catch (error: unknown) {
      console.error('Paywall error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to present paywall. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleReloadOfferings = async () => {
    try {
      setIsReloadingOfferings(true);
      await reloadOfferings();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not reload plans.';
      Alert.alert('Error', message);
    } finally {
      setIsReloadingOfferings(false);
    }
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
    <OnboardingSlideShell paddingHorizontal={padX(32)}>
      <View style={styles.subscriptionSlideRoot}>
        <View style={styles.contentCluster}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: vh(20), fontWeight: '700', textAlign: 'center', width: '100%', marginBottom: vh(40), flexShrink: 0 }}>Slide to select your plan</Text>
        </View>
        <View style={styles.plansBlock}>
          <View
            style={styles.carouselViewport}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              if (width === carouselSize.width && height === carouselSize.height) return;
              setCarouselSize({ width, height });
            }}
          >
            {carouselSize.width > 0 && carouselSize.height > 0 ? (
              <Carousel
                width={carouselSize.width}
                height={carouselSize.height}
                data={PLAN_SLIDES}
                loop={false}
                autoPlay={false}
                pagingEnabled
                defaultIndex={0}
                onSnapToItem={(index) => {
                  const plan = PLAN_SLIDES[index];
                  if (plan) setSelectedPlan(plan);
                }}
                renderItem={({ item }) => (
                  <View style={styles.carouselItem}>
                    <PlanCard plan={item} monthlyPrice={monthlyPrice} />
                  </View>
                )}
              />
            ) : null}
          </View>

          <View style={styles.dotsBar}>
            {PLAN_SLIDES.map((plan, index) => (
              <View
                key={plan}
                style={[
                  styles.dot,
                  index === activeIndex ? styles.dotActive : styles.dotIdle,
                ]}
              />
            ))}
          </View>
        </View>
        </View>

        {!monthlyPackage ? (
          <View style={styles.offeringsMissingBlock}>
            <Text style={styles.offeringsMissingText}>
              Pro plans couldn&apos;t be loaded. Check your connection and try
              again.
            </Text>
            <TimerOutlineButton
              label="Reload plans"
              onPress={() => void handleReloadOfferings()}
              disabled={isReloadingOfferings}
              isLoading={isReloadingOfferings}
              variant="outline"
              size="lg"
              accessibilityLabel="Reload Pro plans"
            />
          </View>
        ) : null}

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
              selectedPlan === 'basic'
                ? `Continue with ${BASIC_PLAN_DISPLAY_NAME}`
                : `Continue with ${proPlanDisplayName}`
            }
            onPress={() => {
              if (selectedPlan === 'basic') void handleBasic();
              else void handlePro();
            }}
            disabled={
              (selectedPlan === 'basic' && isSubscribing) ||
              (selectedPlan === 'pro' && (isSubscribing || !monthlyPackage))
            }
            isLoading={isSubscribing}
            variant="solid"
            size="xl"
            style={{ marginTop: vh(20) }}
            accessibilityLabel="Continue"
          />
        </View>
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
    paddingBottom: 96,
  } as ViewStyle,
  contentCluster: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'center',
  } as ViewStyle,
  plansBlock: {
    width: '100%',
  } as ViewStyle,
  carouselViewport: {
    width: '100%',
    height: vh(340),
  } as ViewStyle,
  carouselItem: {
    flex: 1,
    width: '100%',
    paddingHorizontal: vh(8),
  } as ViewStyle,
  dotsBar: {
    paddingTop: vh(8),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: vh(8),
    marginTop: vh(12),
    flexShrink: 0,
  } as ViewStyle,
  dot: {
    width: vh(6),
    height: vh(6),
    borderRadius: vh(3),
  } as ViewStyle,
  dotActive: {
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  dotIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  } as ViewStyle,
  ctaBlock: {
    width: '100%',
    flexShrink: 0,
    paddingTop: vh(8),
  } as ViewStyle,
  offeringsMissingBlock: {
    width: '100%',
    alignItems: 'center',
    gap: vh(10),
    flexShrink: 0,
    marginBottom: vh(8),
  } as ViewStyle,
  offeringsMissingText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: vh(13),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: vh(18),
  } as TextStyle,
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
  subscriptionTitle: {
    color: '#FFFFFF',
    fontSize: vh(20),
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    marginBottom: vh(10),
    flexShrink: 0,
  } as TextStyle,
  planCard: {
    alignSelf: 'stretch',
  } as ViewStyle,
  planCardSelected: {
    borderColor: '#FFFFFF',
  } as ViewStyle,
  planHeader: {} as ViewStyle,
  planName: {
    color: '#FFFFFF',
    fontSize: vh(20),
    fontWeight: '700',
  } as TextStyle,
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  } as ViewStyle,
  planPrice: {
    color: '#FFFFFF',
    fontSize: vh(22),
    fontWeight: '700',
  } as TextStyle,
  planInterval: {
    color: '#FFFFFF',
    fontSize: vh(14),
    marginLeft: vh(6),
    fontWeight: '500',
    opacity: 1,
  } as TextStyle,
  featuresContainer: {
    marginTop: vh(8),
    paddingTop: vh(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  featuresTitle: {
    color: '#FFFFFF',
    fontSize: vh(15),
    fontWeight: '700',
    marginBottom: vh(6),
    textAlign: 'left',
  } as TextStyle,
  featureItem: {
    color: '#FFFFFF',
    fontSize: vh(16),
    marginVertical: vh(3),
    lineHeight: vh(22),
    opacity: 1,
    textAlign: 'left',
  } as TextStyle,
  featureItemCrossedOut: {
    textDecorationLine: 'line-through',
    opacity: 0.45,
  } as TextStyle,
});

export default SubscriptionChoiceSlide;
