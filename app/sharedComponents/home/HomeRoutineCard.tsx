import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  homeRoutineCardClassName,
  homeRoutineCardStyle,
  layout,
} from '@/app/constants/screenLayout';

const SUBTITLE_MAX_FONT_SCALE = 1.05;

type HomeRoutineCardProps = {
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
};

const HomeRoutineCard: React.FC<HomeRoutineCardProps> = ({
  title,
  subtitle,
  iconName,
  onPress,
  accessibilityLabel,
  dimmed = false,
  style,
}) => (
  <Pressable
    className={homeRoutineCardClassName}
    style={[homeRoutineCardStyle, style, dimmed ? { opacity: 0.45 } : undefined]}
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
      {/* One line each. The longer subtitle grows less with the system text
          size so it still fits on narrow phones. */}
      <Text
        className="text-white font-semibold"
        numberOfLines={1}
        style={{ fontSize: layout.fontXl }}
      >
        {title}
      </Text>
      <Text
        className="text-white/75"
        numberOfLines={1}
        maxFontSizeMultiplier={SUBTITLE_MAX_FONT_SCALE}
        style={{ fontSize: layout.fontLg }}
      >
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
