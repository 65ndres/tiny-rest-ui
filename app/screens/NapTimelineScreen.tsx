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
  findOverlappingSession,
  formatOverlapMessage,
  formatFeedingHistoryPrimary,
  formatHumanDuration,
  formatSessionClockTime,
  formatSessionDateTime,
  formatSessionTimeRange,
  getTimerApiErrorMessage,
  loadTimerHistoryFromCache,
  mapTimerRunToSession,
  removeTimerSessionFromCache,
  replaceTimerSessionInCache,
  START_TIME_FUTURE_MESSAGE,
  submitTimerRun,
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
import { HEADING_MARGIN, layout } from '@/app/constants/screenLayout';
import { vh, vw } from '@/constants/appViewport';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';
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
const MIN_FEEDING_HEIGHT = vh(7);
const NIGHT_COLOR = '#3dd1e7';
const NAP_COLOR = '#b4eef7';
const NURSING_COLOR = FEEDING_COLORS.nursingCircle;
const BOTTLE_COLOR = FEEDING_COLORS.accent;
// Matches the "14-day free trial" highlight on the landing screen.
const SELECTED_COLOR = '#FFD700';
const GRID_COLOR = 'rgba(255,255,255,0.12)';
// Matches the API's allowance for "now" presses.
const FUTURE_SKEW_MS = 60_000;

const SEGMENT_COLORS: Record<TimelineSegmentKind, string> = {
  night: NIGHT_COLOR,
  nap: NAP_COLOR,
  nursing: NURSING_COLOR,
  bottle: BOTTLE_COLOR,
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
  night: 'moon-outline',
  nap: 'partly-sunny-outline',
  nursing: 'heart-outline',
  bottle: 'water-outline',
};

const LEGEND_KINDS: TimelineSegmentKind[] = ['night', 'nap', 'nursing', 'bottle'];

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

// 'form' shows the edit drawer; 'start' / 'end' swap it for the picker.
type EditStage = 'form' | 'start' | 'end';

type EditDraft = {
  session: TimerSession;
  start: Date;
  end: Date;
};

// Bottle feedings are a single moment, so they only have a start time.
const isInstantSession = (session: TimerSession): boolean =>
  session.run_type === 'bottle';

