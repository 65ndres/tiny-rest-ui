import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
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
import {
  TIMER_SOLID_BUTTON_CONTENT_COLOR,
  layout,
} from '@/app/constants/screenLayout';
import { getAppWindow, vh, vw } from '@/constants/appViewport';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import {
  Drawer,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer';
import { Heading } from '@/components/ui/heading';

const { width: timelineWidth, height: timelineHeight } = getAppWindow();
const TIMELINE_LEFT_INSET = vw(56);
const DRAWER_BACKGROUND = require('../../assets/images/bg-date-picker.png');

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
  textDayFontSize: vh(16),
  textMonthFontSize: vh(16),
  textDayHeaderFontSize: vh(13),
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
    borderRadius: vh(6),
    paddingLeft: vh(6),
    paddingRight: vh(6),
    paddingTop: vh(4),
    paddingBottom: vh(4),
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: vh(12),
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<TimelinePackedEventProps | null>(null);
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

      try {
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
      } catch (error) {
        fetchedRangesRef.current.delete(key);
        throw error;
      }
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
    setLoadError(null);
    try {
      fetchedRangesRef.current.clear();
      setEventsByDate({});
      await loadBufferedRange(new Date(`${currentDate}T12:00:00`), true);
    } catch {
      setLoadError('Could not load the timeline. Please try again.');
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
      void loadRange(from, to).catch(() => {
        setLoadError('Could not load the timeline. Please try again.');
      });
    },
    [loadRange]
  );

  const handleMonthChange = useCallback(
    (month: { dateString: string }) => {
      void loadBufferedRange(new Date(`${month.dateString}T12:00:00`)).catch(
        () => {
          setLoadError('Could not load the timeline. Please try again.');
        }
      );
    },
    [loadBufferedRange]
  );

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
        setLoadError('Could not delete this entry. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, removeEventFromState]
  );

  const confirmDelete = useCallback(
    (event: TimelinePackedEventProps) => {
      setPendingDelete(event);
    },
    []
  );

  const renderEvent = useCallback(
    (event: TimelinePackedEventProps) => (
      <View style={styles.eventContent}>
        <View style={styles.eventTextBlock}>
          <Text numberOfLines={1} style={styles.eventTitle}>
            {event.title || 'Event'}
          </Text>
          <Text numberOfLines={1} style={styles.eventTime}>
            Start: {formatSessionClockTime(String(event.start))}
          </Text>
          <Text numberOfLines={1} style={styles.eventTime}>
            End: {formatSessionClockTime(String(event.end))}
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
            confirmDelete(event);
          }}
          style={styles.deleteButton}
        >
          <Ionicons
            name="trash-outline"
            size={vh(22)}
            color={TIMER_SOLID_BUTTON_CONTENT_COLOR}
          />
        </Pressable>
      </View>
    ),
    [confirmDelete]
  );

  const timelineProps = useMemo(
    () => ({
      format24h: true,
      overlapEventsSpacing: vw(8),
      rightEdgeSpacing: vw(24),
      timelineLeftInset: TIMELINE_LEFT_INSET,
      theme: timelineTheme,
      renderEvent,
    }),
    [renderEvent]
  );

  return (
    <ScreenComponent
      contentFlex
      constrainToPhoneViewport={false}
      style={styles.screen}
    >
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
          timelineLeftInset={TIMELINE_LEFT_INSET}
          style={styles.provider}
        >
          <WeekCalendar
            markedDates={markedDates}
            theme={calendarTheme}
            allowShadow={false}
            calendarWidth={timelineWidth}
          />
          <TimelineList
            events={eventsByDate}
            timelineProps={timelineProps}
            showNowIndicator
          />
        </CalendarProvider>

        {!isLoading && (loadError || Object.keys(eventsByDate).length === 0) ? (
          <View style={styles.emptyState} pointerEvents="none">
            <Text style={styles.emptyText}>
              {loadError ??
                'No sleep or nursing sessions for this period.'}
            </Text>
          </View>
        ) : null}

        <Drawer
          isOpen={pendingDelete !== null}
          onClose={() => setPendingDelete(null)}
          anchor="bottom"
          size="md"
        >
          <DrawerBackdrop className="bg-black/60" />
          <DrawerContent className="border-white/0 bg-transparent p-0 overflow-hidden">
            <ImageBackground
              resizeMode="cover"
              source={DRAWER_BACKGROUND}
              style={styles.drawerBackground}
            >
              <View style={styles.drawerContent}>
                <DrawerHeader className="px-0" style={styles.drawerHeader}>
                  <Heading
                    size="lg"
                    className="text-white font-bold"
                    style={styles.drawerHeading}
                  >
                    Delete entry
                  </Heading>
                  <DrawerCloseButton
                    accessibilityLabel="Cancel deletion"
                    className="p-1"
                  >
                    <Ionicons
                      name="close"
                      size={layout.icon2xl}
                      color="#ffffff"
                    />
                  </DrawerCloseButton>
                </DrawerHeader>

                <Text style={styles.drawerMessage}>
                  Delete this session? This cannot be undone.
                </Text>

                <View style={styles.drawerActions}>
                  <TimerOutlineButton
                    label="Cancel"
                    onPress={() => setPendingDelete(null)}
                    size="lg"
                  />
                  <TimerOutlineButton
                    label="Delete"
                    onPress={() => {
                      if (!pendingDelete) return;
                      const event = pendingDelete;
                      setPendingDelete(null);
                      void performDelete(event);
                    }}
                    variant="solid"
                    size="lg"
                    disabled={isDeleting}
                  />
                </View>
              </View>
            </ImageBackground>
          </DrawerContent>
        </Drawer>
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
    bottom: timelineHeight * 0.05,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: vh(16),
  },
  eventContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTextBlock: {
    flexShrink: 1,
  },
  eventTitle: {
    color: TIMER_SOLID_BUTTON_CONTENT_COLOR,
    fontWeight: '700',
    fontSize: vh(15),
  },
  eventTime: {
    color: TIMER_SOLID_BUTTON_CONTENT_COLOR,
    fontWeight: '600',
    fontSize: vh(13),
    marginTop: vh(2),
  },
  eventSummary: {
    color: TIMER_SOLID_BUTTON_CONTENT_COLOR,
    fontWeight: '600',
    fontSize: vh(13),
    marginTop: vh(2),
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: vh(4),
    paddingVertical: vh(2),
  },
  drawerBackground: {
    width: '100%',
    height: '100%',
  },
  drawerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: layout.space24,
    paddingBottom: layout.space32,
  },
  drawerHeader: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  drawerHeading: {
    fontSize: layout.fontLg,
  },
  drawerMessage: {
    color: '#ffffff',
    fontSize: layout.fontBase,
    fontWeight: '600',
    lineHeight: layout.font2xl,
    marginTop: layout.space12,
    textAlign: 'center',
  },
  drawerActions: {
    width: '100%',
    gap: layout.space12,
    marginTop: layout.space36,
  },
});

export default NapTimelineScreen;
