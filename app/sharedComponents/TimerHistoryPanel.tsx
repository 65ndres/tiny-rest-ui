import React, { useMemo } from 'react';
import { View } from 'react-native';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionIcon,
  AccordionItem,
  AccordionTitleText,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronDownIcon } from '@/components/ui/icon';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { cardClassName, mutedTextClassName } from '@/app/constants/screenLayout';
import {
  formatDuration,
  formatSessionClockTime,
  groupSessionsByDay,
  type TimerSession,
} from '@/app/utils/timerHistory';

type TimerHistoryPanelProps = {
  sessions: TimerSession[];
  isLoading: boolean;
};

const TimerHistoryPanel: React.FC<TimerHistoryPanelProps> = ({
  sessions,
  isLoading,
}) => {
  const dayGroups = useMemo(() => groupSessionsByDay(sessions), [sessions]);

  return (
    <VStack className={cardClassName}>
      <Heading size="xl" className="text-white">
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

      {!isLoading && dayGroups.length > 0 ? (
        <Accordion
          type="multiple"
          variant="unfilled"
          isCollapsible
          defaultValue={[]}
          className="mt-4 w-full"
        >
          {dayGroups.map((group, groupIndex) => (
            <AccordionItem
              key={group.dayKey}
              value={group.dayKey}
              className={
                groupIndex > 0 ? 'border-t border-white/30' : undefined
              }
            >
              <AccordionHeader>
                <AccordionTrigger className="px-0 py-3 bg-transparent data-[focus-visible=true]:bg-transparent">
                  <AccordionTitleText className="text-white text-lg font-semibold">
                    {group.label}
                  </AccordionTitleText>
                  <AccordionIcon
                    as={ChevronDownIcon}
                    className="text-white"
                    size="md"
                  />
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="px-0 pb-2">
                <VStack space="md">
                  {group.sessions.map((session, sessionIndex) => (
                    <View key={session.id}>
                      {sessionIndex > 0 ? (
                        <View className="border-t border-white/20 mb-4" />
                      ) : null}
                      <Text className="text-white text-2xl font-mono tracking-wider">
                        {formatDuration(session.duration_ms)}
                      </Text>
                      <Text className={`${mutedTextClassName} mt-2`}>
                        Start: {formatSessionClockTime(session.start_time)}
                      </Text>
                      <Text className={`${mutedTextClassName} mt-1`}>
                        End: {formatSessionClockTime(session.end_time)}
                      </Text>
                    </View>
                  ))}
                </VStack>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}
    </VStack>
  );
};

export default TimerHistoryPanel;
