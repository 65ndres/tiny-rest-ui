import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/AppText';
import {
  fetchTimerRunsInRange,
  filterSessionsInRange,
  formatFeedingHistoryPrimary,
  formatHumanDuration,
  formatSessionClockTime,
  formatSessionTimeRange,
  loadTimerHistoryFromCache,
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
  getSleptMs,
  getTimelineDayStartForInstant,
  getTimelineSegmentKind,
  getWeekTimelineRange,
  type TimelineSegmentKind,
  WEEK_TIMELINE_RUN_TYPES,
} from '@/app/utils/weekTimeline';
import { FEEDING_COLORS } from '@/app/constants/feedingTheme';
import { layout } from '@/app/constants/screenLayout';
import { vh, vw } from '@/constants/appViewport';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import type { EditTimelineEntryParams } from '@/app/screens/EditTimelineEntryScreen';

const AXIS_WIDTH = vw(62);
const MIN_BAR_HEIGHT = 3;
const MIN_FEEDING_HEIGHT = vh(7);
// Sleep uses the app's gold (the "14-day free trial" highlight on the landing
// screen) with a paler shade for naps; feedings pick up the pink and lilac of
// the background clouds.
const NIGHT_COLOR = '#FFD700';
const NAP_COLOR = '#FFEB99';
const NURSING_COLOR = '#FF9EC4';
const BOTTLE_COLOR = '#C9B6FF';
const NOW_COLOR = '#ffffff';
const GRID_COLOR = 'rgba(255,255,255,0.12)';

const SEGMENT_COLORS: Record<TimelineSegmentKind, string> = {
  night: NIGHT_COLOR,
  nap: NAP_COLOR,
  nursing: NURSING_COLOR,
  bottle: BOTTLE_COLOR,
};

// Icon colors inside the summary card's white circle: deeper shades of the
// bar colors so they read on white.
const SEGMENT_ICON_COLORS: Record<TimelineSegmentKind, string> = {
  night: '#C99400',
  nap: '#E8B923',
  nursing: '#E0609A',
  bottle: '#8E6FE0',
};

const SEGMENT_LABELS: Record<TimelineSegmentKind, string> = {
  night: 'Night',
  nap: 'Nap',
  nursing: 'Nursing',
  bottle: 'Bottle',
};

const SEGMENT_ICONS: Record<
  TimelineSegmentKind,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  night: 'moon',
  nap: 'partly-sunny',
  nursing: 'heart',
  bottle: 'water',
};

const LEGEND_KINDS: TimelineSegmentKind[] = ['night', 'nap', 'nursing', 'bottle'];

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

// Bottle feedings are a single moment, so they only have a start time.
const isInstantSession = (session: TimerSession): boolean =>
  session.run_type === 'bottle';

type TimelineNavigation = DrawerNavigationProp<{
  EditTimelineEntry: EditTimelineEntryParams;
}>;

