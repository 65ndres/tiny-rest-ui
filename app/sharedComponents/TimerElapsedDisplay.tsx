import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatDuration, splitElapsed } from '@/app/utils/timerHistory';

type TimerElapsedDisplayProps = {
  elapsedMs: number;
};

type SegmentProps = {
  value: string;
  label: string;
};

const Segment: React.FC<SegmentProps> = ({ value, label }) => (
  <View className="items-center min-w-[72px]">
    <Text className="text-white text-5xl font-mono tracking-wider">{value}</Text>
    <Text className="text-white/75 text-sm mt-2">{label}</Text>
  </View>
);

const Colon: React.FC = () => (
  <Text className="text-white text-5xl font-mono tracking-wider pb-6">:</Text>
);

const TimerElapsedDisplay: React.FC<TimerElapsedDisplayProps> = ({ elapsedMs }) => {
  const { hours, minutes, seconds } = splitElapsed(elapsedMs);

  return (
    <View
      className="w-full items-center py-1"
      accessibilityLabel={`Elapsed time ${formatDuration(elapsedMs)}`}
    >
      <View className="flex-row items-start justify-center">
        <Segment value={hours} label="HOURS" />
        <Colon />
        <Segment value={minutes} label="MIN" />
        <Colon />
        <Segment value={seconds} label="SEC" />
      </View>
    </View>
  );
};

export default TimerElapsedDisplay;
