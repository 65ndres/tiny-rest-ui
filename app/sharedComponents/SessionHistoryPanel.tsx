import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
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
import { homeRoutineCardClassName } from '@/app/constants/screenLayout';
import {
  deleteTimerRun,
  formatDuration,
  formatFeedingSessionDetails,
  formatFeedingSessionTitle,
  formatSessionClockTime,
  groupSessionsByDay,
  removeTimerSessionFromCache,
  type TimerSession,
} from '@/app/utils/timerHistory';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';

export type SessionHistoryVariant = 'sleep' | 'feeding';

type SessionHistoryPanelProps = {
  sessions: TimerSession[];
  isLoading: boolean;
  emptyMessage: string;
  variant?: SessionHistoryVariant;
  onSessionDeleted?: (sessionId: string) => void;
};

type MetaRowData = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

const isNumericId = (id: string): boolean => /^\d+$/.test(id);

const MetaRow = ({ iconName, label, value }: MetaRowData) => (
  <View className="flex-row items-center mt-1">
    <Ionicons
      name={iconName}
      size={16}
      color="#ffffff"
      style={{ marginRight: 6 }}
    />
    <Text className="text-white text-lg font-semibold">
      {label ? `${label} ${value}` : value}
    </Text>
  </View>
);

const buildSessionRows = (
  session: TimerSession,
  variant: SessionHistoryVariant
): MetaRowData[] => {
  const rows: MetaRowData[] = [];
  const createdAt = session.submitted_at ?? session.end_time;

  if (variant === 'feeding') {
    rows.push({
      iconName: 'water',
      label: '',
      value: formatFeedingSessionTitle(session),
    });

    const details = formatFeedingSessionDetails(session);
    if (details) {
      rows.push({
        iconName: 'information-circle',
        label: '',
        value: details,
      });
    }

    if (session.duration_ms > 0) {
      rows.push({
        iconName: 'time',
        label: 'Duration',
        value: formatDuration(session.duration_ms),
      });
    }
  } else {
    rows.push({
      iconName: 'time',
      label: 'Duration',
      value: formatDuration(session.duration_ms),
    });
  }

  rows.push({
    iconName: 'play',
    label: 'Start',
    value: formatSessionClockTime(session.start_time),
  });

  if (session.end_time) {
    rows.push({
      iconName: 'stop',
      label: 'End',
      value: formatSessionClockTime(session.end_time),
    });
  }

  rows.push({
    iconName: 'checkmark-circle',
    label: 'Created',
    value: formatSessionClockTime(createdAt),
  });

  return rows;
};

const SessionHistoryPanel: React.FC<SessionHistoryPanelProps> = ({
  sessions,
  isLoading,
  emptyMessage,
  variant = 'sleep',
  onSessionDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const dayGroups = useMemo(() => groupSessionsByDay(sessions), [sessions]);

  const performDelete = useCallback(
    async (sessionId: string) => {
      if (isDeleting) return;

      setIsDeleting(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (token && isNumericId(sessionId)) {
          await deleteTimerRun(token, Number(sessionId));
        }

        await removeTimerSessionFromCache(sessionId);
        onSessionDeleted?.(sessionId);
      } catch {
        Alert.alert('Error', 'Could not delete this entry. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, onSessionDeleted]
  );

  const confirmDelete = useCallback(
    (sessionId: string) => {
      Alert.alert(
        'Delete entry',
        'Are you sure you want to delete this session? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void performDelete(sessionId),
          },
        ]
      );
    },
    [performDelete]
  );

  return (
    <TimerSectionCard title="History">
      {isLoading ? (
        <Text className="text-white text-lg font-semibold">Loading...</Text>
      ) : null}

      {!isLoading && sessions.length === 0 ? (
        <Text className="text-white text-lg font-semibold">{emptyMessage}</Text>
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
                  <AccordionTitleText className="text-white text-xl font-bold">
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
                  {group.sessions.map((session) => (
                    <View
                      key={session.id}
                      className={homeRoutineCardClassName}
                    >
                      <VStack className="flex-1" space="xs">
                        {buildSessionRows(session, variant).map((row, index) => (
                          <MetaRow
                            key={`${session.id}-${row.label || row.value}-${index}`}
                            {...row}
                          />
                        ))}
                      </VStack>
                      <Pressable
                        accessibilityLabel="Delete entry"
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => confirmDelete(session.id)}
                        className="ml-2 self-start"
                      >
                        <Ionicons name="trash-outline" size={22} color="#ffffff" />
                      </Pressable>
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

export default SessionHistoryPanel;
