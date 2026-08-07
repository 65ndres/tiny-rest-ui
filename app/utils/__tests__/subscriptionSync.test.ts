import { syncProSubscriptionToApp } from '../subscriptionSync';

describe('syncProSubscriptionToApp', () => {
  it('creates pro subscription then refreshes the user', async () => {
    const createProSubscription = jest.fn().mockResolvedValue(undefined);
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await syncProSubscriptionToApp({ createProSubscription, refreshUser });

    expect(createProSubscription).toHaveBeenCalledTimes(1);
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(createProSubscription.mock.invocationCallOrder[0]).toBeLessThan(
      refreshUser.mock.invocationCallOrder[0]
    );
  });

  it('still refreshes the user when createProSubscription fails', async () => {
    const createError = new Error('sync failed');
    const createProSubscription = jest.fn().mockRejectedValue(createError);
    const refreshUser = jest.fn().mockResolvedValue(undefined);
    const onCreateError = jest.fn();

    await syncProSubscriptionToApp({
      createProSubscription,
      refreshUser,
      onCreateError,
    });

    expect(onCreateError).toHaveBeenCalledWith(createError);
    expect(refreshUser).toHaveBeenCalledTimes(1);
  });

  it('reports refresh errors without throwing', async () => {
    const refreshError = new Error('refresh failed');
    const createProSubscription = jest.fn().mockResolvedValue(undefined);
    const refreshUser = jest.fn().mockRejectedValue(refreshError);
    const onRefreshError = jest.fn();

    await expect(
      syncProSubscriptionToApp({
        createProSubscription,
        refreshUser,
        onRefreshError,
      })
    ).resolves.toBeUndefined();

    expect(onRefreshError).toHaveBeenCalledWith(refreshError);
  });
});
