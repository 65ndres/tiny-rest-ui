import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable } from 'react-native';
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
  createBottleFeeding,
  createTimerRun,
  fetchActiveTimerRun,
  fetchTimerRuns,
  filterFeedingSessions,
  formatClockTime,
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

  const openPicker = (target: PickerTarget) => {
    if (isRunning) return;
    setActivePicker(target);
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const handlePickerDateChange = (selectedDate: Date) => {
    if (activePicker === 'start') {
      setStartTime(selectedDate);
      startTimeRef.current = selectedDate;
    } else if (activePicker === 'end') {
      setEndTime(selectedDate);
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
    const now = new Date();
    let nextStart = startTime;
    const side = activeSide ?? selectedSide;

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
  }, [activeSide, rollbackPlayState, selectedSide, startTime]);

  const handleStop = () => {
    const now = new Date();
    clearTimerInterval();
    setIsRunning(false);
    setEndTime(now);

    const start = startTimeRef.current;
    if (start) {
      setElapsedMs(now.getTime() - start.getTime());
    }

    setHasStoppedSession(true);
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
                <TimerElapsedDisplay elapsedMs={elapsedMs} />

                <Text className={`${timerSectionLabelClassName} mt-4`}>Time</Text>
                <TimerSettingRow
                  label="Started at:"
                  value={formatClockTime(startTime)}
                  placeholder="Select time"
                  onPress={() => openPicker('start')}
                  disabled={isRunning}
                  accessibilityLabel="Select start time"
                  isFirst
                />
                <TimerSettingRow
                  label="Ended at:"
                  value={formatClockTime(endTime)}
                  placeholder="Select time"
                  onPress={() => openPicker('end')}
                  disabled={isRunning}
                  accessibilityLabel="Select end time"
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
                />

                <TimerOutlineButton
                  label={isRunning ? 'Stop' : playButtonLabel}
                  iconName={isRunning ? 'stop-circle-sharp' : 'play-sharp'}
                  onPress={handlePlayStopPress}
                  disabled={isSubmitting}
                  isLoading={isStarting}
                  variant="primary"
                  size="lg"
                  className="mt-4"
                  accessibilityLabel={isRunning ? 'Stop' : playButtonLabel}
                />

                <TimerOutlineButton
                  label="Save"
                  iconName="save-sharp"
                  onPress={() => void handleNursingSubmit()}
                  disabled={!isNursingSubmitEnabled || isSubmitting}
                  isLoading={isSubmitting}
                  size="lg"
                  className="mt-3"
                />

                <Pressable
                  onPress={resetNursing}
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

          <FeedingHistoryPanel sessions={history} isLoading={historyLoading} />
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
