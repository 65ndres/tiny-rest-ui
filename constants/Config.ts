import Constants from 'expo-constants';

/**
 * Environment Configuration
 * Automatically switches between development and production based on build type
 */

// Determine if we're in development mode (__DEV__ is false in release builds)
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Use local API only when running in Expo Go / dev client
export const isExpoGo = Constants.executionEnvironment === 'storeClient';

// API Configuration
const DEVELOPMENT_API_URL = 'http://localhost:3000/api/v1'; //'https://97f8-173-239-254-51.ngrok-free.app/api/v1';
const PRODUCTION_API_URL = 'https://www.tiny-rest-app.com/api/v1'; //'https://www.tiny-rest-app.com/api/v1';

// Export the appropriate API URL based on environment
export const API_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// Additional configuration
export const Config = {
  API_URL,
  isDevelopment,
  isExpoGo,
  isProduction,
  // Add other environment-specific configs here
  enableLogging: isDevelopment,
  enableDebugMode: isDevelopment,
} as const;

// Log the current environment (only in development)
if (isDevelopment) {
  console.log(`🔧 Environment: Development`);
  console.log(`🌐 API URL: ${API_URL}`);
}
