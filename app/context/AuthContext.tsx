// src/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios, { AxiosError } from 'axios';
import { useNavigation } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL } from '../../constants/Config';
import { clearLocalOnboardingStep } from '@/app/utils/onboardingProgress';
import {
  setWidgetAuthenticated,
  setWidgetLoggedOut,
} from '@/app/utils/widgetStorage';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

type RootStackParamList = {
  Home: undefined;
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

export type SignupResult =
  | { success: true; needsVerification: true; email: string }
  | { success: true; needsVerification: false }
  | { success: false; errors: string[] };

export type VerifySignupResult =
  | { success: true }
  | { success: false; error: string };

export type ResendSignupCodeResult =
  | { success: true; message: string }
  | { success: false; error: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, passwordConfirmation: string) => Promise<SignupResult>;
  verifySignup: (email: string, code: string) => Promise<VerifySignupResult>;
  resendSignupCode: (email: string) => Promise<ResendSignupCodeResult>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
            setWidgetAuthenticated();
          } catch {
            setUser({ token });
            setWidgetAuthenticated();
          }
        } else {
          setWidgetLoggedOut();
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
        user: {
          id: number;
          email: string;
          onboarding_completed?: boolean;
          subscription_type?: string;
        };
      }>(`${API_URL}/auth/login`, { email, password });
      const { token, user: userData } = response.data;
      await applySession(token, userData);
      return true;
    } catch (e: unknown) {
      console.error('Login failed', e);
      return false;
    }
  };

  const applySession = async (
    token: string,
    userData: {
      id: number;
      email: string;
      onboarding_completed?: boolean;
      subscription_type?: string;
    }
  ): Promise<void> => {
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

    let subscriptionType = userData.subscription_type;
    if (subscriptionType === undefined) {
      try {
        subscriptionType = jwtDecode<JwtPayload>(token).subscription_type;
      } catch {
        // ignore
      }
    }

    setUser({
      token,
      id: userData.id,
      email: userData.email,
      onboarding_completed: onboardingCompleted,
      subscription_type: subscriptionType,
    });
    setWidgetAuthenticated();
  };

  const signup = async (
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<SignupResult> => {
    try {
      const response = await axios.post<{
        message?: string;
        email?: string;
        needs_verification?: boolean;
        token?: string;
        user?: {
          id: number;
          email: string;
          onboarding_completed?: boolean;
          subscription_type?: string;
        };
      }>(`${API_URL}/auth/signup`, {
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      // Production: email confirmation required. Non-production: API returns a session token.
      if (response.data.token && response.data.user) {
        await applySession(response.data.token, response.data.user);
        return { success: true, needsVerification: false };
      }

      return {
        success: true,
        needsVerification: true,
        email: response.data.email || email.toLowerCase(),
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<SignupErrorResponse>;
      const data = axiosError.response?.data;
      const errors = Array.isArray(data?.errors)
        ? data.errors
        : [data?.message || 'Signup failed. Please try again.'];
      console.error('Signup failed', error);
      return { success: false, errors };
    }
  };

  const verifySignup = async (
    email: string,
    code: string
  ): Promise<VerifySignupResult> => {
    try {
      const response = await axios.post<{
        token: string;
        user: {
          id: number;
          email: string;
          onboarding_completed?: boolean;
          subscription_type?: string;
        };
      }>(`${API_URL}/auth/signup/verify`, { email, code });
      const { token, user: userData } = response.data;
      await applySession(token, userData);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const message =
        axiosError.response?.data?.error || 'Invalid or expired code';
      console.error('Signup verification failed', error);
      return { success: false, error: message };
    }
  };

  const resendSignupCode = async (email: string): Promise<ResendSignupCodeResult> => {
    try {
      const response = await axios.post<{ message: string }>(
        `${API_URL}/auth/signup/resend`,
        { email }
      );
      return {
        success: true,
        message:
          response.data.message ||
          'If an unverified account with that email exists, you will receive a verification code.',
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const message =
        axiosError.response?.data?.error || 'Could not resend verification code.';
      console.error('Resend signup code failed', error);
      return { success: false, error: message };
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    await clearLocalOnboardingStep();
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
      try {
        await clearLocalOnboardingStep();
      } catch {
        // ignore
      }
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setWidgetLoggedOut();
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

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    verifySignup,
    resendSignupCode,
    logout,
    completeOnboarding,
    refreshUser,
  };

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