import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  timerContentStackClassName,
  timerHintClassName,
  timerPageTitleClassName,
  timerResetLinkClassName,
  timerScrollContentClassName,
} from '@/app/constants/screenLayout';
import {
  createLocalTimerSession,
  formatClockTime,
  loadTimerHistoryFromCache,
  prependTimerSession,
  saveTimerHistoryToCache,
  type TimerSession,
} from '@/app/utils/timerHistory';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerElapsedDisplay from '@/app/sharedComponents/TimerElapsedDisplay';
import TimerHistoryPanel from '@/app/sharedComponents/TimerHistoryPanel';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';

type PickerTarget = 'start' | 'end';

const TimerScreenGuest: React.FC = () => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasStoppedSession, setHasStoppedSession] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<TimerSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const cached = await loadTimerHistoryFromCache();
    setHistory(cached);
    setHistoryLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

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

    return () => {
      clearTimerInterval();
    };
  }, [isRunning, clearTimerInterval, updateElapsed]);

  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  const openPicker = (target: PickerTarget) => {
    if (target === 'start' && isRunning) return;
    if (target === 'end' && isRunning) return;
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

  const handlePlay = () => {
    const now = new Date();
    let nextStart = startTime;

    if (!nextStart) {
      nextStart = now;
      setStartTime(now);
      startTimeRef.current = now;
    }

    setEndTime(null);
    setHasStoppedSession(false);
    setElapsedMs(0);
    setIsRunning(true);
    setElapsedMs(Date.now() - nextStart.getTime());
  };

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
      handlePlay();
    }
  };

  const resetAll = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setActivePicker(null);
    setStartTime(null);
    startTimeRef.current = null;
    setEndTime(null);
    setElapsedMs(0);
    setHasStoppedSession(false);
  }, [clearTimerInterval]);

  const handleReset = () => {
    if (isRunning) {
      resetAll();
      return;
    }

    if (startTime && endTime) {
      resetAll();
      return;
    }

    if (startTime || endTime || elapsedMs > 0) {
      resetAll();
    }
  };

  const canReset =
    isRunning || !!startTime || !!endTime || elapsedMs > 0;

  const handleSubmit = async () => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Start and end times are required.');
      return;
    }

    const payload = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_ms: elapsedMs,
    };

    setIsSubmitting(true);
    try {
      const localSession = createLocalTimerSession(payload);
      const nextHistory = prependTimerSession(history, localSession);
      setHistory(nextHistory);
      await saveTimerHistoryToCache(nextHistory);

      Alert.alert('Success', 'Timer session saved.');
      resetAll();
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickerValue =
    activePicker === 'start'
      ? startTime ?? new Date()
      : activePicker === 'end'
        ? endTime ?? new Date()
        : new Date();

  const isSubmitEnabled = Boolean(startTime && endTime) && !isRunning;

  const playButtonLabel =
    !isRunning && startTime && hasStoppedSession ? 'Resume' : 'Start';

  return (
    <ScreenScrollLayout contentContainerClassName={timerScrollContentClassName}>
      <VStack space="md" className={timerContentStackClassName}>
        <Heading size="2xl" className={timerPageTitleClassName}>
          Add Sleep
        </Heading>

        <Text className={timerHintClassName}>
          Tap Start when nap begins.
        </Text>

        <TimerElapsedDisplay elapsedMs={elapsedMs} />

        <TimerSectionCard title="Session">
          <TimerOutlineButton
            label={isRunning ? 'Stop' : playButtonLabel}
            iconName={isRunning ? 'stop-circle-sharp' : 'play-sharp'}
            onPress={handlePlayStopPress}
            disabled={isSubmitting}
            variant="primary"
            accessibilityLabel={isRunning ? 'Stop' : playButtonLabel}
          />
          <TimerOutlineButton
            label="Save session"
            iconName="save-sharp"
            onPress={() => void handleSubmit()}
            disabled={!isSubmitEnabled || isSubmitting}
            isLoading={isSubmitting}
            className="mt-3"
          />
          <Pressable
            onPress={handleReset}
            disabled={isSubmitting || !canReset}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <Text
              className={`${timerResetLinkClassName}${isSubmitting || !canReset ? ' opacity-40' : ''}`}
            >
              Reset
            </Text>
          </Pressable>
        </TimerSectionCard>

        <TimerSectionCard title="Time" showAccent>
          <TimerSettingRow
            label="Nap started at:"
            value={formatClockTime(startTime)}
            placeholder="Select time"
            onPress={() => openPicker('start')}
            disabled={isRunning}
            accessibilityLabel="Select start time"
            isFirst
          />
          <TimerSettingRow
            label="Nap ended at:"
            value={formatClockTime(endTime)}
            placeholder="Select time"
            onPress={() => openPicker('end')}
            disabled={isRunning}
            accessibilityLabel="Select end time"
          />
        </TimerSectionCard>

        <TimerHistoryPanel sessions={history} isLoading={historyLoading} />
      </VStack>

      <TimerDateTimePickerDrawer
        isOpen={activePicker !== null}
        title={activePicker === 'end' ? 'End time' : 'Start time'}
        value={pickerValue}
        onChange={handlePickerDateChange}
        onClose={closePicker}
      />
    </ScreenScrollLayout>
  );
};

export default TimerScreenGuest;
