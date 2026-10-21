import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import {
  deleteTimerRun,
  fetchTimerRunsInRange,
  filterSessionsInRange,
  formatHumanDuration,
  formatSessionTimeRange,
  loadTimerHistoryFromCache,
  removeTimerSessionFromCache,
  type TimerSession,
} from '@/app/utils/timerHistory';
import {
  DEFAULT_DAY_END_MINUTES,
  DEFAULT_DAY_START_MINUTES,
} from '@/app/utils/dayWindow';
import { fetchUserProfile } from '@/app/utils/userProfile';
import {
  MINUTES_PER_TIMELINE_DAY,
  buildWeekTimelineDays,
  buildWeekTimelineHourMarks,
  buildWeekTimelineSegments,
  classifySleep,
  getSleptMs,
  getTimelineDayStartForInstant,
  getWeekTimelineRange,
} from '@/app/utils/weekTimeline';
import { FEEDING_COLORS } from '@/app/constants/feedingTheme';
import { layout } from '@/app/constants/screenLayout';
import { vh, vw } from '@/constants/appViewport';
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

const DRAWER_BACKGROUND = require('../../assets/images/bg-date-picker.png');
const AXIS_WIDTH = vw(62);
const MIN_BAR_HEIGHT = 3;
const NIGHT_COLOR = '#3dd1e7';
const NAP_COLOR = '#b4eef7';
// Matches the "14-day free trial" highlight on the landing screen.
const SELECTED_COLOR = '#FFD700';
const GRID_COLOR = 'rgba(255,255,255,0.12)';

const isNumericId = (id: string | undefined): id is string =>
  !!id && /^\d+$/.test(id);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatWeekLabel = (start: Date, end: Date): string => {
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = end.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' }
  );
  return `${startLabel} – ${endLabel}`;
};

type DayWindow = {
  startMinutes: number;
  endMinutes: number;
};

