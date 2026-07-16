import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CalendarProvider,
  TimelineEventProps,
  TimelineList,
  TimelinePackedEventProps,
  WeekCalendar,
} from 'react-native-calendars';
import {
  buildMarkedDatesFromEvents,
  buildTimelineEventsByDate,
  deleteTimerRun,
  fetchTimerRunsInRange,
  filterSessionsInRange,
  filterTimelineSessions,
  formatDateParam,
  formatSessionClockTime,
  getBufferedWeekRange,
  getWeekRangeForDate,
  loadTimerHistoryFromCache,
  mergeTimelineEventsByDate,
  removeTimerSessionFromCache,
  type TimerSession,
} from '@/app/utils/timerHistory';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';

const calendarTheme = {
  backgroundColor: 'transparent',
  calendarBackground: 'transparent',
  textSectionTitleColor: 'rgba(255,255,255,0.75)',
  selectedDayBackgroundColor: '#ffffff',
  selectedDayTextColor: '#000000',
  todayTextColor: '#ffffff',
  dayTextColor: '#ffffff',
  textDisabledColor: 'rgba(255,255,255,0.35)',
  dotColor: '#4ade80',
  selectedDotColor: '#000000',
  arrowColor: '#ffffff',
  monthTextColor: '#ffffff',
  indicatorColor: '#ffffff',
  expandableKnobColor: 'rgba(255,255,255,0.45)',
  textDayFontWeight: '400' as const,
  textMonthFontWeight: '500' as const,
  textDayHeaderFontWeight: '500' as const,
};

