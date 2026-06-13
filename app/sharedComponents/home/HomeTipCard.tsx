import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { glassCardClassName } from '@/app/constants/screenLayout';

const HOME_TIP_DISMISSED_KEY = 'home_tip_dismissed';

const HomeTipCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    void (async () => {
      const dismissed = await AsyncStorage.getItem(HOME_TIP_DISMISSED_KEY);
      setIsVisible(dismissed !== 'true');
    })();
  }, []);

  const handleDismiss = useCallback(async () => {
    await AsyncStorage.setItem(HOME_TIP_DISMISSED_KEY, 'true');
    setIsVisible(false);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <View className={`${glassCardClassName} relative mb-2`}>
      <Pressable
        className="absolute top-3 right-3 z-10 p-1"
        onPress={() => void handleDismiss()}
        accessibilityRole="button"
        accessibilityLabel="Dismiss reminder"
        hitSlop={8}
      >
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.75)" />
      </Pressable>
      <Heading size="md" className="text-white pr-8">
        Reminder to Rest
      </Heading>
      <Text className="text-white/75 text-sm mt-2">
        Log sleep and feeding to get accurate next-nap predictions for your
        little one.
      </Text>
    </View>
  );
};

export default HomeTipCard;
