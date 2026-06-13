import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { homeRoutineCardClassName } from '@/app/constants/screenLayout';

type HomeRoutineCardProps = {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
};

const HomeRoutineCard: React.FC<HomeRoutineCardProps> = ({
  title,
  subtitle,
  iconName,
  onPress,
  accessibilityLabel,
}) => (
  <Pressable
    className={homeRoutineCardClassName}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <View className="h-10 w-10 rounded-full border border-white/20 bg-white/10 items-center justify-center mr-3">
      <Ionicons name={iconName} size={20} color="white" />
    </View>
    <VStack className="flex-1" space="xs">
      <Text className="text-white text-base font-semibold">{title}</Text>
      <Text className="text-white/75 text-sm">{subtitle}</Text>
    </VStack>
    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
  </Pressable>
);

export default HomeRoutineCard;
