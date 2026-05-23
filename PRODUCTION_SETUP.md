# Production Setup Guide

This guide explains how to configure and build the sample-ui app for production.

## Environment Configuration

The app automatically detects the environment and uses the appropriate API URL:

- **Development**: `http://127.0.0.1:3000/api/v1`
- **Production**: `https://sample-api.example.com/api/v1`

The configuration is managed in `constants/Config.ts` and automatically switches based on the build type.

## Configuration File

The `constants/Config.ts` file exports:
- `API_URL`: The base API URL (automatically switches based on environment)
- `Config`: An object with environment flags and settings

## Building for Production

### Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project:
   ```bash
   eas build:configure
   ```

### Build Commands

#### Android Production Build
```bash
npm run build:android
# or
eas build --platform android --profile production
```

#### iOS Production Build
```bash
npm run build:ios
# or
eas build --platform ios --profile production
```

#### Build for Both Platforms
```bash
npm run build:all
# or
eas build --platform all --profile production
```

### Local Production Builds (for testing)

#### Android
```bash
npm run android:prod
```

#### iOS
```bash
npm run ios:prod
```

## Development vs Production

### Development Mode
- Uses localhost API (`http://127.0.0.1:3000/api/v1`)
- Debugging enabled
- Console logging enabled
- Hot reload available

### Production Mode
- Uses production API (`https://sample-api.example.com/api/v1`)
- Debugging disabled
- Console logging disabled
- Optimized builds

## Environment Detection

The app uses `__DEV__` flag and `expo-constants` to automatically detect the environment:
- Development builds: `__DEV__ === true`
- Production builds: `__DEV__ === false`

## Updating API URLs

To change the API URLs, edit `constants/Config.ts`:

```typescript
const DEVELOPMENT_API_URL = 'http://127.0.0.1:3000/api/v1';
const PRODUCTION_API_URL = 'https://your-production-api.com/api/v1';
```

## App Store Submission

### iOS (App Store)
1. Build the production app:
   ```bash
   eas build --platform ios --profile production
   ```

2. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```

### Android (Google Play Store)
1. Build the production app:
   ```bash
   eas build --platform android --profile production
   ```

2. Submit to Google Play:
   ```bash
   eas submit --platform android
   ```

## EAS Build Profiles

The `eas.json` file contains three build profiles:

1. **development**: For development builds with dev client
2. **preview**: For internal testing (APK/IPA)
3. **production**: For store submission (AAB/IPA)

## Version Management

Update the version in `app.json`:
```json
{
  "expo": {
    "version": "2.0.0"
  }
}
```

For iOS, also update the build number in `app.json`:
```json
{
  "expo": {
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

## Troubleshooting

### API URL not switching
- Ensure you're building a production build (not development)
- Check that `__DEV__` is `false` in production builds
- Verify `expo-constants` is installed

### Build fails
- Check EAS status: `eas build:list`
- Review build logs in Expo dashboard
- Ensure all credentials are properly configured

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

