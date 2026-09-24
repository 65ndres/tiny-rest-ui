import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type TinyRestLiveActivityNativeModule = {
  sync(
    startTime: string,
    timerType: string,
    isPaused: boolean,
    elapsedSeconds: number
  ): Promise<boolean>;
  end(): Promise<void>;
};

const nativeModule =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<TinyRestLiveActivityNativeModule>(
        'TinyRestLiveActivity'
      )
    : null;

export const syncLiveActivity = async (
  startTime: string,
  timerType: string,
  isPaused: boolean,
  elapsedMs: number
): Promise<void> => {
  if (!nativeModule) return;
  await nativeModule.sync(
    startTime,
    timerType,
    isPaused,
    Math.max(0, elapsedMs / 1000)
  );
};

export const endLiveActivity = async (): Promise<void> => {
  if (!nativeModule) return;
  await nativeModule.end();
};
