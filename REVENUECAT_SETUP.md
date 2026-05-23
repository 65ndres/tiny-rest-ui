# RevenueCat Integration Guide for Promsas App

This guide documents the RevenueCat SDK integration for the Promsas app, including setup, configuration, and usage.

## ✅ Installation Status

The RevenueCat SDK packages are already installed:
- `react-native-purchases`: ^9.10.0
- `react-native-purchases-ui`: ^9.10.0

## 📋 Table of Contents

1. [Configuration](#configuration)
2. [Architecture](#architecture)
3. [Usage Examples](#usage-examples)
4. [RevenueCat Dashboard Setup](#revenuecat-dashboard-setup)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## 🔧 Configuration

### API Key

The RevenueCat API key is configured in `app/context/RevenueCatContext.tsx`:
```typescript
const REVENUECAT_API_KEY = 'test_coZdnrQZwFSrdHtAmaBgRVpmICu';
```

**⚠️ Important**: This is a test API key. For production, you should:
1. Get your production API key from RevenueCat dashboard
2. Store it securely (consider using environment variables)
3. Update the key in `RevenueCatContext.tsx`

### Entitlement Identifier

The app uses the entitlement identifier: **`Promsas Pro`**

This must match exactly what you configure in your RevenueCat dashboard.

## 🏗️ Architecture

### Components

1. **RevenueCatContext** (`app/context/RevenueCatContext.tsx`)
   - Manages RevenueCat SDK initialization
   - Provides subscription state and methods
   - Handles customer info and entitlements
   - Exposes hooks for components

2. **SubscriptionScreen** (`app/screens/SubscriptionScreen.tsx`)
   - Displays subscription status
   - Shows RevenueCat paywall
   - Handles purchases and restores
   - Manages subscription via Customer Center

3. **useProEntitlement Hook** (`app/hooks/useProEntitlement.ts`)
   - Convenience hook for checking Pro entitlement
   - Simple boolean check: `const isPro = useProEntitlement();`

### Provider Setup

The `RevenueCatProvider` is wrapped around the app in `app/_layout.tsx`:

```tsx
<AuthProvider>
  <RevenueCatProvider>
    <RootLayout />
  </RevenueCatProvider>
</AuthProvider>
```

The provider automatically:
- Initializes RevenueCat SDK on app start
- Links user ID when authenticated
- Refreshes customer info and offerings
- Updates entitlement status

## 📱 Usage Examples

### Basic Entitlement Check

```tsx
import { useProEntitlement } from '../hooks/useProEntitlement';

const MyComponent = () => {
  const isPro = useProEntitlement();
  
  if (isPro) {
    return <ProFeature />;
  }
  
  return <UpgradePrompt />;
};
```

### Full RevenueCat Context Usage

```tsx
import { useRevenueCat } from '../context/RevenueCatContext';

const MyComponent = () => {
  const {
    isPro,
    customerInfo,
    offerings,
    presentPaywall,
    purchasePackage,
    restorePurchases,
    presentCustomerCenter,
  } = useRevenueCat();
  
  const handleUpgrade = async () => {
    await presentPaywall();
  };
  
  return (
    <View>
      {isPro ? (
        <Text>Welcome Pro User!</Text>
      ) : (
        <Button onPress={handleUpgrade} title="Upgrade to Pro" />
      )}
    </View>
  );
};
```

### Purchase Specific Package

```tsx
import { useRevenueCat } from '../context/RevenueCatContext';

const MyComponent = () => {
  const { purchasePackage, getPackages } = useRevenueCat();
  
  const handlePurchase = async () => {
    const packages = getPackages();
    const monthlyPackage = packages?.find(pkg => 
      pkg.identifier === 'monthly'
    );
    
    if (monthlyPackage) {
      await purchasePackage(monthlyPackage);
    }
  };
  
  return <Button onPress={handlePurchase} title="Subscribe" />;
};
```

### Restore Purchases

```tsx
import { useRevenueCat } from '../context/RevenueCatContext';

const MyComponent = () => {
  const { restorePurchases } = useRevenueCat();
  
  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      // Purchases restored successfully
    }
  };
  
  return <Button onPress={handleRestore} title="Restore Purchases" />;
};
```

### Customer Center (Manage Subscription)

```tsx
import { useRevenueCat } from '../context/RevenueCatContext';

const MyComponent = () => {
  const { presentCustomerCenter } = useRevenueCat();
  
  const handleManage = async () => {
    await presentCustomerCenter();
  };
  
  return <Button onPress={handleManage} title="Manage Subscription" />;
};
```

## 🎯 RevenueCat Dashboard Setup

### 1. Create Products in App Store Connect / Google Play Console

#### iOS (App Store Connect)
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create a new subscription:
   - Product ID: `monthly` (or your preferred ID)
   - Type: Auto-Renewable Subscription
   - Subscription Group: Create or use existing
   - Price: Set your monthly price
   - Duration: 1 Month

#### Android (Google Play Console)
1. Go to Google Play Console → Your App → Monetize → Subscriptions
2. Create a new subscription:
   - Product ID: `monthly` (must match iOS if using same)
   - Name: "Monthly Subscription"
   - Billing period: 1 month
   - Price: Set your monthly price

### 2. Configure RevenueCat Dashboard

1. **Create Entitlement**:
   - Go to RevenueCat Dashboard → Your Project → Entitlements
   - Create entitlement: `Promsas Pro`
   - This must match the `ENTITLEMENT_IDENTIFIER` in code

2. **Create Products**:
   - Go to Products → Add Product
   - Product ID: `monthly` (must match App Store/Play Store)
   - Add for both iOS and Android if supporting both

3. **Create Offering**:
   - Go to Offerings → Create Offering
   - Name: "Default" (or your preferred name)
   - Add the `monthly` product to the offering
   - Set as current offering

4. **Attach Products to Entitlement**:
   - Go to Entitlements → `Promsas Pro`
   - Attach the `monthly` product
   - This grants the entitlement when purchased

### 3. Configure API Keys

1. **Get API Keys**:
   - Go to RevenueCat Dashboard → Project Settings → API Keys
   - Copy your public API key
   - For production, use the production key (not test key)

2. **Update Code**:
   - Update `REVENUECAT_API_KEY` in `app/context/RevenueCatContext.tsx`
   - Consider using environment variables for different keys per environment

## 🧪 Testing

### Sandbox Testing (iOS)

1. **Create Sandbox Tester**:
   - App Store Connect → Users and Access → Sandbox Testers
   - Create a new sandbox tester account

2. **Test on Device**:
   - Sign out of your Apple ID on the device
   - Run the app
   - When prompted, sign in with sandbox tester account
   - Test purchases (they won't charge real money)

### Test Purchases (Android)

1. **License Testing**:
   - Google Play Console → Settings → License Testing
   - Add test email addresses

2. **Test on Device**:
   - Use a test account
   - Purchases won't charge real money

### Testing Checklist

- [ ] SDK initializes without errors
- [ ] Offerings load correctly
- [ ] Paywall displays properly
- [ ] Purchase flow completes successfully
- [ ] Entitlement is granted after purchase
- [ ] Restore purchases works
- [ ] Customer Center opens correctly
- [ ] Subscription status updates correctly
- [ ] Expiration dates display correctly

## 🔍 Troubleshooting

### Common Issues

#### 1. SDK Not Initializing

**Symptoms**: No offerings, errors in console

**Solutions**:
- Check API key is correct
- Verify network connection
- Check RevenueCat dashboard for API key status
- Ensure user is logged in (for user ID linking)

#### 2. No Offerings Available

**Symptoms**: `offerings` is null, no packages shown

**Solutions**:
- Verify offering is set as "current" in RevenueCat dashboard
- Check product IDs match between dashboard and code
- Ensure products are attached to entitlement
- Wait a few minutes after creating offering (propagation delay)

#### 3. Purchase Fails

**Symptoms**: Purchase button doesn't work, errors during purchase

**Solutions**:
- Verify product exists in App Store Connect / Google Play Console
- Check product ID matches exactly
- Ensure sandbox/testing account is set up correctly
- Check device is signed in to correct account
- Verify app is properly configured for IAP

#### 4. Entitlement Not Granted

**Symptoms**: Purchase succeeds but `isPro` remains false

**Solutions**:
- Verify entitlement identifier matches: `Promsas Pro`
- Check product is attached to entitlement in dashboard
- Refresh customer info: `await refreshCustomerInfo()`
- Check RevenueCat webhooks are configured (for backend sync)

#### 5. Customer Center Not Opening

**Symptoms**: Customer Center button does nothing

**Solutions**:
- Ensure `react-native-purchases-ui` is installed
- Check user has active subscription
- Verify RevenueCat UI package is properly linked

### Debug Mode

Enable debug logging in development:

```typescript
// In RevenueCatContext.tsx
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}
```

This will show detailed logs in console for debugging.

### Checking Customer Info

You can log customer info to debug:

```tsx
const { customerInfo } = useRevenueCat();

useEffect(() => {
  if (customerInfo) {
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));
    console.log('Active Entitlements:', customerInfo.entitlements.active);
  }
}, [customerInfo]);
```

## 📚 Additional Resources

- [RevenueCat React Native Documentation](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [RevenueCat Paywalls Documentation](https://www.revenuecat.com/docs/tools/paywalls)
- [RevenueCat Customer Center Documentation](https://www.revenuecat.com/docs/tools/customer-center)
- [RevenueCat Best Practices](https://www.revenuecat.com/docs/best-practices)

## 🔐 Security Best Practices

1. **API Keys**: Never commit production API keys to version control
2. **User Identification**: Always link user ID after authentication
3. **Receipt Validation**: RevenueCat handles this, but ensure webhooks are set up
4. **Error Handling**: Always handle purchase errors gracefully
5. **Testing**: Use sandbox/test accounts, never test with production accounts

## 🚀 Production Checklist

Before going to production:

- [ ] Replace test API key with production key
- [ ] Configure production products in App Store/Play Store
- [ ] Set up RevenueCat webhooks for backend sync
- [ ] Test all purchase flows thoroughly
- [ ] Verify entitlement checking works correctly
- [ ] Test restore purchases functionality
- [ ] Verify Customer Center works
- [ ] Set up error monitoring
- [ ] Configure analytics (if using)
- [ ] Test on real devices (not just simulators)

## 📝 Notes

- The app automatically links user ID when authenticated
- Customer info is refreshed on app focus
- Entitlement status is checked in real-time
- All purchase flows include proper error handling
- Customer Center is available for subscription management

