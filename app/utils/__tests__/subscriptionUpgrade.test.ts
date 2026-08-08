import {
  isProSubscriptionTier,
  subscriptionProCtaLabel,
  upgradeFromSubscriptionScreen,
} from '../subscriptionUpgrade';

describe('subscriptionProCtaLabel', () => {
  it('shows Upgrade to pro for free/basic accounts', () => {
    expect(subscriptionProCtaLabel({ isBasicServerTier: true })).toBe(
      'Upgrade to pro'
    );
  });

  it('shows Subscribe to Pro when not on the basic server tier', () => {
    expect(subscriptionProCtaLabel({ isBasicServerTier: false })).toBe(
      'Subscribe to Pro'
    );
  });
});

describe('isProSubscriptionTier', () => {
  it('is true when RevenueCat reports Pro', () => {
    expect(
      isProSubscriptionTier({ isPro: true, serverSubscriptionType: 'basic' })
    ).toBe(true);
  });

  it('is true when the server subscription type is pro', () => {
    expect(
      isProSubscriptionTier({ isPro: false, serverSubscriptionType: 'pro' })
    ).toBe(true);
    expect(
      isProSubscriptionTier({ isPro: false, serverSubscriptionType: 'Pro' })
    ).toBe(true);
  });

  it('is false for free/basic accounts without RevenueCat Pro', () => {
    expect(
      isProSubscriptionTier({ isPro: false, serverSubscriptionType: 'basic' })
    ).toBe(false);
    expect(
      isProSubscriptionTier({ isPro: false, serverSubscriptionType: null })
    ).toBe(false);
  });
});

describe('upgradeFromSubscriptionScreen', () => {
  it('presents the paywall then refreshes RC, profile, and auth user in order', async () => {
    const presentPaywall = jest.fn().mockResolvedValue(undefined);
    const refreshCustomerInfo = jest.fn().mockResolvedValue({});
    const fetchProfile = jest.fn().mockResolvedValue(undefined);
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await upgradeFromSubscriptionScreen({
      presentPaywall,
      refreshCustomerInfo,
      fetchProfile,
      refreshUser,
    });

    expect(presentPaywall).toHaveBeenCalledTimes(1);
    expect(refreshCustomerInfo).toHaveBeenCalledTimes(1);
    expect(fetchProfile).toHaveBeenCalledTimes(1);
    expect(refreshUser).toHaveBeenCalledTimes(1);

    expect(presentPaywall.mock.invocationCallOrder[0]).toBeLessThan(
      refreshCustomerInfo.mock.invocationCallOrder[0]
    );
    expect(refreshCustomerInfo.mock.invocationCallOrder[0]).toBeLessThan(
      fetchProfile.mock.invocationCallOrder[0]
    );
    expect(fetchProfile.mock.invocationCallOrder[0]).toBeLessThan(
      refreshUser.mock.invocationCallOrder[0]
    );
  });

  it('does not refresh state when the paywall fails', async () => {
    const paywallError = new Error('paywall failed');
    const presentPaywall = jest.fn().mockRejectedValue(paywallError);
    const refreshCustomerInfo = jest.fn().mockResolvedValue({});
    const fetchProfile = jest.fn().mockResolvedValue(undefined);
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await expect(
      upgradeFromSubscriptionScreen({
        presentPaywall,
        refreshCustomerInfo,
        fetchProfile,
        refreshUser,
      })
    ).rejects.toThrow('paywall failed');

    expect(presentPaywall).toHaveBeenCalledTimes(1);
    expect(refreshCustomerInfo).not.toHaveBeenCalled();
    expect(fetchProfile).not.toHaveBeenCalled();
    expect(refreshUser).not.toHaveBeenCalled();
  });
});
