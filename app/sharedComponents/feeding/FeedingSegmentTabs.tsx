import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { layout } from '@/app/constants/screenLayout';

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
  <View
    className="w-full flex-row items-stretch border-b border-white/20"
    style={{ marginBottom: layout.space16 }}
  >
    {TABS.map((tab, index) => {
      const isActive = tab.id === activeTab;
      return (
        <React.Fragment key={tab.id}>
          {index > 0 ? (
            <View
              className="bg-white/20 self-stretch"
              style={{ width: 1, marginVertical: layout.space4 }}
            />
          ) : null}
          <Pressable
            className="flex-1 items-center justify-center active:opacity-80"
            style={{ paddingVertical: layout.space12 }}
            onPress={() => onChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text
              style={{
                fontSize: layout.fontXl,
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                fontWeight: isActive ? '600' : '400',
              }}
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
