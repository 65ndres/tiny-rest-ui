import axios from 'axios';
import { API_URL } from '@/constants/Config';
import {
  DEFAULT_DAY_END_MINUTES,
  DEFAULT_DAY_START_MINUTES,
  normalizeDayMinutes,
} from '@/app/utils/dayWindow';

export type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  subscription_type?: string;
  baby_name: string | null;
  baby_birthdate: string | null;
  daily_nap_count: number;
  day_start_minutes: number;
  day_end_minutes: number;
};

export type UserProfileUpdate = Partial<{
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  baby_name: string | null;
  baby_birthdate: string | null;
  daily_nap_count: number;
  day_start_minutes: number;
  day_end_minutes: number;
  password: string;
  password_confirmation: string;
}>;

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  const response = await axios.get<UserProfile>(`${API_URL}/user`, {
    headers: authHeaders(token),
  });
  return {
    ...response.data,
    baby_birthdate: response.data.baby_birthdate ?? null,
    daily_nap_count: response.data.daily_nap_count ?? 3,
    day_start_minutes: normalizeDayMinutes(
      response.data.day_start_minutes,
      DEFAULT_DAY_START_MINUTES
    ),
    day_end_minutes: normalizeDayMinutes(
      response.data.day_end_minutes,
      DEFAULT_DAY_END_MINUTES
    ),
  };
};

export const updateUserProfile = async (
  token: string,
  updates: UserProfileUpdate
): Promise<UserProfile & { message?: string }> => {
  const response = await axios.post<UserProfile & { message?: string }>(
    `${API_URL}/user`,
    { user: updates },
    { headers: authHeaders(token) }
  );
  return response.data;
};

export type ChangePasswordAndSignOutDeps = {
  token: string;
  password: string;
  updateUserProfile: (
    token: string,
    updates: UserProfileUpdate
  ) => Promise<unknown>;
  logout: () => Promise<void>;
};

/**
 * Persist a new password, then sign out so the user must sign in again.
 * Does not call logout if the password update fails.
 */
export async function changePasswordAndSignOut(
  deps: ChangePasswordAndSignOutDeps
): Promise<void> {
  await deps.updateUserProfile(deps.token, {
    password: deps.password,
    password_confirmation: deps.password,
  });
  await deps.logout();
}
