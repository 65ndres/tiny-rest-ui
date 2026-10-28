import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/AppText';
import {
  fetchTimerRunsInRange,
  filterSessionsInRange,
  loadTimerHistoryFromCache,
  type TimerSession,
} from '@/app/utils/timerHistory';
import {
  DEFAULT_DAY_END_MINUTES,
  DEFAULT_DAY_START_MINUTES,
} from '@/app/utils/dayWindow';
import { fetchUserProfile } from '@/app/utils/userProfile';
import {
  buildWeekTimelineDays,
  getWeekTimelineRange,
  WEEK_TIMELINE_RUN_TYPES,
} from '@/app/utils/weekTimeline';
import {
  averageOverTrackedDays,
  buildReportDayStats,
  bucketReportDays,
  formatRangeLabel,
  formatReportDuration,
  formatVolume,
  getReportRangeDays,
  hasFeeding,
  hasSleep,
  niceAxis,
  preferredVolumeUnit,
  REPORT_RANGES,
  summarizeFeeding,
  summarizeSleep,
  type ReportBucket,
  type ReportRangeId,
} from '@/app/utils/reportTrends';
import { FEEDING_COLORS } from '@/app/constants/feedingTheme';
import {
  BOTTLE_COLOR,
  NAP_COLOR,
  NIGHT_COLOR,
  NURSING_COLOR,
} from '@/app/constants/timelineColors';
import { layout } from '@/app/constants/screenLayout';
import { vh, vw } from '@/constants/appViewport';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';

type ReportTab = 'sleep' | 'feeding';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'feeding', label: 'Nursing/Bottle' },
];

const ACCENT_COLOR = '#a3d133';
const GRID_COLOR = 'rgba(255,255,255,0.12)';
const MUTED_TEXT = 'rgba(255,255,255,0.75)';
const DONUT_SIZE = vh(170);
const DONUT_STROKE = vh(22);
const CHART_HEIGHT = vh(200);
const AXIS_WIDTH = vw(36);
const MAX_X_LABELS = 8;
const MS_PER_HOUR = 3_600_000;
const SLEEP_AXIS_STEPS_HOURS = [1, 2, 3, 4, 5, 6];
const FEEDING_AXIS_STEPS = [1, 2, 3, 4, 5, 10];

type DayWindow = {
  startMinutes: number;
  endMinutes: number;
};

type DonutSlice = { value: number; color: string };