const timelineTheme = {
  calendarBackground: 'transparent',
  contentStyle: {
    backgroundColor: 'transparent',
  },
  timelineContainer: {
    backgroundColor: 'transparent',
  },
  event: {
    opacity: 0.95,
    borderRadius: 6,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 4,
    paddingBottom: 4,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  line: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  verticalLine: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nowIndicatorLine: {
    backgroundColor: '#ffffff',
  },
  nowIndicatorKnob: {
    backgroundColor: '#ffffff',
  },
};

const isNumericId = (id: string | undefined): id is string =>
  !!id && /^\d+$/.test(id);

const NapTimelineScreen: React.FC = () => {
  const today = useMemo(() => formatDateParam(new Date()), []);
  const [currentDate, setCurrentDate] = useState(today);
  const [eventsByDate, setEventsByDate] = useState<
    Record<string, TimelineEventProps[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const fetchedRangesRef = useRef<Set<string>>(new Set());
  const suppressEventPressRef = useRef(false);

  const markedDates = useMemo(
    () => buildMarkedDatesFromEvents(eventsByDate),
    [eventsByDate]
  );

  const rangeKey = (from: string, to: string) => `${from}:${to}`;

  const applySessions = useCallback((sessions: TimerSession[]) => {
    setEventsByDate((current) =>
      mergeTimelineEventsByDate(current, buildTimelineEventsByDate(sessions))
    );
  }, []);

  const removeEventFromState = useCallback((eventId: string) => {
    setEventsByDate((current) => {
      const next: Record<string, TimelineEventProps[]> = {};
      for (const [date, events] of Object.entries(current)) {
        const filtered = events.filter((event) => event.id !== eventId);
        if (filtered.length > 0) {
          next[date] = filtered;
        }
      }
      return next;
    });
  }, []);

  const loadRange = useCallback(
    async (from: string, to: string, force = false) => {
      const key = rangeKey(from, to);
      if (!force && fetchedRangesRef.current.has(key)) {
        return;
      }

      fetchedRangesRef.current.add(key);

      const token = await AsyncStorage.getItem('token');
      if (token) {
        const sessions = filterTimelineSessions(
          await fetchTimerRunsInRange(token, from, to)
        );
        applySessions(sessions);
        return;
      }

      const cached = await loadTimerHistoryFromCache();
      applySessions(
        filterTimelineSessions(filterSessionsInRange(cached, from, to))
      );
    },
    [applySessions]
  );

  const loadBufferedRange = useCallback(
    async (date: Date, force = false) => {
      const { from, to } = getBufferedWeekRange(date, 1);
      await loadRange(from, to, force);
    },
    [loadRange]
  );

  const refreshTimeline = useCallback(async () => {
    setIsLoading(true);
    try {
      fetchedRangesRef.current.clear();
      setEventsByDate({});
      await loadBufferedRange(new Date(currentDate), true);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, loadBufferedRange]);

  useFocusEffect(
    useCallback(() => {
      void refreshTimeline();
    }, [refreshTimeline])
  );

  const handleDateChanged = useCallback(
    (date: string, _source?: string) => {
      setCurrentDate(date);
      const { from, to } = getWeekRangeForDate(new Date(`${date}T12:00:00`));
      void loadRange(from, to);
    },
    [loadRange]
  );

  const handleMonthChange = useCallback(
    (month: { dateString: string }) => {
      void loadBufferedRange(new Date(`${month.dateString}T12:00:00`));
    },
    [loadBufferedRange]
  );

  const handleEventPress = useCallback((event: TimelineEventProps) => {
    if (suppressEventPressRef.current) {
      suppressEventPressRef.current = false;
      return;
    }

    Alert.alert(
      event.summary ?? 'Session',
      `${formatSessionClockTime(String(event.start))} – ${formatSessionClockTime(String(event.end))}\nDuration: ${event.title ?? '—'}`
    );
  }, []);

  const performDelete = useCallback(
    async (event: TimelinePackedEventProps) => {
      const eventId = event.id;
      if (!eventId || isDeleting) return;

      setIsDeleting(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (token && isNumericId(eventId)) {
          await deleteTimerRun(token, Number(eventId));
        }

        await removeTimerSessionFromCache(eventId);
        removeEventFromState(eventId);
      } catch {
        Alert.alert('Error', 'Could not delete this entry. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, removeEventFromState]
  );

  const confirmDelete = useCallback(
    (event: TimelinePackedEventProps) => {
      Alert.alert(
        'Delete entry',
        'Are you sure you want to delete this session? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void performDelete(event),
          },
        ]
      );
    },
    [performDelete]
  );

  const renderEvent = useCallback(
    (event: TimelinePackedEventProps) => (
      <View style={styles.eventContent}>
        <View style={styles.eventTextBlock}>
          <Text numberOfLines={1} style={styles.eventTitle}>
            {event.title || 'Event'}
          </Text>
          {event.summary ? (
            <Text numberOfLines={2} style={styles.eventSummary}>
              {event.summary}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Delete entry"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            suppressEventPressRef.current = true;
            confirmDelete(event);
          }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={16} color="#ffffff" />
        </Pressable>
      </View>
    ),
    [confirmDelete]
  );

  const timelineProps = useMemo(
    () => ({
      format24h: true,
      overlapEventsSpacing: 8,
      rightEdgeSpacing: 24,
      theme: timelineTheme,
      onEventPress: handleEventPress,
      renderEvent,
    }),
    [handleEventPress, renderEvent]
  );

  return (
    <ScreenComponent contentFlex style={styles.screen}>
      <View style={styles.container}>
        {isLoading || isDeleting ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="white" size="large" />
          </View>
        ) : null}

        <CalendarProvider
          date={currentDate}
          onDateChanged={handleDateChanged}
          onMonthChange={handleMonthChange}
          showTodayButton
          disabledOpacity={0.6}
          theme={calendarTheme}
          style={styles.provider}
        >
          <WeekCalendar
            markedDates={markedDates}
            theme={calendarTheme}
            allowShadow={false}
          />
          <TimelineList
            events={eventsByDate}
            timelineProps={timelineProps}
            showNowIndicator
          />
        </CalendarProvider>

        {!isLoading && Object.keys(eventsByDate).length === 0 ? (
          <View style={styles.emptyState} pointerEvents="none">
            <Text style={styles.emptyText}>
              No sleep or nursing sessions for this period.
            </Text>
          </View>
        ) : null}
      </View>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  provider: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  emptyState: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
  },
  eventContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTextBlock: {
    flexShrink: 1,
  },
  eventTitle: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  eventSummary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
  },
});

export default NapTimelineScreen;
