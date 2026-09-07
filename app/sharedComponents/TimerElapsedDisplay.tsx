import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { layout } from '@/app/constants/screenLayout';
import { formatDuration, splitElapsed } from '@/app/utils/timerHistory';

type TimerElapsedDisplayProps = {
  elapsedMs: number;
};

type SegmentProps = {
  value: string;
  label: string;
};

const Segment: React.FC<SegmentProps> = ({ value, label }) => (
  <View className="items-center" style={{ minWidth: layout.space32 + layout.space32 + layout.space8, flexShrink: 0 }}>
    <Text
      className="text-white font-mono tracking-wider"
      style={{ fontSize: layout.font5xl, paddingTop: layout.space32 + layout.space16 }}
    >
      {value}
    </Text>
    <Text
      className="text-white/75"
      style={{ fontSize: layout.fontSm, marginTop: layout.space8 }}
    >
      {label}
    </Text>
  </View>
);

const Colon: React.FC = () => (
  <Text
    className="text-white font-mono tracking-wider"
    style={{
      fontSize: layout.font5xl,
      paddingTop: layout.space32 + layout.space16,
      paddingBottom: layout.space24,
    }}
  >
    :
  </Text>
);

const TimerElapsedDisplay: React.FC<TimerElapsedDisplayProps> = ({ elapsedMs }) => {
  const { hours, minutes, seconds } = splitElapsed(elapsedMs);

  return (
    <View
      className="w-full items-center"
      style={{ paddingVertical: layout.space4 }}
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