/** Ring split into slices clockwise from 12 o'clock. */
const Donut: React.FC<{ slices: DonutSlice[]; children?: React.ReactNode }> = ({
  slices,
  children,
}) => {
  const radius = (DONUT_SIZE - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;

  return (
    <View style={styles.donut}>
      <Svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          stroke={GRID_COLOR}
          strokeWidth={DONUT_STROKE}
          fill="none"
        />
        {total > 0
          ? slices.map((slice, index) => {
              const length = (slice.value / total) * circumference;
              const circle = (
                <Circle
                  key={index}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={`${length} ${circumference}`}
                  strokeDashoffset={-offset}
                  fill="none"
                />
              );
              offset += length;
              return circle;
            })
          : null}
      </Svg>
      <View style={styles.donutCenter}>{children}</View>
    </View>
  );
};

type ChartSeries = {
  color: string;
  value: (bucket: ReportBucket) => number;
};

/** Stacked bars, one per bucket, with the first series at the bottom. */
const StackedBarChart: React.FC<{
  buckets: ReportBucket[];
  series: ChartSeries[];
  axisSteps: number[];
  formatTick: (value: number) => string;
}> = ({ buckets, series, axisSteps, formatTick }) => {
  const totals = buckets.map((bucket) =>
    series.reduce((sum, item) => sum + item.value(bucket), 0)
  );
  const axis = niceAxis(Math.max(0, ...totals), axisSteps);
  const ticks = Array.from(
    { length: Math.round(axis.max / axis.step) + 1 },
    (_, index) => axis.max - index * axis.step
  );
  const labelEvery = Math.ceil(buckets.length / MAX_X_LABELS);

  return (
    <View>
      <View style={styles.chart}>
        {ticks.map((tick) => (
          <View
            key={tick}
            pointerEvents="none"
            style={[styles.gridRow, { top: (1 - tick / axis.max) * CHART_HEIGHT }]}
          >
            <Text style={styles.axisLabel}>{formatTick(tick)}</Text>
            <View style={styles.gridLine} />
          </View>
        ))}
        <View style={styles.columns}>
          {buckets.map((bucket) => (
            <View key={bucket.key} style={styles.column}>
              <View style={styles.barStack}>
                {series.map((item, index) => {
                  const value = item.value(bucket);
                  if (value <= 0) return null;
                  return (
                    <View
                      key={index}
                      style={{
                        height: (value / axis.max) * CHART_HEIGHT,
                        backgroundColor: item.color,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.xLabels}>
        {/* Label every few columns, counting back from the latest one. */}
        {buckets.map((bucket, index) => (
          <View key={bucket.key} style={styles.xLabelSlot}>
            {(buckets.length - 1 - index) % labelEvery === 0 ? (
              <Text style={styles.xLabel} numberOfLines={1}>
                {bucket.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const LegendStat: React.FC<{ color: string; label: string; value: string }> = ({
  color,
  label,
  value,
}) => (
  <View style={styles.legendStat}>
    <View style={styles.legendHeader}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

const formatCount = (value: number): string =>
  (Math.round(value * 10) / 10).toString();

const ReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sleep');
  const [rangeId, setRangeId] = useState<ReportRangeId>('7d');
  const [dayWindow, setDayWindow] = useState<DayWindow>({
    startMinutes: DEFAULT_DAY_START_MINUTES,
    endMinutes: DEFAULT_DAY_END_MINUTES,
  });
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const days = useMemo(
    () =>
      buildWeekTimelineDays(
        new Date(),
        dayWindow.startMinutes,
        getReportRangeDays(rangeId)
      ),
    [rangeId, dayWindow.startMinutes]
  );

  const dayStats = useMemo(
    () =>
      buildReportDayStats(
        sessions,
        days,
        dayWindow.startMinutes,
        dayWindow.endMinutes
      ),
    [sessions, days, dayWindow]
  );

  const buckets = useMemo(
    () => bucketReportDays(dayStats, rangeId),
    [dayStats, rangeId]
  );
  const sleepSummary = useMemo(() => summarizeSleep(dayStats), [dayStats]);
  const feedingSummary = useMemo(() => summarizeFeeding(dayStats), [dayStats]);
  const volumeUnit = useMemo(() => preferredVolumeUnit(sessions), [sessions]);

  const loadProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const profile = await fetchUserProfile(token);
      setDayWindow({
        startMinutes: profile.day_start_minutes,
        endMinutes: profile.day_end_minutes,
      });
    } catch {
      // Keep the default day window if the profile can't be loaded.
    }
  }, []);

  const loadRange = useCallback(async () => {
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

      setSessions(
        loaded.filter(
          (session) =>
            session.run_type != null &&
            WEEK_TIMELINE_RUN_TYPES.includes(session.run_type)
        )
      );
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError('Could not load your reports. Please try again.');
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
      void loadRange();
    }, [loadRange])
  );

  const isSleep = activeTab === 'sleep';
  const trackedDays = isSleep
    ? sleepSummary.trackedDays
    : feedingSummary.trackedDays;
  const feedingsAvg =
    feedingSummary.nursingCountAvg + feedingSummary.bottleCountAvg;

  const sleepSeries: ChartSeries[] = [
    {
      color: NIGHT_COLOR,
      value: (bucket) =>
        averageOverTrackedDays(bucket.days, hasSleep, (day) => day.nightMs) /
        MS_PER_HOUR,
    },
    {
      color: NAP_COLOR,
      value: (bucket) =>
        averageOverTrackedDays(bucket.days, hasSleep, (day) => day.napMs) /
        MS_PER_HOUR,
    },
  ];

  const feedingSeries: ChartSeries[] = [
    {
      color: NURSING_COLOR,
      value: (bucket) =>
        averageOverTrackedDays(bucket.days, hasFeeding, (day) => day.nursingCount),
    },
    {
      color: BOTTLE_COLOR,
      value: (bucket) =>
        averageOverTrackedDays(bucket.days, hasFeeding, (day) => day.bottleCount),
    },
  ];

  return (
    <ScreenComponent contentFlex constrainToPhoneViewport={false} style={styles.screen}>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              <View
                style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]}
              />
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {isSleep ? 'Sleep Trends' : 'Feeding Trends'}
        </Text>

        <View style={styles.ranges}>
          {REPORT_RANGES.map((range) => {
            const isActive = range.id === rangeId;
            return (
              <Pressable
                key={range.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Last ${range.days} days`}
                onPress={() => setRangeId(range.id)}
                style={[styles.rangePill, isActive && styles.rangePillActive]}
              >
                <Text
                  style={[styles.rangeLabel, isActive && styles.rangeLabelActive]}
                >
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.rangeDates}>
          {formatRangeLabel(days[0].start, days[days.length - 1].start)}
        </Text>

        <View style={styles.summary}>
          {isSleep ? (
            <>
              <View style={styles.legendColumn}>
                <LegendStat
                  color={NAP_COLOR}
                  label="Nap total avg"
                  value={formatReportDuration(sleepSummary.napAvgMs)}
                />
                <LegendStat
                  color={NIGHT_COLOR}
                  label="Night total avg"
                  value={formatReportDuration(sleepSummary.nightAvgMs)}
                />
              </View>
              <Donut
                slices={[
                  { value: sleepSummary.napAvgMs, color: NAP_COLOR },
                  { value: sleepSummary.nightAvgMs, color: NIGHT_COLOR },
                ]}
              >
                <Text style={styles.donutLabel}>Daily total avg</Text>
                <Text style={styles.donutValue}>
                  {formatReportDuration(sleepSummary.totalAvgMs)}
                </Text>
              </Donut>
            </>
          ) : (
            <>
              <View style={styles.legendColumn}>
                <LegendStat
                  color={NURSING_COLOR}
                  label={`Nursing · ${formatCount(feedingSummary.nursingCountAvg)}/day`}
                  value={formatReportDuration(feedingSummary.nursingAvgMs)}
                />
                <LegendStat
                  color={BOTTLE_COLOR}
                  label={`Bottle · ${formatCount(feedingSummary.bottleCountAvg)}/day`}
                  value={formatVolume(feedingSummary.bottleMlAvg, volumeUnit)}
                />
              </View>
              <Donut
                slices={[
                  { value: feedingSummary.nursingCountAvg, color: NURSING_COLOR },
                  { value: feedingSummary.bottleCountAvg, color: BOTTLE_COLOR },
                ]}
              >
                <Text style={styles.donutLabel}>Feedings / day</Text>
                <Text style={styles.donutValue}>{formatCount(feedingsAvg)}</Text>
              </Donut>
            </>
          )}
          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="white" size="large" />
            </View>
          ) : null}
        </View>

        <Text style={styles.note}>
          {loadError ??
            (isLoading
              ? ' '
              : trackedDays === 0
                ? 'Nothing logged in this period.'
                : `Averaged over ${trackedDays} tracked ${trackedDays === 1 ? 'day' : 'days'}.`)}
        </Text>

        <View style={styles.chartCard}>
          <StackedBarChart
            buckets={buckets}
            series={isSleep ? sleepSeries : feedingSeries}
            axisSteps={isSleep ? SLEEP_AXIS_STEPS_HOURS : FEEDING_AXIS_STEPS}
            formatTick={(value) => (isSleep ? `${value}h` : String(value))}
          />
        </View>
      </ScrollView>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: layout.space16,
    gap: layout.space24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FEEDING_COLORS.border,
  },
  tab: {
    paddingTop: layout.space8,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: layout.fontXl,
    letterSpacing: 1,
    paddingBottom: layout.space8,
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabUnderline: {
    height: vh(3),
    borderRadius: vh(2),
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: ACCENT_COLOR,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: layout.space16,
    paddingTop: layout.space24,
    paddingBottom: layout.space32,
  },
  title: {
    color: '#ffffff',
    fontSize: layout.font3xl,
    fontWeight: '700',
  },
  ranges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: layout.space16,
  },
  rangePill: {
    width: vh(56),
    height: vh(56),
    borderRadius: vh(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePillActive: {
    backgroundColor: '#ffffff',
  },
  rangeLabel: {
    color: '#ffffff',
    fontSize: layout.fontLg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rangeLabelActive: {
    color: '#3d5a73',
  },
  rangeDates: {
    color: '#ffffff',
    fontSize: layout.fontLg,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: layout.space20,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: layout.space20,
  },
  legendColumn: {
    flex: 1,
    gap: layout.space28,
    paddingRight: layout.space8,
  },
  legendStat: {
    gap: layout.space6,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.space8,
  },
  legendDot: {
    width: vh(14),
    height: vh(14),
    borderRadius: vh(7),
  },
  legendLabel: {
    color: '#ffffff',
    fontSize: layout.fontBase,
  },
  legendValue: {
    color: '#ffffff',
    fontSize: layout.font2xl,
    fontWeight: '700',
  },
  donut: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DONUT_STROKE,
  },
  donutLabel: {
    color: '#ffffff',
    fontSize: layout.fontSm,
    textAlign: 'center',
  },
  donutValue: {
    color: '#ffffff',
    fontSize: layout.fontXl,
    fontWeight: '700',
    marginTop: layout.space4,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    color: MUTED_TEXT,
    fontSize: layout.fontSm,
    textAlign: 'center',
    marginTop: layout.space16,
  },
  chartCard: {
    marginTop: layout.space16,
    paddingVertical: layout.space16,
    paddingRight: layout.space12,
    borderRadius: layout.radius12,
    backgroundColor: FEEDING_COLORS.cardBackground,
  },
  chart: {
    height: CHART_HEIGHT,
    position: 'relative',
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
  axisLabel: {
    width: AXIS_WIDTH,
    paddingRight: layout.space6,
    color: MUTED_TEXT,
    fontSize: layout.fontXs,
    textAlign: 'right',
  },
  gridLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: GRID_COLOR,
  },
  columns: {
    ...StyleSheet.absoluteFill,
    left: AXIS_WIDTH,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  // column-reverse puts the first series at the bottom of the stack.
  barStack: {
    width: '60%',
    flexDirection: 'column-reverse',
    borderTopLeftRadius: vh(3),
    borderTopRightRadius: vh(3),
    overflow: 'hidden',
  },
  xLabels: {
    flexDirection: 'row',
    marginLeft: AXIS_WIDTH,
    marginTop: layout.space6,
  },
  xLabelSlot: {
    flex: 1,
    alignItems: 'center',
  },
  // Wider than a 30-day column; the label overflows its slot, centered.
  xLabel: {
    width: vw(48),
    color: MUTED_TEXT,
    fontSize: layout.fontXs,
    textAlign: 'center',
  },
});

export default ReportsScreen;