const validateEditDraft = (
  draft: EditDraft,
  sessions: TimerSession[]
): string | null => {
  const latest = Date.now() + FUTURE_SKEW_MS;
  if (draft.start.getTime() > latest) return START_TIME_FUTURE_MESSAGE;
  if (!isInstantSession(draft.session)) {
    if (draft.end.getTime() > latest) return 'End time cannot be in the future.';
    if (draft.end.getTime() <= draft.start.getTime()) {
      return 'End time must be after start time.';
    }
  }
  // The API checks every entry; this catches the loaded week up front and
  // covers guests, whose edits never reach the API.
  const overlap = findOverlappingSession(sessions, {
    id: draft.session.id,
    start: draft.start,
    end: draft.end,
  });
  return overlap ? formatOverlapMessage(overlap) : null;
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
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editStage, setEditStage] = useState<EditStage | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pickerNow, setPickerNow] = useState(() => new Date());
  const [pickerOpenGeneration, setPickerOpenGeneration] = useState(0);
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

  const openEdit = useCallback((session: TimerSession) => {
    setEditDraft({
      session,
      start: new Date(session.start_time),
      end: new Date(session.end_time),
    });
    setEditError(null);
    setEditStage('form');
  }, []);

  const closeEdit = useCallback(() => {
    setEditStage(null);
    setEditDraft(null);
    setEditError(null);
  }, []);

  const openEditPicker = useCallback((target: 'start' | 'end') => {
    setPickerNow(new Date());
    setPickerOpenGeneration((generation) => generation + 1);
    setEditStage(target);
  }, []);

  const handleEditPickerChange = useCallback(
    (date: Date) => {
      setEditError(null);
      setEditDraft((current) => {
        if (!current) return current;
        if (isInstantSession(current.session)) {
          return { ...current, start: date, end: date };
        }
        return { ...current, [editStage === 'end' ? 'end' : 'start']: date };
      });
    },
    [editStage]
  );

  const performEdit = useCallback(async () => {
    if (!editDraft || isSaving) return;

    const validationError = validateEditDraft(editDraft, sessions);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    const { session, start, end } = editDraft;
    const payload = {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_ms: end.getTime() - start.getTime(),
    };

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let updated: TimerSession = { ...session, ...payload };
      if (token && isNumericId(session.id)) {
        const record = await submitTimerRun(token, Number(session.id), payload);
        updated = mapTimerRunToSession(record) ?? updated;
      }

      await replaceTimerSessionInCache(updated);
      setSessions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedId(updated.id);
      closeEdit();
    } catch (error) {
      setEditError(
        getTimerApiErrorMessage(error, 'Could not save this entry. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  }, [closeEdit, editDraft, isSaving, sessions]);

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
                                backgroundColor: isSelected
                                  ? SELECTED_COLOR
                                  : SEGMENT_COLORS[segment.kind],
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

          {isLoading || isDeleting || isSaving ? (
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
              <View style={styles.summaryAccent} />
              <Ionicons
                name={SEGMENT_ICONS[selectedKind ?? 'nap']}
                size={layout.font3xl}
                color={SEGMENT_COLORS[selectedKind ?? 'nap']}
              />
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>{summaryTitle}</Text>
                <Text style={styles.summaryRange}>{summaryRange}</Text>
              </View>
              <Pressable
                accessibilityLabel="Edit entry"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => openEdit(selectedSession)}
              >
                <Ionicons
                  name="create-outline"
                  size={layout.iconXl}
                  color="rgba(255,255,255,0.75)"
                />
              </Pressable>
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
                    ? 'Nothing logged for this week.'
                    : 'Tap a bar to see details.')}
            </Text>
          )}
        </View>

        <Drawer
          isOpen={editStage === 'form'}
          onClose={closeEdit}
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
                    Edit entry
                  </Heading>
                  <DrawerCloseButton
                    accessibilityLabel="Cancel editing"
                    className="p-1"
                  >
                    <Ionicons
                      name="close"
                      size={layout.icon2xl}
                      color="#ffffff"
                    />
                  </DrawerCloseButton>
                </DrawerHeader>

                {editDraft && isInstantSession(editDraft.session) ? (
                  <View style={styles.editRows}>
                    <TimerSettingRow
                      label="Time:"
                      value={formatSessionDateTime(editDraft.start.toISOString())}
                      placeholder="Select time"
                      onPress={() => openEditPicker('start')}
                      accessibilityLabel="Edit feeding time"
                      isFirst
                    />
                  </View>
                ) : editDraft ? (
                  <View style={styles.editRows}>
                    <TimerSettingRow
                      label="Started at:"
                      value={formatSessionDateTime(editDraft.start.toISOString())}
                      placeholder="Select time"
                      onPress={() => openEditPicker('start')}
                      accessibilityLabel="Edit start time"
                      isFirst
                    />
                    <TimerSettingRow
                      label="Ended at:"
                      value={formatSessionDateTime(editDraft.end.toISOString())}
                      placeholder="Select time"
                      onPress={() => openEditPicker('end')}
                      accessibilityLabel="Edit end time"
                    />
                  </View>
                ) : null}

                {editError ? (
                  <Text style={styles.editError}>{editError}</Text>
                ) : null}

                <View style={styles.drawerActions}>
                  <TimerOutlineButton
                    label="Cancel"
                    onPress={closeEdit}
                    size="lg"
                  />
                  <TimerOutlineButton
                    label="Save"
                    onPress={() => void performEdit()}
                    variant="solid"
                    size="lg"
                    disabled={isSaving}
                    isLoading={isSaving}
                  />
                </View>
              </View>
            </ImageBackground>
          </DrawerContent>
        </Drawer>

        <TimerDateTimePickerDrawer
          isOpen={editStage === 'start' || editStage === 'end'}
          title={
            editStage === 'end'
              ? 'End time'
              : editDraft && isInstantSession(editDraft.session)
                ? 'Feeding time'
                : 'Start time'
          }
          value={
            (editStage === 'end' ? editDraft?.end : editDraft?.start) ?? pickerNow
          }
          onChange={handleEditPickerChange}
          onClose={() => setEditStage(editDraft ? 'form' : null)}
          maximumDate={pickerNow}
          openGeneration={pickerOpenGeneration}
        />

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
  feedingBar: {
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
    marginVertical: HEADING_MARGIN,
  },
  drawerMessage: {
    color: '#ffffff',
    fontSize: layout.fontBase,
    fontWeight: '600',
    lineHeight: layout.font2xl,
    marginTop: layout.space12,
    textAlign: 'center',
  },
  editRows: {
    width: '100%',
    marginTop: layout.space12,
  },
  editError: {
    color: SELECTED_COLOR,
    fontSize: layout.fontSm,
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
