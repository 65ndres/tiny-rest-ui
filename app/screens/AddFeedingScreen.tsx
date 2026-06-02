import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { buttonTextClassName, cardClassName } from '@/app/constants/screenLayout';
import { FEEDING_COLORS } from '@/app/constants/feedingTheme';
import BottleFeedingForm from '@/app/sharedComponents/feeding/BottleFeedingForm';
import FeedingSegmentTabs, {
  type FeedingTab,
} from '@/app/sharedComponents/feeding/FeedingSegmentTabs';
import FeedingHistoryPanel from '@/app/sharedComponents/feeding/FeedingHistoryPanel';
import NursingSideButton from '@/app/sharedComponents/feeding/NursingSideButton';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerElapsedDisplay from '@/app/sharedComponents/TimerElapsedDisplay';
import {
  createBottleFeeding,
  createTimerRun,
  fetchActiveTimerRun,
  fetchTimerRuns,
  filterFeedingSessions,
  getLastNursingSide,
  NURSING_RUN_TYPES,
  submitTimerRun,
  type BottleMetadata,
  type TimerRunType,
  type TimerSession,
} from '@/app/utils/timerHistory';

type RootDrawerParamList = {
  AddFeeding: undefined;
  Home: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList, 'AddFeeding'>;

type NursingSide = 'left' | 'right';

const runTypeForSide = (side: NursingSide): TimerRunType =>
  side === 'left' ? 'nursing_left' : 'nursing_right';

const sideForRunType = (runType: TimerRunType): NursingSide | null => {
  if (runType === 'nursing_left') return 'left';
  if (runType === 'nursing_right') return 'right';
  return null;
};

const formatStartTimeLabel = (date: Date | null): string => {
  if (!date) return 'Set time';
  return date.toLocaleString(undefined, {
    weekday: undefined,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const AddFeedingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<FeedingTab>('nursing');

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [activeSide, setActiveSide] = useState<NursingSide | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasStoppedSession, setHasStoppedSession] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [lastSide, setLastSide] = useState<NursingSide | null>(null);

  const [bottleStartTime, setBottleStartTime] = useState(() => new Date());
  const [bottlePickerOpen, setBottlePickerOpen] = useState(false);
  const [bottleMetadata, setBottleMetadata] = useState<BottleMetadata>({
    unit: 'oz',
    amount: 0,
  });
  const [isSavingBottle, setIsSavingBottle] = useState(false);
  const [history, setHistory] = useState<TimerSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTimerRunIdRef = useRef<number | null>(null);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateElapsed = useCallback(() => {
    const start = startTimeRef.current;
    if (!start) return;
    setElapsedMs(Date.now() - start.getTime());
  }, []);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    if (!isRunning || !startTime || !endTime) return;
    setElapsedMs(Math.max(0, endTime.getTime() - startTime.getTime()));
  }, [startTime, endTime, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      clearTimerInterval();
      return;
    }
    updateElapsed();
    intervalRef.current = setInterval(updateElapsed, 1000);
    return () => clearTimerInterval();
  }, [isRunning, clearTimerInterval, updateElapsed]);

  useEffect(() => () => clearTimerInterval(), [clearTimerInterval]);

  const applyNursingContextFromRuns = useCallback(
    (allRuns: TimerSession[], activeRun: Awaited<ReturnType<typeof fetchActiveTimerRun>>) => {
      setLastSide(getLastNursingSide(allRuns));

      if (
        activeRun &&
        activeRun.run_type &&
        NURSING_RUN_TYPES.includes(activeRun.run_type)
      ) {
        const side = sideForRunType(activeRun.run_type);
        if (!side) return;

        const parsedStart = new Date(activeRun.start_time);
        setStartTime(parsedStart);
        startTimeRef.current = parsedStart;
        setActiveSide(side);
        setIsRunning(true);
        setEndTime(null);
        setHasStoppedSession(false);
        activeTimerRunIdRef.current = activeRun.id;
        setElapsedMs(Date.now() - parsedStart.getTime());
      }
    },
    []
  );

  const loadFeedingHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setHistory([]);
        return;
      }

      const [activeRun, allRuns] = await Promise.all([
        fetchActiveTimerRun(token),
        fetchTimerRuns(token),
      ]);

      setHistory(filterFeedingSessions(allRuns));
      applyNursingContextFromRuns(allRuns, activeRun);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [applyNursingContextFromRuns]);

  useFocusEffect(
    useCallback(() => {
      void loadFeedingHistory();
    }, [loadFeedingHistory])
  );

  const rollbackPlayState = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setActiveSide(null);
    setEndTime(null);
    setHasStoppedSession(false);
    setElapsedMs(0);
  }, [clearTimerInterval]);

  const startSide = useCallback(
    async (side: NursingSide, options?: { forceNew?: boolean }) => {
      const now = new Date();
      let nextStart = startTime;

      if (options?.forceNew) {
        activeTimerRunIdRef.current = null;
        nextStart = now;
        setStartTime(now);
        startTimeRef.current = now;
        setEndTime(null);
        setHasStoppedSession(false);
      } else if (!nextStart) {
        nextStart = now;
        setStartTime(now);
        startTimeRef.current = now;
      }

      setActiveSide(side);
      if (!options?.forceNew) {
        setEndTime(null);
        setHasStoppedSession(false);
      }
      setIsRunning(true);
      setElapsedMs(Date.now() - nextStart.getTime());

      if (activeTimerRunIdRef.current) {
        return;
      }

      setIsStarting(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          rollbackPlayState();
          Alert.alert('Error', 'You must be signed in to start a timer.');
          return;
        }

        const timerRun = await createTimerRun(
          token,
          nextStart.toISOString(),
          { run_type: runTypeForSide(side) }
        );
        activeTimerRunIdRef.current = timerRun.id;
      } catch {
        rollbackPlayState();
        Alert.alert('Error', 'Could not start nursing timer.');
      } finally {
        setIsStarting(false);
      }
    },
    [rollbackPlayState, startTime]
  );

  const handleSidePress = async (side: NursingSide) => {
    if (isSubmitting || isStarting) return;

    if (isRunning && activeSide === side) {
      const now = new Date();
      clearTimerInterval();
      setIsRunning(false);
      setEndTime(now);
      if (startTimeRef.current) {
        setElapsedMs(now.getTime() - startTimeRef.current.getTime());
      }
      setHasStoppedSession(true);
      return;
    }

    if (isRunning && activeSide !== side) {
      Alert.alert(
        'Switch side?',
        'Starting the other side will stop the current timer.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: () => void startSide(side, { forceNew: true }),
          },
        ]
      );
      return;
    }

    if (hasStoppedSession) {
      Alert.alert('Save or reset', 'Submit or reset before starting again.');
      return;
    }

    await startSide(side);
  };

  const resetNursing = () => {
    clearTimerInterval();
    setIsRunning(false);
    setActiveSide(null);
    setStartTime(null);
    startTimeRef.current = null;
    setEndTime(null);
    setElapsedMs(0);
    setHasStoppedSession(false);
    activeTimerRunIdRef.current = null;
  };

  const handleNursingSubmit = async () => {
    if (!startTime || !endTime || !activeTimerRunIdRef.current) {
      Alert.alert('Error', 'Stop the timer before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save.');
        return;
      }

      await submitTimerRun(token, activeTimerRunIdRef.current, {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_ms: elapsedMs,
      });

      Alert.alert('Success', 'Nursing session saved.');
      resetNursing();
      void loadFeedingHistory();
    } catch {
      Alert.alert('Error', 'Could not save nursing session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBottleSave = async () => {
    setIsSavingBottle(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save.');
        return;
      }

      await createBottleFeeding(token, {
        start_time: bottleStartTime.toISOString(),
        metadata: bottleMetadata,
      });

      Alert.alert('Success', 'Bottle feeding saved.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save bottle feeding.');
    } finally {
      setIsSavingBottle(false);
    }
  };

  const isNursingSubmitEnabled =
    Boolean(startTime && endTime && hasStoppedSession) && !isRunning;

  return (
    <View style={styles.screen}>
      <ScreenScrollLayout contentContainerClassName="flex-grow px-4 pb-4 pt-2">
        <View className={cardClassName} style={styles.panel}>
          <FeedingSegmentTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'nursing' ? (
            <>
              <View style={styles.startTimeRow}>
                <Text style={styles.rowLabel}>Start Time</Text>
                <Pressable
                  onPress={() => !isRunning && setIsPickerOpen(true)}
                  disabled={isRunning}
                >
                  <Text style={styles.link}>
                    {formatStartTimeLabel(startTime)}
                  </Text>
                </Pressable>
              </View>

              <TimerElapsedDisplay elapsedMs={elapsedMs} />

              <View style={styles.sidesRow}>
                <NursingSideButton
                  side="left"
                  isRunning={isRunning && activeSide === 'left'}
                  showLastSideBadge={lastSide === 'left'}
                  onPress={() => void handleSidePress('left')}
                  disabled={isSubmitting || isStarting}
                />
                <NursingSideButton
                  side="right"
                  isRunning={isRunning && activeSide === 'right'}
                  showLastSideBadge={lastSide === 'right'}
                  onPress={() => void handleSidePress('right')}
                  disabled={isSubmitting || isStarting}
                />
              </View>

              {isNursingSubmitEnabled && (
                <Button
                  variant="solid"
                  className="w-full mt-6 border-2 border-white bg-white"
                  size="md"
                  onPress={() => void handleNursingSubmit()}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ButtonSpinner color="black" />
                  ) : (
                    <ButtonText className={`${buttonTextClassName} text-black`}>
                      Save
                    </ButtonText>
                  )}
                </Button>
              )}

              {(isRunning || hasStoppedSession || startTime) && (
                <Pressable onPress={resetNursing} style={styles.resetLink}>
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              )}
            </>
          ) : (
            <BottleFeedingForm
              startTimeLabel={formatStartTimeLabel(bottleStartTime)}
              onPressStartTime={() => setBottlePickerOpen(true)}
              metadata={bottleMetadata}
              onMetadataChange={setBottleMetadata}
              onSave={() => void handleBottleSave()}
              isSaving={isSavingBottle}
            />
          )}
        </View>

        <FeedingHistoryPanel sessions={history} isLoading={historyLoading} />
      </ScreenScrollLayout>

      <TimerDateTimePickerDrawer
        isOpen={isPickerOpen}
        title="Start time"
        value={startTime ?? new Date()}
        onChange={(date) => {
          setStartTime(date);
          startTimeRef.current = date;
        }}
        onClose={() => setIsPickerOpen(false)}
      />

      <TimerDateTimePickerDrawer
        isOpen={bottlePickerOpen}
        title="Start time"
        value={bottleStartTime}
        onChange={setBottleStartTime}
        onClose={() => setBottlePickerOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  startTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  rowLabel: {
    color: FEEDING_COLORS.text,
    fontSize: 17,
  },
  link: {
    color: FEEDING_COLORS.link,
    fontSize: 17,
    textDecorationLine: 'underline',
  },
  sidesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  resetText: {
    color: FEEDING_COLORS.text,
    fontSize: 17,
  },
});

export default AddFeedingScreen;
