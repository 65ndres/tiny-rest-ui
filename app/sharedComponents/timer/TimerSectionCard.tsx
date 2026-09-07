import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassCardClassName,
  glassCardStyle,
  layout,
  timerSectionLabelClassName,
  timerSectionLabelStyle,
} from '@/app/constants/screenLayout';

type TimerSectionCardProps = {
  title?: string;
  titleClassName?: string;
  titleStyle?: object;
  showAccent?: boolean;
  children: React.ReactNode;
};

const TimerGradientAccent: React.FC = () => (
  <View
    className="rounded-full overflow-hidden justify-between"
    style={{
      width: layout.space8,
      height: layout.tileMinHeight,
      marginRight: layout.space12,
    }}
  >
    <View className="h-[32%] bg-white/20 rounded-t-full" />
    <View className="h-[32%] bg-white/35" />
    <View className="h-[32%] bg-white/50 rounded-b-full" />
  </View>
);

const TimerSectionCard: React.FC<TimerSectionCardProps> = ({
  title,
  titleClassName,
  titleStyle,
  showAccent = false,
  children,
}) => (
  <View
    className={`${glassCardClassName}${showAccent ? ' flex-row' : ''}`}
    style={[
      glassCardStyle,
      showAccent ? { alignItems: 'flex-start' } : null,
    ]}
  >
    {showAccent ? <TimerGradientAccent /> : null}
    <VStack className={showAccent ? 'flex-1' : 'w-full'} style={{ flexShrink: 0 }}>
      {title ? (
        <Text
          className={titleClassName ?? timerSectionLabelClassName}
          style={titleStyle ?? timerSectionLabelStyle}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </VStack>
  </View>
);

export default TimerSectionCard;
