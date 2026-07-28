import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@/constants/Config';
import {
  isOnboardingStep,
  type OnboardingStep,
} from '@/app/screens/onboarding/onboardingSteps';

const LOCAL_STEP_KEY = 'onboarding_last_completed_step';

export type OnboardingProgress = {
  id: number;
  completed_at: string | null;
  last_completed_step: string | null;
  allowed_steps: string[];
};

type OnboardingResponse = {
  onboarding: OnboardingProgress;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const getLocalOnboardingStep = async (): Promise<OnboardingStep | null> => {
  const value = await AsyncStorage.getItem(LOCAL_STEP_KEY);
  if (!value || !isOnboardingStep(value)) return null;
  return value;
};

export const setLocalOnboardingStep = async (
  step: OnboardingStep
): Promise<void> => {
  await AsyncStorage.setItem(LOCAL_STEP_KEY, step);
};

export const clearLocalOnboardingStep = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOCAL_STEP_KEY);
};

export const fetchOnboardingProgress = async (
  token: string
): Promise<OnboardingProgress> => {
  const response = await axios.get<OnboardingResponse>(`${API_URL}/onboarding`, {
    headers: authHeaders(token),
  });
  return response.data.onboarding;
};

export const saveOnboardingStep = async (
  token: string,
  step: OnboardingStep
): Promise<OnboardingProgress | null> => {
  // Persist locally first so a force-quit still resumes correctly.
  await setLocalOnboardingStep(step);

  try {
    const response = await axios.patch<OnboardingResponse>(
      `${API_URL}/onboarding`,
      { last_completed_step: step },
      { headers: authHeaders(token) }
    );
    return response.data.onboarding;
  } catch {
    return null;
  }
};

/** Prefer server progress; fall back to local cache. */
export const resolveLastCompletedStep = async (
  token: string | null
): Promise<string | null> => {
  const localStep = await getLocalOnboardingStep();

  if (!token) return localStep;

  try {
    const onboarding = await fetchOnboardingProgress(token);
    if (onboarding.last_completed_step) {
      if (isOnboardingStep(onboarding.last_completed_step)) {
        await setLocalOnboardingStep(onboarding.last_completed_step);
      }
      return onboarding.last_completed_step;
    }
  } catch {
    // Use local cache below.
  }

  return localStep;
};
