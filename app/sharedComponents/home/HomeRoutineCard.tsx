import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  homeRoutineCardClassName,
  homeRoutineCardStyle,
  layout,
} from '@/app/constants/screenLayout';

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
    style={[homeRoutineCardStyle, dimmed ? { opacity: 0.45 } : undefined]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <View
      className="rounded-full border border-white bg-white items-center justify-center"
      style={{
        height: layout.iconCircle,
        width: layout.iconCircle,
        marginRight: layout.space12,
      }}
    >
      <Ionicons name={iconName} size={layout.iconLg} color="#63488b" />
    </View>
    <VStack className="flex-1" style={{ gap: layout.space4 }}>
      <Text className="text-white font-semibold" style={{ fontSize: layout.fontXl }}>
        {title}
      </Text>
      <Text className="text-white/75" style={{ fontSize: layout.fontLg }}>
        {subtitle}
      </Text>
    </VStack>
    <Ionicons
      name="chevron-forward"
      size={layout.iconMd}
      color="rgba(255,255,255,0.5)"
    />
  </Pressable>
);

export default HomeRoutineCard;
