// app/hooks/useProEntitlement.ts
import { useRevenueCat, ENTITLEMENT_IDENTIFIER } from '../context/RevenueCatContext';

/**
 * Custom hook to check if user has Promsas Pro entitlement
 * This is a convenience hook that wraps the RevenueCat context
 * 
 * @returns {boolean} true if user has active Pro entitlement, false otherwise
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const isPro = useProEntitlement();
 *   
 *   if (isPro) {
 *     return <ProFeature />;
 *   }
 *   
 *   return <UpgradePrompt />;
 * };
 * ```
 */
export const useProEntitlement = (): boolean => {
  const { isPro } = useRevenueCat();
  return isPro;
};

/**
 * Hook to get full RevenueCat context with Pro entitlement check
 * Use this when you need more than just the boolean check
 * 
 * @returns Object containing isPro boolean and full RevenueCat context
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { isPro, customerInfo, presentPaywall } = useProEntitlementFull();
 *   
 *   return (
 *     <View>
 *       {isPro ? (
 *         <Text>Welcome Pro User!</Text>
 *       ) : (
 *         <Button onPress={presentPaywall} title="Upgrade to Pro" />
 *       )}
 *     </View>
 *   );
 * };
 * ```
 */
export const useProEntitlementFull = () => {
  const revenueCat = useRevenueCat();
  return {
    ...revenueCat,
    isPro: revenueCat.isPro,
  };
};

export default useProEntitlement;

