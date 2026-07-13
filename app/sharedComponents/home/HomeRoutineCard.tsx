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
  dimmed?: boolean;
};

const HomeRoutineCard: React.FC<HomeRoutineCardProps> = ({
  title,
  subtitle,
  iconName,
  onPress,
  accessibilityLabel,
  dimmed = false,
}) => (
  <Pressable
    className={homeRoutineCardClassName}
    style={dimmed ? { opacity: 0.45 } : undefined}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <View className="h-10 w-10 rounded-full border border-white bg-white items-center justify-center mr-3">
      <Ionicons name={iconName} size={20} color="#63488b" />
    </View>
    <VStack className="flex-1" space="xs">
      <Text className="text-white text-xl font-semibold">{title}</Text>
      <Text className="text-white/75 text-lg">{subtitle}</Text>
    </VStack>
    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
  </Pressable>
);

export default HomeRoutineCard;
