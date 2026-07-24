import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  timerContentStackClassName,
  timerScrollContentClassName,
  timerSectionLabelClassName,
  timerSessionResetLinkClassName,
} from '@/app/constants/screenLayout';
import BottleFeedingForm from '@/app/sharedComponents/feeding/BottleFeedingForm';
import FeedingSegmentTabs, {
  type FeedingTab,
} from '@/app/sharedComponents/feeding/FeedingSegmentTabs';
import FeedingHistoryPanel from '@/app/sharedComponents/feeding/FeedingHistoryPanel';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerElapsedDisplay from '@/app/sharedComponents/TimerElapsedDisplay';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';
import {
  confirmReplaceActiveTimer,
  createBottleFeeding,
  createTimerRun,
  deleteTimerRun,
  fetchActiveTimerRun,
  fetchTimerRuns,
  filterFeedingSessions,
  formatClockTime,
  getLastNursingSide,
  normalizePickedTimerDate,
  normalizeTimerSessionTimes,
  NURSING_RUN_TYPES,
  submitTimerRun,
  type BottleMetadata,
  type TimerRunType,
  type TimerSession,
} from '@/app/utils/timerHistory';
import {
  clearWidgetTimerAndRefresh,
  getStoredPausedElapsedForRun,
  refreshWidgetState,
  syncLocalTimerToWidget,
  syncWidgetActiveTimer,
} from '@/app/utils/widgetStorage';

