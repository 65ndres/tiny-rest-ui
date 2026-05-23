// src/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios, { AxiosError } from 'axios';
import { useNavigation } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL } from '../../constants/Config';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

type RootStackParamList = {
  Home: undefined;
  VerseModule: undefined;
  Login: undefined; // Added to allow navigation back to Login
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** JWT payload shape from your auth backend */
interface JwtPayload {
  id?: number;
  email?: string;
  onboarding_completed?: boolean;
  subscription_type?: string;
}

interface User {
  token: string;
  email?: string;
  id?: number;
  onboarding_completed?: boolean;
  subscription_type?: string;
}

/** Server validation error shape (e.g. Rails user.errors.full_messages) */
export interface SignupErrorResponse {
  message?: string;
  errors?: string[];
}

export type SignupResult = { success: true } | { success: false; errors: string[] };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, passwordConfirmation: string) => Promise<SignupResult>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface Verse {
  book: string;
  chapter: number;
  verse: number;
  liked: boolean;
  favorited: boolean;
  text: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          let onboardingCompleted: boolean | undefined;
          try {
            const payload = jwtDecode<JwtPayload>(token);
            onboardingCompleted = payload.onboarding_completed;
            const storedCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
            if (storedCompleted === 'true') {
              onboardingCompleted = true;
            }
            setUser({
              token,
              id: payload.id,
              email: payload.email,
              onboarding_completed: onboardingCompleted,
              subscription_type: payload.subscription_type,
            });
          } catch {
            setUser({ token });
          }
        }
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post<{
        token: string;
        user: { id: number; email: string; onboarding_completed?: boolean };
      }>(`${API_URL}/auth/login`, { email, password });
      const { token, user: userData } = response.data;
      await AsyncStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      let onboardingCompleted = userData.onboarding_completed;
      if (onboardingCompleted === undefined) {
        try {
          onboardingCompleted = jwtDecode<JwtPayload>(token).onboarding_completed;
        } catch {
          // keep undefined
        }
      }
      let subscriptionType: string | undefined;
      try {
        subscriptionType = jwtDecode<JwtPayload>(token).subscription_type;
      } catch {
        // ignore
      }
      setUser({
        token,
        id: userData.id,
        email: userData.email,
        onboarding_completed: onboardingCompleted,
        subscription_type: subscriptionType,
      });
      return true;
    } catch (e: unknown) {
      console.error('Login failed', e);
      return false;
    }
  };

  const signup = async (email: string, password: string, passwordConfirmation: string): Promise<SignupResult> => {
    try {
      const response = await axios.post<{
        token: string;
        user: { id: number; email: string; onboarding_completed?: boolean, subscription_type: string; };
      }>(`${API_URL}/auth/signup`, {
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      const { token, user: userData } = response.data;
      await AsyncStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({
        token,
        id: userData.id,
        email: userData.email,
        onboarding_completed: userData.onboarding_completed ?? false,
        subscription_type: "Nothing",
      });
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<SignupErrorResponse>;
      const data = axiosError.response?.data;
      const errors = Array.isArray(data?.errors) ? data.errors : [data?.message || 'Signup failed. Please try again.'];
      console.error('Signup failed', error);
      return { success: false, errors };
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setUser((prev) => (prev ? { ...prev, onboarding_completed: true } : null));
  };

  const logout = async (): Promise<void> => {
    // Even if the server rejects the token (e.g. invalid/expired),
    // we still want to clear the local session and show the unauthenticated UI.
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          await axios.delete(`${API_URL}/auth/logout`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (e: unknown) {
          // Ignore server-side logout failures; we still clear local auth below.
          const error = e as AxiosError<{ error?: string }>;
          console.warn('Logout request failed; clearing local session anyway', {
            status: error.response?.status,
            error: error.response?.data?.error,
          });
        }
      }
    } finally {
      try {
        await AsyncStorage.removeItem('token');
      } catch {
        // ignore
      }
      try {
        await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      } catch {
        // ignore
      }
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };


  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get<{
        token: string;
        user: { id: number; email: string; onboarding_completed?: boolean; subscription_type: string };
      }>(`${API_URL}/auth/refresh-user`);
      const { token, user: userData } = response.data;
      const payload = jwtDecode<JwtPayload>(token);
      const storedCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      let onboardingCompleted = payload.onboarding_completed ?? userData.onboarding_completed;
      if (storedCompleted === 'true') {
        onboardingCompleted = true;
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('subscription_type', payload.subscription_type ?? 'Nothing');
      await AsyncStorage.setItem(
        ONBOARDING_COMPLETED_KEY,
        onboardingCompleted === true ? 'true' : 'false'
      );
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser({
        token,
        id: userData.id,
        email: userData.email,
        onboarding_completed: onboardingCompleted === true,
        subscription_type: userData.subscription_type ?? payload.subscription_type,
      });
    } catch (e: unknown) {
      console.error('refresUser() failed', e);
    }
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const value: AuthContextType = { user, loading, login, signup, logout, completeOnboarding, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export for route compatibility
export default AuthProvider;