const NapTimelineScreen: React.FC = () => {
  const navigation = useNavigation<TimelineNavigation>();
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
  const [loadError, setLoadError] = useState<string | null>(null);
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
        ? await fetchTimerRunsInRange(token, from, to)
        : filterSessionsInRange(await loadTimerHistoryFromCache(), from, to);
      if (requestId !== requestIdRef.current) return;

      const entries = loaded.filter(
        (session) =>
          session.run_type != null &&
          WEEK_TIMELINE_RUN_TYPES.includes(session.run_type)
      );
      setSessions(entries);
      setSelectedId((current) => {
        if (current && entries.some((session) => session.id === current)) {
          return current;
        }
        const latest = [...entries].sort(
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
    ? getTimelineSegmentKind(
        selectedSession,
        dayWindow.startMinutes,
        dayWindow.endMinutes
      )
    : null;
  const subject = babyName?.trim() || 'Baby';

  let summaryTitle = '';
  let summaryRange = '';
  if (selectedSession) {
    if (selectedKind === 'night' || selectedKind === 'nap') {
      summaryTitle = `${subject} ${selectedKind === 'night' ? 'slept' : 'napped'} ${formatHumanDuration(getSleptMs(selectedSession))}`;
    } else if (selectedKind === 'nursing') {
      summaryTitle = `${formatFeedingHistoryPrimary(selectedSession)} · ${formatHumanDuration(getSleptMs(selectedSession))}`;
    } else {
      summaryTitle = formatFeedingHistoryPrimary(selectedSession);
    }
    summaryRange = isInstantSession(selectedSession)
      ? formatSessionClockTime(selectedSession.start_time)
      : formatSessionTimeRange(
          selectedSession.start_time,
          selectedSession.end_time
        );
  }

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
                        const isFeeding =
                          segment.kind === 'nursing' || segment.kind === 'bottle';
                        const height = Math.max(
                          isFeeding ? MIN_FEEDING_HEIGHT : MIN_BAR_HEIGHT,
                          (segment.endOffsetMinutes - segment.startOffsetMinutes) *
                            pxPerMinute
                        );
                        const top = segment.startOffsetMinutes * pxPerMinute;
                        return (
                          <Pressable
                            key={segment.key}
                            accessibilityLabel={SEGMENT_LABELS[segment.kind]}
                            accessibilityRole="button"
                            hitSlop={{ top: 6, bottom: 6 }}
                            onPress={() => setSelectedId(segment.sessionId)}
                            style={[
                              isFeeding ? styles.feedingBar : styles.bar,
                              {
                                // Center instant bottle feedings on their time.
                                top:
                                  segment.kind === 'bottle' ? top - height / 2 : top,
                                height,
                                backgroundColor: SEGMENT_COLORS[segment.kind],
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

          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="white" size="large" />
            </View>
          ) : null}
        </View>

        <View style={styles.legend}>
          {LEGEND_KINDS.map((kind) => (
            <View key={kind} style={styles.legendItem}>
              <View
                style={[styles.legendSwatch, { backgroundColor: SEGMENT_COLORS[kind] }]}
              />
              <Text style={styles.legendLabel}>{SEGMENT_LABELS[kind]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          {selectedSession ? (
            <>
              <View
                style={[
                  styles.summaryAccent,
                  { backgroundColor: SEGMENT_COLORS[selectedKind ?? 'nap'] },
                ]}
              />
              <View style={styles.summaryIconCircle}>
                <Ionicons
                  name={SEGMENT_ICONS[selectedKind ?? 'nap']}
                  size={layout.iconLg}
                  color={SEGMENT_ICON_COLORS[selectedKind ?? 'nap']}
                />
              </View>
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>{summaryTitle}</Text>
                <Text style={styles.summaryRange}>{summaryRange}</Text>
              </View>
              <Pressable
                accessibilityLabel="Edit entry"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() =>
                  navigation.navigate('EditTimelineEntry', {
                    session: selectedSession,
                    openedAt: Date.now(),
                  })
                }
              >
                <Ionicons name="create" size={layout.icon2xl} color="#ffffff" />
              </Pressable>
            </>
          ) : (
            <Text style={styles.emptyText}>
              {loadError ??
                (isLoading
                  ? ' '
                  : sessions.length === 0
                    ? 'Nothing logged for this week.'
                    : 'Tap a bar to see details.')}
            </Text>
          )}
        </View>
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
    backgroundColor: NOW_COLOR,
  },
  nowLine: {
    flex: 1,
    height: 2,
    backgroundColor: NOW_COLOR,
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
  feedingBar: {
    position: 'absolute',
    left: vw(3),
    right: vw(3),
    borderRadius: vh(2),
  },
  // A white outline and glow mark the selected entry.
  barSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.9,
    shadowRadius: vh(6),
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    zIndex: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: layout.space16,
    marginTop: layout.space8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.space6,
  },
  legendSwatch: {
    width: vh(10),
    height: vh(10),
    borderRadius: vh(5),
  },
  legendLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontSm,
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
  },
  summaryIconCircle: {
    width: layout.iconCircle,
    height: layout.iconCircle,
    borderRadius: layout.iconCircle / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#ffffff',
    fontSize: layout.fontBase,
    fontWeight: '700',
    marginTop: layout.space4,
  },
  emptyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.fontBase,
    textAlign: 'center',
  },
});

export default NapTimelineScreen;
