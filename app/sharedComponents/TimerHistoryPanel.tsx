import React from 'react';
import { View } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { cardClassName, mutedTextClassName } from '@/app/constants/screenLayout';
import {
  formatDuration,
  formatSessionTime,
  type TimerSession,
} from '@/app/utils/timerHistory';

type TimerHistoryPanelProps = {
  sessions: TimerSession[];
  isLoading: boolean;
};

const TimerHistoryPanel: React.FC<TimerHistoryPanelProps> = ({
  sessions,
  isLoading,
}) => (
  <VStack className={cardClassName}>
    <Heading size="lg" className="text-white">
      History
    </Heading>

    {isLoading ? (
      <Text className={`${mutedTextClassName} mt-4`}>Loading...</Text>
    ) : null}

    {!isLoading && sessions.length === 0 ? (
      <Text className={`${mutedTextClassName} mt-4`}>
        No submitted timers yet.
      </Text>
    ) : null}

    {!isLoading && sessions.length > 0 ? (
      <VStack className="mt-4 w-full" space="md">
        {sessions.map((session, index) => (
          <View key={session.id}>
            {index > 0 ? (
              <View className="border-t border-white/30 mb-4" />
            ) : null}
            <Text className="text-white text-lg">
              Start: {formatSessionTime(session.start_time)}
            </Text>
            <Text className="text-white text-lg mt-1">
              End: {formatSessionTime(session.end_time)}
            </Text>
            <Text className="text-white text-2xl mt-2 font-mono tracking-wider">
              Duration: {formatDuration(session.duration_ms)}
            </Text>
          </View>
        ))}
      </VStack>
    ) : null}
  </VStack>
);

export default TimerHistoryPanel;
