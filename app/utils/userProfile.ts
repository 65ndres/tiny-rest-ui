import axios from 'axios';
import { API_URL } from '@/constants/Config';

export type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  subscription_type?: string;
  baby_name: string | null;
  daily_nap_count: number;
};

export type UserProfileUpdate = Partial<{
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  baby_name: string | null;
  daily_nap_count: number;
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
    daily_nap_count: response.data.daily_nap_count ?? 3,
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
