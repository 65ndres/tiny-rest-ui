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
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { mutedTextClassName } from '@/app/constants/screenLayout';
import {
  formatDuration,
  formatSessionClockTime,
  groupSessionsByDay,
  type TimerSession,
} from '@/app/utils/timerHistory';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';

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
    <TimerSectionCard title="History">
      {isLoading ? (
        <Text className={mutedTextClassName}>Loading...</Text>
      ) : null}

      {!isLoading && sessions.length === 0 ? (
        <Text className={mutedTextClassName}>
          No submitted timers yet.
        </Text>
      ) : null}

      {!isLoading && dayGroups.length > 0 ? (
        <Accordion
          type="multiple"
          variant="unfilled"
          isCollapsible
          defaultValue={[]}
          className="w-full"
        >
          {dayGroups.map((group, groupIndex) => (
            <AccordionItem
              key={group.dayKey}
              value={group.dayKey}
              className={
                groupIndex > 0 ? 'border-t border-white/20' : undefined
              }
            >
              <AccordionHeader>
                <AccordionTrigger className="px-0 py-3 bg-transparent data-[focus-visible=true]:bg-transparent">
                  <AccordionTitleText className="text-white text-base font-semibold">
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
                      <Text className="text-white text-xl font-mono tracking-wider">
                        {formatDuration(session.duration_ms)}
                      </Text>
                      <Text className={`${mutedTextClassName} mt-2 text-sm`}>
                        Start: {formatSessionClockTime(session.start_time)}
                      </Text>
                      <Text className={`${mutedTextClassName} mt-1 text-sm`}>
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
    </TimerSectionCard>
  );
};

export default TimerHistoryPanel;
