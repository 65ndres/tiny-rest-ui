export type ProSubscriptionTierParams = {
  isPro: boolean;
  serverSubscriptionType: string | null;
};

export const isProSubscriptionTier = ({
  isPro,
  serverSubscriptionType,
}: ProSubscriptionTierParams): boolean =>
  isPro || serverSubscriptionType?.toLowerCase() === 'pro';

export type SubscriptionProCtaParams = {
  isBasicServerTier: boolean;
};

/** Free/basic accounts upgrade; everyone else still unpaid uses Subscribe. */
export const subscriptionProCtaLabel = ({
  isBasicServerTier,
}: SubscriptionProCtaParams): string =>
  isBasicServerTier ? 'Upgrade to pro' : 'Subscribe to Pro';

export type UpgradeFromSubscriptionScreenDeps = {
  presentPaywall: () => Promise<void>;
  refreshCustomerInfo: () => Promise<unknown>;
  fetchProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

/**
 * Subscription screen free → Pro path: present paywall, then refresh local
 * RevenueCat / profile / auth user state. Refreshes are skipped if paywall throws.
 */
export async function upgradeFromSubscriptionScreen(
  deps: UpgradeFromSubscriptionScreenDeps
): Promise<void> {
  await deps.presentPaywall();
  await deps.refreshCustomerInfo();
  await deps.fetchProfile();
  await deps.refreshUser();
}
