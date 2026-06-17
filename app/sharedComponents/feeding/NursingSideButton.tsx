import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FEEDING_COLORS } from '@/app/constants/feedingTheme';

type NursingSide = 'left' | 'right';

type NursingSideButtonProps = {
  side: NursingSide;
  isRunning: boolean;
  showLastSideBadge: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const NursingSideButton: React.FC<NursingSideButtonProps> = ({
  side,
  isRunning,
  showLastSideBadge,
  onPress,
  disabled,
}) => (
  <View style={styles.wrapper}>
    {showLastSideBadge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Last Side</Text>
      </View>
    )}
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.circle, isRunning && styles.circleRunning]}
      accessibilityRole="button"
      accessibilityLabel={side === 'left' ? 'Left nursing timer' : 'Right nursing timer'}
    >
      <Ionicons
        name={isRunning ? 'stop-sharp' : 'play-sharp'}
        size={36}
        color={isRunning ? '#000000' : '#ffffff'}
        style={styles.icon}
      />
      <Text style={[styles.sideLabel, isRunning && styles.sideLabelRunning]}>
        {side.toUpperCase()}
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    left: 0,
    zIndex: 1,
    backgroundColor: FEEDING_COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#121b2b',
    fontSize: 11,
    fontWeight: '600',
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: FEEDING_COLORS.cardBackground,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: FEEDING_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRunning: {
    backgroundColor: FEEDING_COLORS.nursingCircle,
    borderStyle: 'solid',
    borderColor: FEEDING_COLORS.border,
  },
  icon: {
    marginBottom: 4,
  },
  sideLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sideLabelRunning: {
    color: '#000000',
  },
});

export default NursingSideButton;
