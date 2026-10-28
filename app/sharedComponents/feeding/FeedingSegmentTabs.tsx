import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { layout } from '@/app/constants/screenLayout';

export type FeedingTab = 'nursing' | 'bottle';

type SegmentTab<T extends string> = { id: T; label: string };

type FeedingSegmentTabsProps<T extends string> = {
  activeTab: T;
  onChange: (tab: T) => void;
  /** Defaults to the Nursing / Bottle tabs. */
  tabs?: SegmentTab<T>[];
};

const TABS: SegmentTab<FeedingTab>[] = [
  { id: 'nursing', label: 'Nursing' },
  { id: 'bottle', label: 'Bottle' },
];

const FeedingSegmentTabs = <T extends string = FeedingTab>({
  activeTab,
  onChange,
  tabs = TABS as unknown as SegmentTab<T>[],
}: FeedingSegmentTabsProps<T>) => (
  <View
    className="w-full flex-row items-stretch border-b border-white/20"
    style={{ marginBottom: layout.space16 }}
  >
    {tabs.map((tab, index) => {
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
              numberOfLines={1}
              adjustsFontSizeToFit
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
