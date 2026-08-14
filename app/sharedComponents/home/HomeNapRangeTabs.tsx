import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatExactNapCount } from '@/app/utils/napSchedule';

type HomeNapRangeTabsProps = {
  counts: number[];
  activeCount: number;
  onChange: (count: number) => void;
  disabled?: boolean;
};

const HomeNapRangeTabs: React.FC<HomeNapRangeTabsProps> = ({
  counts,
  activeCount,
  onChange,
  disabled = false,
}) => {
  const tabs = counts.map((count) => ({
    id: count,
    label: formatExactNapCount(count),
  }));

  return (
    <View
      className={`w-full flex-row items-stretch border-b border-white/20 mb-4 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {tabs.map((tab, index) => {
        const isActive = activeCount === tab.id;
        return (
          <React.Fragment key={tab.id}>
            {index > 0 ? (
              <View className="w-px bg-white/20 self-stretch my-1" />
            ) : null}
            <Pressable
              className={`flex-1 items-center justify-center py-3 ${
                disabled ? '' : 'active:opacity-80'
              }`}
              onPress={() => {
                if (!disabled) onChange(tab.id);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled }}
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
};

export default HomeNapRangeTabs;
