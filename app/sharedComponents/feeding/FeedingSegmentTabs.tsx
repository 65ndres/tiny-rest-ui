import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

export type FeedingTab = 'nursing' | 'bottle';

type FeedingSegmentTabsProps = {
  activeTab: FeedingTab;
  onChange: (tab: FeedingTab) => void;
};

const TABS: { id: FeedingTab; label: string }[] = [
  { id: 'nursing', label: 'Nursing' },
  { id: 'bottle', label: 'Bottle' },
];

const FeedingSegmentTabs: React.FC<FeedingSegmentTabsProps> = ({
  activeTab,
  onChange,
}) => (
  <View className="w-full flex-row items-stretch border-b border-white/20 mb-4">
    {TABS.map((tab, index) => {
      const isActive = activeTab === tab.id;
      return (
        <React.Fragment key={tab.id}>
          {index > 0 ? (
            <View className="w-px bg-white/20 self-stretch my-1" />
          ) : null}
          <Pressable
            className="flex-1 items-center justify-center py-3 active:opacity-80"
            onPress={() => onChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text
              className={`text-xl ${
                isActive ? 'text-white font-semibold' : 'text-white/50'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        </React.Fragment>
      );
    })}
  </View>
);

export default FeedingSegmentTabs;
