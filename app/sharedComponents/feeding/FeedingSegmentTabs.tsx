import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FEEDING_COLORS } from '@/app/constants/feedingTheme';

export type FeedingTab = 'nursing' | 'bottle';

type FeedingSegmentTabsProps = {
  activeTab: FeedingTab;
  onChange: (tab: FeedingTab) => void;
};

const FeedingSegmentTabs: React.FC<FeedingSegmentTabsProps> = ({
  activeTab,
  onChange,
}) => (
  <View style={styles.container}>
    {(['nursing', 'bottle'] as const).map((tab) => {
      const isActive = activeTab === tab;
      return (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={[styles.segment, isActive && styles.segmentActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive }}
        >
          <Text style={[styles.label, isActive && styles.labelActive]}>
            {tab === 'nursing' ? 'Nursing' : 'Bottle'}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: FEEDING_COLORS.border,
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  label: {
    color: FEEDING_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  labelActive: {
    color: '#000000',
  },
});

export default FeedingSegmentTabs;
