export type SyncProSubscriptionDeps = {
  createProSubscription: () => Promise<void>;
  refreshUser: () => Promise<void>;
  onCreateError?: (error: unknown) => void;
  onRefreshError?: (error: unknown) => void;
};

/**
 * After a Pro purchase/restore, persist to the app backend then refresh auth user
 * so screens that read `user.subscription_type` update immediately.
 * Always attempts refreshUser even if createProSubscription fails.
 */
export async function syncProSubscriptionToApp(
  deps: SyncProSubscriptionDeps
): Promise<void> {
  try {
    await deps.createProSubscription();
  } catch (error) {
    deps.onCreateError?.(error);
  }

  try {
    await deps.refreshUser();
  } catch (error) {
    deps.onRefreshError?.(error);
  }
}
