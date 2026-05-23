# RevenueCat Quick Start Guide

## ✅ What's Already Done

1. ✅ RevenueCat SDK installed (`react-native-purchases` & `react-native-purchases-ui`)
2. ✅ RevenueCat context/provider created and integrated
3. ✅ SubscriptionScreen updated with full RevenueCat integration
4. ✅ Entitlement checking hook created (`useProEntitlement`)
5. ✅ Customer Center support integrated
6. ✅ Error handling implemented
7. ✅ Paywall integration complete

## 🚀 Next Steps

### 1. Configure RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create/select your project
3. Set up the following:

   **Entitlement:**
   - Name: `Promsas Pro` (must match exactly)
   
   **Product:**
   - Product ID: `monthly`
   - Attach to `Promsas Pro` entitlement
   
   **Offering:**
   - Create a default offering
   - Add the `monthly` product
   - Set as current offering

### 2. Set Up Products in App Stores

#### iOS (App Store Connect)
1. Create Auto-Renewable Subscription
2. Product ID: `monthly`
3. Set price and duration (1 month)

#### Android (Google Play Console)
1. Create Subscription
2. Product ID: `monthly` (match iOS)
3. Set price and billing period (1 month)

### 3. Update API Key (Production)

When ready for production, update the API key in:
```
app/context/RevenueCatContext.tsx
```

Replace the test key with your production key from RevenueCat dashboard.

### 4. Test the Integration

1. Run the app: `npm start`
2. Navigate to Subscription screen
3. Test purchase flow (use sandbox/test accounts)
4. Verify entitlement is granted
5. Test restore purchases
6. Test Customer Center

## 📖 Usage Examples

### Check if User is Pro

```tsx
import { useProEntitlement } from '../hooks/useProEntitlement';

const MyComponent = () => {
  const isPro = useProEntitlement();
  
  return isPro ? <ProContent /> : <UpgradePrompt />;
};
```

### Show Paywall

```tsx
import { useRevenueCat } from '../context/RevenueCatContext';

const MyComponent = () => {
  const { presentPaywall } = useRevenueCat();
  
  return <Button onPress={presentPaywall} title="Upgrade" />;
};
```

### Restore Purchases

```tsx
import { useRevenueCat } from '../context/RevenueCatContext';

const MyComponent = () => {
  const { restorePurchases } = useRevenueCat();
  
  return <Button onPress={restorePurchases} title="Restore" />;
};
```

## 📁 File Structure

```
app/
├── context/
│   └── RevenueCatContext.tsx      # RevenueCat provider & context
├── hooks/
│   └── useProEntitlement.ts       # Convenience hook for Pro check
└── screens/
    └── SubscriptionScreen.tsx     # Subscription UI with RevenueCat
```

## 🔑 Key Constants

- **API Key**: `test_coZdnrQZwFSrdHtAmaBgRVpmICu` (test key)
- **Entitlement ID**: `Promsas Pro`
- **Product ID**: `monthly`

## 📚 Documentation

See `REVENUECAT_SETUP.md` for complete documentation including:
- Detailed setup instructions
- Troubleshooting guide
- Best practices
- Production checklist

## ⚠️ Important Notes

1. **Test Key**: The current API key is for testing. Replace with production key before release.
2. **Product IDs**: Must match exactly between App Store/Play Store and RevenueCat dashboard.
3. **Entitlement Name**: Must match exactly: `Promsas Pro`
4. **User ID**: Automatically linked when user authenticates
5. **Testing**: Use sandbox/test accounts for testing purchases

## 🆘 Need Help?

- Check `REVENUECAT_SETUP.md` for detailed documentation
- Review RevenueCat docs: https://www.revenuecat.com/docs
- Check console logs (debug mode enabled in development)

