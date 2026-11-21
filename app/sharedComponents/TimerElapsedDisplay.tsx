import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { layout, lineHeightFor } from '@/app/constants/screenLayout';
import { formatDuration, splitElapsed } from '@/app/utils/timerHistory';

const DIGIT_LINE_HEIGHT = lineHeightFor(layout.font5xl);
const DEFAULT_DIGIT_TOP_PADDING = layout.space32 + layout.space16;

type TimerElapsedDisplayProps = {
  elapsedMs: number;
  /** Space above the digits; the timer screens leave room, Home does not. */
  digitTopPadding?: number;
};

type SegmentProps = {
  value: string;
  label: string;
  digitTopPadding: number;
};

const Segment: React.FC<SegmentProps> = ({ value, label, digitTopPadding }) => (
  <View className="items-center" style={{ minWidth: layout.space32 + layout.space32 + layout.space8, flexShrink: 0 }}>
    <Text
      className="text-white font-mono tracking-wider"
      style={{
        fontSize: layout.font5xl,
        lineHeight: DIGIT_LINE_HEIGHT,
        paddingTop: digitTopPadding,
      }}
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

const Colon: React.FC<{ digitTopPadding: number }> = ({ digitTopPadding }) => (
  <Text
    className="text-white font-mono tracking-wider"
    style={{
      fontSize: layout.font5xl,
      lineHeight: DIGIT_LINE_HEIGHT,
      paddingTop: digitTopPadding,
      paddingBottom: layout.space24,
    }}
  >
    :
  </Text>
);

const TimerElapsedDisplay: React.FC<TimerElapsedDisplayProps> = ({
  elapsedMs,
  digitTopPadding = DEFAULT_DIGIT_TOP_PADDING,
}) => {
  const { hours, minutes, seconds } = splitElapsed(elapsedMs);

  return (
    <View
      className="w-full items-center"
      style={{ paddingVertical: layout.space4 }}
      accessibilityLabel={`Elapsed time ${formatDuration(elapsedMs)}`}
    >
      <View className="flex-row items-start justify-center">
        <Segment value={hours} label="HOURS" digitTopPadding={digitTopPadding} />
        <Colon digitTopPadding={digitTopPadding} />
        <Segment value={minutes} label="MIN" digitTopPadding={digitTopPadding} />
        <Colon digitTopPadding={digitTopPadding} />
        <Segment value={seconds} label="SEC" digitTopPadding={digitTopPadding} />
      </View>
    </View>
  );
};

export default TimerElapsedDisplay;