const NapTimelineScreen: React.FC = () => {
  const [weekEnd, setWeekEnd] = useState(() => new Date());
  const [dayWindow, setDayWindow] = useState<DayWindow>({
    startMinutes: DEFAULT_DAY_START_MINUTES,
    endMinutes: DEFAULT_DAY_END_MINUTES,
  });
  const [babyName, setBabyName] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chartHeight, setChartHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TimerSession | null>(null);
  const requestIdRef = useRef(0);

  const days = useMemo(
    () => buildWeekTimelineDays(weekEnd, dayWindow.startMinutes),
    [weekEnd, dayWindow.startMinutes]
  );

  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    return now >= days[0].start && now < days[days.length - 1].end;
  }, [days]);

  const segments = useMemo(
    () =>
      buildWeekTimelineSegments(
        sessions,
        days,
        dayWindow.startMinutes,
        dayWindow.endMinutes
      ),
    [sessions, days, dayWindow]
  );

  const hourMarks = useMemo(
    () => buildWeekTimelineHourMarks(dayWindow.startMinutes),
    [dayWindow.startMinutes]
  );

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  const loadProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const profile = await fetchUserProfile(token);
      setDayWindow({
        startMinutes: profile.day_start_minutes,
        endMinutes: profile.day_end_minutes,
      });
      setBabyName(profile.baby_name);
    } catch {
      // Keep the default day window if the profile can't be loaded.
    }
  }, []);

  const loadWeek = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const { from, to } = getWeekTimelineRange(days);
    setIsLoading(true);
    setLoadError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      const loaded = token
        ? await fetchTimerRunsInRange(token, from, to, { run_type: 'sleeping' })
        : filterSessionsInRange(await loadTimerHistoryFromCache(), from, to);
      if (requestId !== requestIdRef.current) return;

      const sleeps = loaded.filter((session) => session.run_type === 'sleeping');
      setSessions(sleeps);
      setSelectedId((current) => {
        if (current && sleeps.some((session) => session.id === current)) {
          return current;
        }
        const latest = [...sleeps].sort(
          (a, b) => Date.parse(b.end_time) - Date.parse(a.end_time)
        )[0];
        return latest?.id ?? null;
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError('Could not load the timeline. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [days]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  useFocusEffect(
    useCallback(() => {
      void loadWeek();
    }, [loadWeek])
  );

  const shiftWeek = useCallback((direction: -1 | 1) => {
    setWeekEnd((current) => {
      const next = addDays(current, direction * 7);
      const now = new Date();
      return next > now ? now : next;
    });
  }, []);

  const performDelete = useCallback(
    async (session: TimerSession) => {
      if (isDeleting) return;

      setIsDeleting(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (token && isNumericId(session.id)) {
          await deleteTimerRun(token, Number(session.id));
        }

        await removeTimerSessionFromCache(session.id);
        setSessions((current) =>
          current.filter((item) => item.id !== session.id)
        );
        setSelectedId(null);
      } catch {
        setLoadError('Could not delete this entry. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting]
  );

  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    setChartHeight(event.nativeEvent.layout.height);
  }, []);

  const pxPerMinute = chartHeight / MINUTES_PER_TIMELINE_DAY;

  const now = new Date();
  const nowOffsetMinutes = isCurrentWeek
    ? (now.getTime() -
        getTimelineDayStartForInstant(now, dayWindow.startMinutes).getTime()) /
      60_000
    : null;

  const selectedKind = selectedSession
    ? classifySleep(selectedSession, dayWindow.startMinutes, dayWindow.endMinutes)
    : null;
  const subject = babyName?.trim() || 'Baby';

  return (
    <ScreenComponent
      contentFlex
      constrainToPhoneViewport={false}
      style={styles.screen}
    >
      <View style={styles.container}>
        <View style={styles.weekHeader}>
          <Pressable
            accessibilityLabel="Previous week"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => shiftWeek(-1)}
          >
            <Ionicons name="chevron-back" size={layout.icon2xl} color="#ffffff" />
          </Pressable>
          <Text style={styles.weekLabel}>
            {formatWeekLabel(days[0].start, days[days.length - 1].start)}
          </Text>
          <Pressable
            accessibilityLabel="Next week"
            accessibilityRole="button"
            disabled={isCurrentWeek}
            hitSlop={12}
            onPress={() => shiftWeek(1)}
            style={isCurrentWeek ? styles.disabledArrow : undefined}
          >
            <Ionicons
              name="chevron-forward"
              size={layout.icon2xl}
              color="#ffffff"
            />
          </Pressable>
        </View>

        <View style={styles.dayHeaderRow}>
          <View style={{ width: AXIS_WIDTH }} />
          {days.map((day) => (
            <View key={day.key} style={styles.dayHeader}>
              <Text style={styles.dayHeaderName}>
                {day.start.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={styles.dayHeaderDate}>{day.start.getDate()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chart} onLayout={handleChartLayout}>
          {chartHeight > 0
            ? hourMarks.map((mark) => {
                const top = mark.offsetMinutes * pxPerMinute;
                return (
                  <View
                    key={mark.offsetMinutes}
                    pointerEvents="none"
                    style={[styles.gridRow, { top }]}
                  >
                    <Text style={styles.hourLabel}>{mark.label}</Text>
                    <View style={styles.gridLine} />
                  </View>
                );
              })
            : null}

          {chartHeight > 0 && nowOffsetMinutes != null ? (
            <View
              pointerEvents="none"
              style={[styles.nowRow, { top: nowOffsetMinutes * pxPerMinute }]}
            >
              <View style={styles.nowKnob} />
              <View style={styles.nowLine} />
            </View>
          ) : null}

          <View style={styles.columns}>
            {days.map((day, dayIndex) => (
              <View key={day.key} style={styles.column}>
                {chartHeight > 0
                  ? segments
                      .filter((segment) => segment.dayIndex === dayIndex)
                      .map((segment) => {
                        const isSelected = segment.sessionId === selectedId;
                        const height = Math.max(
                          MIN_BAR_HEIGHT,
                          (segment.endOffsetMinutes - segment.startOffsetMinutes) *
                            pxPerMinute
                        );
                        return (
                          <Pressable
                            key={segment.key}
                            accessibilityLabel={
                              segment.kind === 'night' ? 'Night sleep' : 'Nap'
                            }
                            accessibilityRole="button"
                            hitSlop={{ top: 6, bottom: 6 }}
                            onPress={() => setSelectedId(segment.sessionId)}
                            style={[
                              styles.bar,
                              {
                                top: segment.startOffsetMinutes * pxPerMinute,
                                height,
                                backgroundColor: isSelected
                                  ? SELECTED_COLOR
                                  : segment.kind === 'night'
                                    ? NIGHT_COLOR
                                    : NAP_COLOR,
                              },
                              isSelected ? styles.barSelected : null,
                            ]}
                          />
                        );
                      })
                  : null}
              </View>
            ))}
          </View>

          {isLoading || isDeleting ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="white" size="large" />
            </View>
          ) : null}
        </View>

        <View style={styles.summaryCard}>
          {selectedSession ? (
            <>
              <View style={styles.summaryAccent} />
              <Ionicons
                name={selectedKind === 'night' ? 'moon-outline' : 'partly-sunny-outline'}
                size={layout.font3xl}
                color={NAP_COLOR}
              />
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  {subject} {selectedKind === 'night' ? 'slept' : 'napped'}{' '}
                  {formatHumanDuration(getSleptMs(selectedSession))}
                </Text>
                <Text style={styles.summaryRange}>
                  {formatSessionTimeRange(
                    selectedSession.start_time,
                    selectedSession.end_time
                  )}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Delete entry"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setPendingDelete(selectedSession)}
              >
                <Ionicons
                  name="trash-outline"
                  size={layout.iconXl}
                  color="rgba(255,255,255,0.75)"
                />
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyText}>
              {loadError ??
                (isLoading
                  ? ' '
                  : sessions.length === 0
                    ? 'No sleep logged for this week.'
                    : 'Tap a bar to see details.')}
            </Text>
          )}
        </View>

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
                      const session = pendingDelete;
                      setPendingDelete(null);
                      void performDelete(session);
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
    paddingHorizontal: layout.space8,
    paddingBottom: layout.space12,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.space24,
    paddingVertical: layout.space8,
  },
  weekLabel: {
    color: '#ffffff',
    fontSize: layout.fontLg,
    fontWeight: '600',
    minWidth: vw(140),
    textAlign: 'center',
  },
  disabledArrow: {
    opacity: 0.3,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    paddingBottom: layout.space8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderName: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontSm,
  },
  dayHeaderDate: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontSm,
    marginTop: layout.space2,
  },
  chart: {
    flex: 1,
    position: 'relative',
    // Room for the first and last axis labels, which straddle the chart edges.
    marginVertical: layout.fontXs * 0.7,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.fontXs * 1.4,
    marginTop: -(layout.fontXs * 0.7),
  },
  hourLabel: {
    width: AXIS_WIDTH - layout.space6,
    marginRight: layout.space6,
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontXs,
    textAlign: 'right',
  },
  gridLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: GRID_COLOR,
  },
  nowRow: {
    position: 'absolute',
    left: AXIS_WIDTH - vh(5),
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: vh(10),
    marginTop: -vh(5),
    zIndex: 1,
  },
  nowKnob: {
    width: vh(10),
    height: vh(10),
    borderRadius: vh(5),
    backgroundColor: SELECTED_COLOR,
  },
  nowLine: {
    flex: 1,
    height: 2,
    backgroundColor: SELECTED_COLOR,
  },
  columns: {
    ...StyleSheet.absoluteFill,
    left: AXIS_WIDTH,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    left: vw(3),
    right: vw(3),
    borderRadius: vh(2),
  },
  barSelected: {
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.space16,
    minHeight: vh(76),
    marginTop: layout.space12,
    paddingHorizontal: layout.space16,
    borderRadius: layout.radius12,
    backgroundColor: FEEDING_COLORS.cardBackground,
    overflow: 'hidden',
  },
  summaryAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: vh(5),
    backgroundColor: SELECTED_COLOR,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: layout.fontLg,
    fontWeight: '600',
  },
  summaryRange: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontBase,
    marginTop: layout.space4,
  },
  emptyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontBase,
    textAlign: 'center',
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