type RootDrawerParamList = {
  AddFeeding: undefined;
  Home: undefined;
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList, 'AddFeeding'>;

type NursingSide = 'left' | 'right';

type PickerTarget = 'start' | 'end';

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
  const [selectedSide, setSelectedSide] = useState<NursingSide>('left');
  const [activeSide, setActiveSide] = useState<NursingSide | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasStoppedSession, setHasStoppedSession] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
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
  const loadSeqRef = useRef(0);

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
    if (isRunning || !startTime || !endTime) return;
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
      const last = getLastNursingSide(allRuns);
      setLastSide(last);
      if (last) {
        setSelectedSide(last);
      }

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
        activeTimerRunIdRef.current = activeRun.id;

        const pausedElapsed = getStoredPausedElapsedForRun(activeRun.start_time);
        if (pausedElapsed != null) {
          const end = new Date(parsedStart.getTime() + pausedElapsed);
          setIsRunning(false);
          setEndTime(end);
          setHasStoppedSession(true);
          setElapsedMs(pausedElapsed);
          syncLocalTimerToWidget({
            startTime: parsedStart,
            endTime: end,
            isRunning: false,
            runType: activeRun.run_type,
          });
        } else {
          setIsRunning(true);
          setEndTime(null);
          setHasStoppedSession(false);
          setElapsedMs(Date.now() - parsedStart.getTime());
          syncWidgetActiveTimer(activeRun);
        }
        return;
      }

      // Sleep (or no) timer is active — clear stale local nursing UI.
      if (activeTimerRunIdRef.current != null) {
        clearTimerInterval();
        setIsRunning(false);
        setActiveSide(null);
        setStartTime(null);
        startTimeRef.current = null;
        setEndTime(null);
        setElapsedMs(0);
        setHasStoppedSession(false);
        activeTimerRunIdRef.current = null;
      }
    },
    [clearTimerInterval]
  );

  const loadFeedingHistory = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setHistoryLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        if (seq === loadSeqRef.current) setHistory([]);
        return;
      }

      const [activeRun, allRuns] = await Promise.all([
        fetchActiveTimerRun(token),
        fetchTimerRuns(token),
      ]);

      // Ignore stale responses (e.g. a fetch that started before reset).
      if (seq !== loadSeqRef.current) return;

      setHistory(filterFeedingSessions(allRuns));
      applyNursingContextFromRuns(allRuns, activeRun);
      void refreshWidgetState(token);
    } catch {
      if (seq === loadSeqRef.current) setHistory([]);
    } finally {
      if (seq === loadSeqRef.current) setHistoryLoading(false);
    }
  }, [applyNursingContextFromRuns]);

  useFocusEffect(
    useCallback(() => {
      void loadFeedingHistory();
    }, [loadFeedingHistory])
  );

  const openPicker = (target: PickerTarget) => {
    if (isRunning) return;
    setActivePicker(target);
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const handlePickerDateChange = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextStart = startTime;
    let nextEnd = endTime;
    const side = activeSide ?? selectedSide;

    if (activePicker === 'start') {
      nextStart = normalizePickedTimerDate(selectedDate, today);
      setStartTime(nextStart);
      startTimeRef.current = nextStart;
    } else if (activePicker === 'end') {
      const base = startTime ?? today;
      nextEnd = normalizePickedTimerDate(selectedDate, base);
      setEndTime(nextEnd);
    }

    if (
      activeTimerRunIdRef.current != null &&
      !isRunning &&
      nextStart &&
      (hasStoppedSession || nextEnd)
    ) {
      syncLocalTimerToWidget({
        startTime: nextStart,
        endTime: nextEnd,
        isRunning: false,
        runType: runTypeForSide(side),
      });
    }
  };

  const rollbackPlayState = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setActiveSide(null);
    setEndTime(null);
    setHasStoppedSession(false);
    setElapsedMs(0);
  }, [clearTimerInterval]);

  const handlePlay = useCallback(async () => {
    const side = activeSide ?? selectedSide;
    const runType = runTypeForSide(side);

    if (activeTimerRunIdRef.current) {
      const now = new Date();
      let nextStart = startTime;

      if (!nextStart) {
        nextStart = now;
        setStartTime(now);
        startTimeRef.current = now;
      }

      setActiveSide(side);
      setEndTime(null);
      setHasStoppedSession(false);
      setElapsedMs(0);
      setIsRunning(true);
      setElapsedMs(Date.now() - nextStart.getTime());
      syncLocalTimerToWidget({
        startTime: nextStart,
        isRunning: true,
        runType,
      });
      return;
    }

    setIsStarting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to start a timer.');
        return;
      }

      const canStart = await confirmReplaceActiveTimer(token);
      if (!canStart) {
        return;
      }

      const now = new Date();
      let nextStart = startTime;

      if (!nextStart) {
        nextStart = now;
        setStartTime(now);
        startTimeRef.current = now;
      }

      setActiveSide(side);
      setEndTime(null);
      setHasStoppedSession(false);
      setElapsedMs(0);
      setIsRunning(true);
      setElapsedMs(Date.now() - nextStart.getTime());
      syncLocalTimerToWidget({
        startTime: nextStart,
        isRunning: true,
        runType,
      });

      const timerRun = await createTimerRun(
        token,
        nextStart.toISOString(),
        { run_type: runType }
      );
      activeTimerRunIdRef.current = timerRun.id;
      syncWidgetActiveTimer(timerRun);
    } catch {
      rollbackPlayState();
      const token = await AsyncStorage.getItem('token');
      if (token) {
        void refreshWidgetState(token);
      }
      Alert.alert('Error', 'Could not start nursing timer.');
    } finally {
      setIsStarting(false);
    }
  }, [activeSide, rollbackPlayState, selectedSide, startTime]);

  const handleStop = () => {
    const now = new Date();
    clearTimerInterval();
    setIsRunning(false);
    setEndTime(now);

    const start = startTimeRef.current;
    const elapsed = start ? now.getTime() - start.getTime() : 0;
    if (start) {
      setElapsedMs(elapsed);
    }

    setHasStoppedSession(true);

    if (start) {
      const side = activeSide ?? selectedSide;
      syncLocalTimerToWidget({
        startTime: start,
        endTime: now,
        isRunning: false,
        runType: runTypeForSide(side),
      });
    }
  };

  const handlePlayStopPress = () => {
    if (isRunning) {
      handleStop();
    } else {
      void handlePlay();
    }
  };

  const pickSide = () => {
    if (isRunning || hasStoppedSession || isSubmitting || isStarting) return;

    Alert.alert('Side', undefined, [
      {
        text: 'Left',
        onPress: () => setSelectedSide('left'),
      },
      {
        text: 'Right',
        onPress: () => setSelectedSide('right'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const resetNursing = () => {
    clearTimerInterval();
    setIsRunning(false);
    setActiveSide(null);
    setActivePicker(null);
    setStartTime(null);
    startTimeRef.current = null;
    setEndTime(null);
    setElapsedMs(0);
    setHasStoppedSession(false);
    activeTimerRunIdRef.current = null;
  };

  const handleResetNursing = () => {
    const shouldReset =
      isRunning ||
      !!startTime ||
      !!endTime ||
      elapsedMs > 0;
    if (!shouldReset) return;

    const runId = activeTimerRunIdRef.current;
    // Invalidate any in-flight load so it can't restore this run.
    loadSeqRef.current += 1;
    resetNursing();

    void (async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        if (!token) {
          await clearWidgetTimerAndRefresh(null);
          return;
        }

        let idToDelete = runId;
        if (idToDelete == null) {
          const activeRun = await fetchActiveTimerRun(token);
          if (
            activeRun?.run_type &&
            NURSING_RUN_TYPES.includes(activeRun.run_type)
          ) {
            idToDelete = activeRun.id;
          }
        }

        if (idToDelete != null) {
          await deleteTimerRun(token, idToDelete);
        }

        await clearWidgetTimerAndRefresh(token);
        await loadFeedingHistory();
      } catch (error) {
        const apiMessage =
          axios.isAxiosError(error) &&
          typeof error.response?.data?.error === 'string'
            ? error.response.data.error
            : null;
        Alert.alert(
          'Error',
          apiMessage ?? 'Could not delete timer run. Please try again.'
        );
        if (token) {
          await clearWidgetTimerAndRefresh(token);
          await loadFeedingHistory();
        }
      }
    })();
  };

  const handleNursingSubmit = async () => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Start and end times are required.');
      return;
    }

    if (endTime.getTime() <= startTime.getTime()) {
      Alert.alert('Error', 'End time must be after start time.');
      return;
    }

    const { start: normalizedStart, end: normalizedEnd } =
      normalizeTimerSessionTimes(startTime, endTime);
    const durationMs = Math.max(
      0,
      normalizedEnd.getTime() - normalizedStart.getTime()
    );

    const payload = {
      start_time: normalizedStart.toISOString(),
      end_time: normalizedEnd.toISOString(),
      duration_ms: durationMs,
    };

    const side = activeSide ?? selectedSide;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to save.');
        return;
      }

      let timerRunId = activeTimerRunIdRef.current;
      if (!timerRunId) {
        const timerRun = await createTimerRun(
          token,
          normalizedStart.toISOString(),
          { run_type: runTypeForSide(side) }
        );
        timerRunId = timerRun.id;
      }

      await submitTimerRun(token, timerRunId, payload);

      Alert.alert('Success', 'Nursing session saved.');
      resetNursing();
      void refreshWidgetState(token);
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

  const isNursingSubmitEnabled = Boolean(startTime && endTime) && !isRunning;

  const canResetNursing =
    isRunning || !!startTime || !!endTime || elapsedMs > 0;

  const displayedSide = activeSide ?? selectedSide;
  const sideLabel = displayedSide === 'left' ? 'Left' : 'Right';
  const canPickSide =
    !isRunning && !hasStoppedSession && !isSubmitting && !isStarting;

  const playButtonLabel =
    !isRunning && startTime && hasStoppedSession ? 'Resume' : 'Start';

  const pickerValue =
    activePicker === 'start'
      ? startTime ?? new Date()
      : activePicker === 'end'
        ? endTime ?? new Date()
        : new Date();

  return (
    <>
      <ScreenScrollLayout contentContainerClassName={timerScrollContentClassName}>
        <VStack space="md" className={timerContentStackClassName}>
          <TimerSectionCard>
            <FeedingSegmentTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'nursing' ? (
              <>
              <View style={{ paddingBottom: 20, paddingTop: 40 }}>
                <TimerElapsedDisplay elapsedMs={elapsedMs} />
                </View>

                <Text className={`${timerSectionLabelClassName} mt-4`}>Time</Text>
                <TimerSettingRow
                  label="Started at:"
                  value={formatClockTime(startTime)}
                  placeholder="Select time"
                  onPress={() => openPicker('start')}
                  disabled={isRunning}
                  accessibilityLabel="Select start time"
                  isFirst
                  size="lg"
                />
                <TimerSettingRow
                  label="Ended at:"
                  value={formatClockTime(endTime)}
                  placeholder="Select time"
                  onPress={() => openPicker('end')}
                  disabled={isRunning}
                  accessibilityLabel="Select end time"
                  size="lg"
                />

                <TimerSettingRow
                  label="Side:"
                  value={
                    lastSide === displayedSide && canPickSide
                      ? `${sideLabel} (last)`
                      : sideLabel
                  }
                  placeholder="Select side"
                  onPress={pickSide}
                  disabled={!canPickSide}
                  accessibilityLabel="Select nursing side"
                  size="lg"
                />

                <TimerOutlineButton
                  label={isRunning ? 'Stop' : playButtonLabel}
                  iconName={isRunning ? 'stop-circle-sharp' : 'play-sharp'}
                  onPress={handlePlayStopPress}
                  disabled={isSubmitting}
                  isLoading={isStarting}
                  variant="solid"
                  size="xl"
                  className="mt-4"
                  accessibilityLabel={isRunning ? 'Stop' : playButtonLabel}
                />

                <TimerOutlineButton
                  label="Save"
                  iconName="save-sharp"
                  onPress={() => void handleNursingSubmit()}
                  disabled={!isNursingSubmitEnabled || isSubmitting}
                  isLoading={isSubmitting}
                  size="xl"
                  variant="solid"
                  className="mt-3"
                />

                <Pressable
                  onPress={handleResetNursing}
                  disabled={isSubmitting || isStarting || !canResetNursing}
                  accessibilityRole="button"
                  accessibilityLabel="Reset nursing timer"
                >
                  <Text
                    className={`${timerSessionResetLinkClassName}${isSubmitting || isStarting || !canResetNursing ? ' opacity-40' : ''}`}
                  >
                    Reset
                  </Text>
                </Pressable>
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
          </TimerSectionCard>

          <FeedingHistoryPanel
            sessions={history}
            isLoading={historyLoading}
            onSessionDeleted={(id) =>
              setHistory((prev) => prev.filter((session) => session.id !== id))
            }
          />
        </VStack>
      </ScreenScrollLayout>

      <TimerDateTimePickerDrawer
        isOpen={activePicker !== null}
        title={activePicker === 'end' ? 'End time' : 'Start time'}
        value={pickerValue}
        onChange={handlePickerDateChange}
        onClose={closePicker}
      />

      <TimerDateTimePickerDrawer
        isOpen={bottlePickerOpen}
        title="Start time"
        value={bottleStartTime}
        onChange={setBottleStartTime}
        onClose={() => setBottlePickerOpen(false)}
      />
    </>
  );
};

export default AddFeedingScreen;
