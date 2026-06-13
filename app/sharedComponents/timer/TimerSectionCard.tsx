import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  glassCardClassName,
  timerSectionLabelClassName,
} from '@/app/constants/screenLayout';

type TimerSectionCardProps = {
  title?: string;
  titleClassName?: string;
  showAccent?: boolean;
  children: React.ReactNode;
};

const TimerGradientAccent: React.FC = () => (
  <View className="w-2 h-20 rounded-full mr-3 overflow-hidden justify-between">
    <View className="h-[32%] bg-white/20 rounded-t-full" />
    <View className="h-[32%] bg-white/35" />
    <View className="h-[32%] bg-white/50 rounded-b-full" />
  </View>
);

const TimerSectionCard: React.FC<TimerSectionCardProps> = ({
  title,
  titleClassName,
  showAccent = false,
  children,
}) => (
  <View className={`${glassCardClassName} flex-row`}>
    {showAccent ? <TimerGradientAccent /> : null}
    <VStack className="flex-1">
      {title ? (
        <Text className={titleClassName ?? timerSectionLabelClassName}>{title}</Text>
      ) : null}
      {children}
    </VStack>
  </View>
);

export default TimerSectionCard;
