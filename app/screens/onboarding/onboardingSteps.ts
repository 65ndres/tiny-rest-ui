/**
 * Stable onboarding step keys. Append new keys when adding slides —
 * keep order in sync with OnboardingScreen pages.
 */
export const ONBOARDING_STEPS = [
  'problem',
  'outcome',
  'baby_profile',
  'nap_count',
  'trust',
  'paywall',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const isOnboardingStep = (value: string): value is OnboardingStep =>
  (ONBOARDING_STEPS as readonly string[]).includes(value);

/** Page index to open after the given completed step (next unfinished slide). */
export const resumePageIndex = (
  lastCompletedStep: string | null | undefined
): number => {
  if (!lastCompletedStep || !isOnboardingStep(lastCompletedStep)) {
    return 0;
  }

  const completedIndex = ONBOARDING_STEPS.indexOf(lastCompletedStep);
  return Math.min(completedIndex + 1, ONBOARDING_STEPS.length - 1);
};
