import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CalendarProvider,
  ExpandableCalendar,
  TimelineEventProps,
  TimelineList,
  WeekCalendar,
} from 'react-native-calendars';
import {
  buildMarkedDatesFromEvents,
  buildTimelineEventsByDate,
  fetchTimerRunsInRange,
  filterSessionsInRange,
  formatDateParam,
  formatSessionClockTime,
  getBufferedWeekRange,
  getWeekRangeForDate,
  loadTimerHistoryFromCache,
  mergeTimelineEventsByDate,
  type TimerSession,
} from '@/app/utils/timerHistory';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Positions } from 'react-native-calendars/src/expandableCalendar';

const INITIAL_TIME = { hour: 9, minutes: 0 };

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

const NapTimelineScreen: React.FC = () => {
  const today = useMemo(() => formatDateParam(new Date()), []);
  const [currentDate, setCurrentDate] = useState(today);
  const [eventsByDate, setEventsByDate] = useState<
    Record<string, TimelineEventProps[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRangesRef = useRef<Set<string>>(new Set());

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

  const loadRange = useCallback(
    async (from: string, to: string, force = false) => {
      const key = rangeKey(from, to);
      if (!force && fetchedRangesRef.current.has(key)) {
        return;
      }

      fetchedRangesRef.current.add(key);

      const token = await AsyncStorage.getItem('token');
      if (token) {
        const sessions = await fetchTimerRunsInRange(token, from, to);
        applySessions(sessions);
        return;
      }

      const cached = await loadTimerHistoryFromCache();
      applySessions(filterSessionsInRange(cached, from, to));
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
    Alert.alert(
      'Nap',
      `${formatSessionClockTime(event.start)} – ${formatSessionClockTime(event.end)}\nDuration: ${event.title ?? '—'}`
    );
  }, []);

  const timelineProps = useMemo(
    () => ({
      format24h: true,
      overlapEventsSpacing: 8,
      rightEdgeSpacing: 24,
      theme: timelineTheme,
      onEventPress: handleEventPress,
    }),
    [handleEventPress]
  );

  return (

    <>  
    <View style={{ height: "10%" }}></View>
    <View style={{ height: "80%" }}> 
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="white" size="large" />
        </View>
      ) : null}

      <CalendarProvider
        date={currentDate}
        onDateChanged={handleDateChanged}
        onMonthChange={handleMonthChange}
        showTodayButton
        // disabledOpacity={0.6}
        // theme={calendarTheme}
        style={styles.provider}
      >
        {/* <ExpandableCalendar
          // firstDay={1}
          markedDates={markedDates}
            // initialPosition={Positions.OPEN}
          theme={calendarTheme}
          leftArrowImageSource={require('@/assets/images/left-arrow.png')}
          rightArrowImageSource={require('@/assets/images/right-arrow.png')} 
          >
        </ExpandableCalendar> */}

        <WeekCalendar
          markedDates={markedDates}
          theme={calendarTheme}
          // leftArrowImageSource={require('@/assets/images/left-arrow.png')}
          // rightArrowImageSource={require('@/assets/images/right-arrow.png')} 
        />
        {/* <View style={{ height: "70%" }}> */}
        <TimelineList
          events={eventsByDate}
          timelineProps={timelineProps}
          showNowIndicator
          scrollToFirst
          initialTime={INITIAL_TIME}
        />
        {/* </View> */}
      </CalendarProvider>

      {!isLoading && Object.keys(eventsByDate).length === 0 ? (
        <View style={styles.emptyState} pointerEvents="none">
          <Text style={styles.emptyText}>No naps recorded for this period.</Text>
        </View>
      ) : null}
    </View>
    </View>
    <View style={{ height: "10%" }}></View>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default NapTimelineScreen;
