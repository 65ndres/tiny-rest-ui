// app/context/RevenueCatContext.tsx
import { API_URL, isProduction } from '@/constants/Config';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/legalUrls';
import { syncProSubscriptionToApp as syncProSubscription } from '@/app/utils/subscriptionSync';
import axios from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, {
  CustomVariableValue,
  PAYWALL_RESULT,
} from 'react-native-purchases-ui';
import { useAuth } from './AuthContext';

// EXPO_PUBLIC_* keys are injected at build time; pick DEV vs PROD by environment
const REVENUECAT_API_KEY = isProduction
  ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_PROD
  : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_DEV;
// Entitlement identifier
export const ENTITLEMENT_IDENTIFIER = 'Tiny Rest Pro';

interface RevenueCatContextType {
  // State
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering | null;
  isLoading: boolean;
  isPro: boolean;

  // Methods
  refreshCustomerInfo: () => Promise<CustomerInfo>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  presentPaywall: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
  getCurrentOffering: () => PurchasesOffering | null;
  getPackages: () => PurchasesPackage[] | null;
  reloadOfferings: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      const hasPro = info.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
      setIsPro(hasPro);

      return info;
    } catch (error) {
      console.error('Error refreshing customer info:', error);
      const purchasesError = error as PurchasesError;
      throw purchasesError;
    }
  }, []);

  const reloadOfferings = useCallback(async () => {
    try {
      const offeringsData = await Purchases.getOfferings();
      if (offeringsData.current !== null) {
        setOfferings(offeringsData.current);
      } else {
        setOfferings(null);
        console.warn('No current offering available');
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      const purchasesError = error as PurchasesError;
      if (__DEV__) {
        Alert.alert('Error Loading Offerings', purchasesError.message);
      }
      throw purchasesError;
    }
  }, []);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        if (!REVENUECAT_API_KEY) {
          const envName = isProduction
            ? 'EXPO_PUBLIC_REVENUECAT_API_KEY_PROD'
            : 'EXPO_PUBLIC_REVENUECAT_API_KEY_DEV';
          const message = `Missing RevenueCat API key (${envName}). Restart Metro after updating .env.`;
          console.error(message);
          if (__DEV__) {
            Alert.alert('RevenueCat Configuration Error', message);
          }
          return;
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          setIsConfigured(true);
        }

        if (user?.id) {
          await Purchases.logIn(user.id.toString());
        }

        await Promise.all([refreshCustomerInfo(), reloadOfferings()]);
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
        const purchasesError = error as PurchasesError;
        if (__DEV__) {
          Alert.alert(
            'RevenueCat Initialization Error',
            purchasesError.message || 'Failed to initialize RevenueCat SDK'
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initializeRevenueCat();
    // Intentionally run once on mount; user login is handled in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync RevenueCat user with auth: log in when user is set, log out when user is cleared.
  useEffect(() => {
    if (!isConfigured) return;

    const updateUserId = async () => {
      if (user?.id) {
        try {
          await Purchases.logIn(user.id.toString());
          await refreshCustomerInfo();
        } catch (error) {
          console.error('Error updating RevenueCat user ID:', error);
        }
      } else {
        const appUserId = customerInfo?.originalAppUserId ?? '';
        const isAnonymous = !appUserId || appUserId.startsWith('$RCAnonymousID');
        if (!isAnonymous) {
          try {
            await Purchases.logOut();
          } catch (error) {
            console.error('Error logging out RevenueCat user:', error);
          }
        }
        setCustomerInfo(null);
        setIsPro(false);
      }
    };

    void updateUserId();
  }, [user?.id, refreshCustomerInfo, isConfigured]);

  const createUserSubscription = useCallback(async (info: CustomerInfo) => {
    await axios.post(`${API_URL}/subscription/create_pro_subscription`, {
      customerInfo: info,
    });
  }, []);

  const syncProSubscriptionToApp = useCallback(
    async (info: CustomerInfo) => {
      await syncProSubscription({
        createProSubscription: () => createUserSubscription(info),
        refreshUser,
        onCreateError: (error) => {
          console.error('Error updating user subscription:', error);
          Alert.alert(
            'Sync Error',
            'Purchase succeeded, but we could not update your account. Please restore purchases or try again.'
          );
        },
        onRefreshError: (error) => {
          console.error('Error refreshing user after subscription:', error);
        },
      });
    },
    [createUserSubscription, refreshUser]
  );

  const purchasePackage = useCallback(
    async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
      try {
        const { customerInfo: purchasedInfo } =
          await Purchases.purchasePackage(packageToPurchase);
        setCustomerInfo(purchasedInfo);

        const hasPro =
          purchasedInfo.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
        setIsPro(hasPro);

        if (hasPro) {
          await syncProSubscriptionToApp(purchasedInfo);
          Alert.alert(
            'Success',
            'Welcome to TinyRest Pro! Your subscription is now active.'
          );
          return true;
        }

        Alert.alert('Warning', 'Purchase completed but Pro entitlement not found.');
        return false;
      } catch (error) {
        const purchasesError = error as PurchasesError;

        if (purchasesError.userCancelled) {
          return false;
        }

        console.error('Error purchasing package:', purchasesError);
        Alert.alert(
          'Purchase Failed',
          purchasesError.message ||
            'An error occurred during purchase. Please try again.'
        );
        return false;
      }
    },
    [syncProSubscriptionToApp]
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      const hasPro = info.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
      setIsPro(hasPro);

      if (hasPro) {
        await syncProSubscriptionToApp(info);
        Alert.alert('Success', 'Your purchases have been restored!');
        return true;
      }

      Alert.alert('No Purchases Found', 'No active purchases were found to restore.');
      return false;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      const purchasesError = error as PurchasesError;
      Alert.alert(
        'Restore Failed',
        purchasesError.message || 'Failed to restore purchases.'
      );
      return false;
    }
  }, [syncProSubscriptionToApp]);

  const presentPaywall = useCallback(async () => {
    try {
      if (!REVENUECAT_API_KEY || !isConfigured) {
        throw new Error(
          'RevenueCat is not configured. Check your API key and restart the app.'
        );
      }
      if (typeof RevenueCatUI?.presentPaywall !== 'function') {
        throw new Error('RevenueCatUI.presentPaywall is not available');
      }
      const paywallResult = await RevenueCatUI.presentPaywall({
        offering: offerings ?? undefined,
        displayCloseButton: true,
        customVariables: {
          privacy_policy_url: CustomVariableValue.string(PRIVACY_POLICY_URL),
          terms_of_use_url: CustomVariableValue.string(TERMS_OF_USE_URL),
        },
      });

      const latestCustomerInfo = await refreshCustomerInfo();

      if (
        paywallResult === PAYWALL_RESULT.PURCHASED ||
        paywallResult === PAYWALL_RESULT.RESTORED
      ) {
        await syncProSubscriptionToApp(latestCustomerInfo);
        Alert.alert('Success', 'Welcome to TinyRest Pro!');
      }
    } catch (error) {
      const purchasesError = error as PurchasesError;

      console.error('Error presenting paywall:', purchasesError);
      Alert.alert(
        'Error',
        purchasesError?.message || 'Failed to present paywall. Please try again.'
      );
    }
  }, [offerings, refreshCustomerInfo, syncProSubscriptionToApp, isConfigured]);

  const presentCustomerCenter = useCallback(async () => {
    try {
      if (typeof RevenueCatUI?.presentCustomerCenter !== 'function') {
        throw new Error('RevenueCatUI.presentCustomerCenter is not available');
      }
      await RevenueCatUI.presentCustomerCenter();
      await refreshCustomerInfo();
    } catch (error) {
      const purchasesError = error as PurchasesError;
      console.error('Error presenting customer center:', purchasesError);
      Alert.alert(
        'Error',
        purchasesError?.message || 'Failed to open customer center. Please try again.'
      );
    }
  }, [refreshCustomerInfo]);

  const getCurrentOffering = useCallback((): PurchasesOffering | null => {
    return offerings;
  }, [offerings]);

  const getPackages = useCallback((): PurchasesPackage[] | null => {
    return offerings?.availablePackages || null;
  }, [offerings]);

  const value: RevenueCatContextType = {
    customerInfo,
    offerings,
    isLoading,
    isPro,
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    presentCustomerCenter,
    getCurrentOffering,
    getPackages,
    reloadOfferings,
  };

  return (
    <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>
  );
};

export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}

export default RevenueCatProvider;
