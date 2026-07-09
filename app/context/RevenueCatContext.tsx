// app/context/RevenueCatContext.tsx
import { API_URL, isDevelopment } from '@/constants/Config';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/legalUrls';
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

// RevenueCat Test key (used in development)
const REVENUECAT_TEST_KEY = 'test_QUpAwigTTupwnYwSsqqTWletcbb';

// Use Test key in development; otherwise use production key from env (must be EXPO_PUBLIC_* for Expo to inject it)
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
  // isDevelopment
  //   ? REVENUECAT_TEST_KEY
  //   : (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? REVENUECAT_TEST_KEY);

// console.log("PACAAAAAA", REVENUECAT_API_KEY)
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
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPro, setIsPro] = useState<boolean>(false);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Set log level for debugging (remove in production or set to ERROR)
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        // Configure RevenueCat with API key
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        } else if (Platform.OS === 'android') {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        }

        // Set user ID if authenticated
        if (user?.id) {
          await Purchases.logIn(user.id.toString());
        }

        // Load initial customer info and offerings
        await Promise.all([
          refreshCustomerInfo(),
          loadOfferings(),
        ]);
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

    initializeRevenueCat();
  }, []);

  // Load offerings
  const loadOfferings = async () => {
    try {
      const offeringsData = await Purchases.getOfferings();
      if (offeringsData.current !== null) {
        setOfferings(offeringsData.current);
      } else {
        console.warn('No current offering available');
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      const purchasesError = error as PurchasesError;
      if (__DEV__) {
        Alert.alert('Error Loading Offerings', purchasesError.message);
      }
    }
  };

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has Pro entitlement
      const hasPro = info.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
      setIsPro(hasPro);
      
      return info;
    } catch (error) {
      console.error('Error refreshing customer info:', error);
      const purchasesError = error as PurchasesError;
      throw purchasesError;
    }
  }, []);

  // Sync RevenueCat user with auth: log in when user is set, log out when user is cleared.
  // This ensures RevenueCat forgets the previous user's subscription state after logout.
  useEffect(() => {
    const updateUserId = async () => {
      if (user?.id) {
        try {
          await Purchases.logIn(user.id.toString());
          await refreshCustomerInfo();
        } catch (error) {
          console.error('Error updating RevenueCat user ID:', error);
        }
      } else {
        // Only call logOut() when RevenueCat has a logged-in user; otherwise SDK throws "current user is anonymous"
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

    updateUserId();
  }, [user?.id, refreshCustomerInfo]);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);
      
      // Check if purchase granted Pro entitlement
      const hasPro = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
      setIsPro(hasPro);
      
      if (hasPro) {
        Alert.alert('Success', 'Welcome to Promsas Pro! Your subscription is now active.');
        return true;
      } else {
        Alert.alert('Warning', 'Purchase completed but Pro entitlement not found.');
        return false;
      }
    } catch (error) {
      const purchasesError = error as PurchasesError;
      
      // User cancelled - don't show error
      if (purchasesError.userCancelled) {
        return false;
      }
      
      // Handle other errors
      console.error('Error purchasing package:', purchasesError);
      Alert.alert(
        'Purchase Failed',
        purchasesError.message || 'An error occurred during purchase. Please try again.'
      );
      return false;
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      const hasPro = info.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
      setIsPro(hasPro);
      
      if (hasPro) {
        Alert.alert('Success', 'Your purchases have been restored!');
        return true;
      } else {
        Alert.alert('No Purchases Found', 'No active purchases were found to restore.');
        return false;
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      const purchasesError = error as PurchasesError;
      Alert.alert('Restore Failed', purchasesError.message || 'Failed to restore purchases.');
      return false;
    }
  }, []);

  const createUserSubscription = useCallback(async (customerInfo: CustomerInfo) => {
    try {
      // console.log('customerInfo PACA');
      await axios.post(`${API_URL}/subscription/create_pro_subscription`, {
        customerInfo,
      });
    } catch (error) {
        console.error('Error updating user subscription:', error);
      }
    },
    []
  );
  // Present RevenueCat Paywall
  const presentPaywall = useCallback(async () => {
    try {
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

      // Refresh customer info after paywall closes so state is up to date
      await refreshCustomerInfo();

      if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED) {
        Alert.alert('Success', 'Welcome to Promsas Pro!');
        
        const customerInfo = await Purchases.getCustomerInfo();
        await createUserSubscription(customerInfo);

        // console.log('customerInfo', customerInfo);
        // console.log('paywallResult', paywallResult);
      }
    } catch (error) {
      const purchasesError = error as PurchasesError;

      // User cancelled - don't show error
      // if (purchasesError?.userCancelled) {
      //   return;
      // }

      console.error('Error presenting paywall:', purchasesError);
      Alert.alert(
        'Error',
        purchasesError?.message || 'Failed to present paywall. Please try again.'
      );
    }
  }, [offerings, refreshCustomerInfo]);

  // Present Customer Center
  const presentCustomerCenter = useCallback(async () => {
    try {
      if (typeof RevenueCatUI?.presentCustomerCenter !== 'function') {
        throw new Error('RevenueCatUI.presentCustomerCenter is not available');
      }
      await RevenueCatUI.presentCustomerCenter();
      // Refresh customer info after customer center interaction
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

  // Get current offering
  const getCurrentOffering = useCallback((): PurchasesOffering | null => {
    return offerings;
  }, [offerings]);

  // Get packages from current offering
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
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
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

