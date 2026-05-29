import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { PlayIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { VStack } from '@/components/ui/vstack';
import {
  buttonTextClassName,
  cardCenteredClassName,
  cardClassName,
} from '@/app/constants/screenLayout';
import { createTimerRun, submitTimerRun } from '@/app/utils/timerHistory';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerElapsedDisplay from '@/app/sharedComponents/TimerElapsedDisplay';

const PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.75)';

const inputClassName =
  'border-white data-[hover=true]:border-white data-[focus=true]:border-white';
const inputFieldClassName = 'text-white text-lg';
const labelClassName = 'text-white text-lg font-bold';

type PickerTarget = 'start' | 'end';

const formatDateTime = (date: Date | null): string => {
  if (!date) return 'Select date and time';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const TimerScreen: React.FC = () => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasStoppedSession, setHasStoppedSession] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

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

  const rollbackPlayState = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setEndTime(null);
    setHasStoppedSession(false);
    setElapsedMs(0);
  }, [clearTimerInterval]);

  const handlePlay = async () => {
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

      const timerRun = await createTimerRun(token, nextStart.toISOString());
      activeTimerRunIdRef.current = timerRun.id;
    } catch {
      rollbackPlayState();
      Alert.alert('Error', 'Could not start timer. Please try again.');
    } finally {
      setIsStarting(false);
    }
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
      void handlePlay();
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
    activeTimerRunIdRef.current = null;
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

    const timerRunId = activeTimerRunIdRef.current;
    if (!timerRunId) {
      Alert.alert('Error', 'No active timer run to submit.');
      return;
    }

    const payload = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_ms: elapsedMs,
    };

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You must be signed in to submit a timer.');
        return;
      }

      await submitTimerRun(token, timerRunId, payload);
      Alert.alert('Success', 'Timer session saved.');
      resetAll();
    } catch {
      Alert.alert('Error', 'Could not submit timer. Please try again.');
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
    <ScreenScrollLayout contentContainerClassName="flex-grow items-center px-6 pb-4 pt-2">
      <TimerElapsedDisplay elapsedMs={elapsedMs} />

      <VStack className={cardCenteredClassName}>
        <Button
          variant="solid"
          className="w-full border-2 border-white bg-white"
          size="md"
          onPress={handlePlayStopPress}
          isDisabled={isSubmitting || isStarting}
          accessibilityLabel={isRunning ? 'Stop' : playButtonLabel}
        >
          {isRunning ? (
            <>
              <Ionicons name="stop-circle" size={22} color="black" />
              <ButtonText className={`${buttonTextClassName} text-black`}>
                Stop
              </ButtonText>
            </>
          ) : isStarting ? (
            <ButtonSpinner color="black" />
          ) : (
            <>
              <ButtonIcon as={PlayIcon} className="text-black" />
              <ButtonText className={`${buttonTextClassName} text-black`}>
                {playButtonLabel}
              </ButtonText>
            </>
          )}
        </Button>

        <Button
          variant="solid"
          className="w-full border-2 border-white bg-white mt-4"
          size="md"
          onPress={handleSubmit}
          isDisabled={!isSubmitEnabled || isSubmitting || isStarting}
        >
          {isSubmitting ? (
            <ButtonSpinner color="black" />
          ) : (
            <ButtonText className={`${buttonTextClassName} text-black`}>
              Submit
            </ButtonText>
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full mt-4 border-2 border-white bg-transparent"
          size="md"
          onPress={handleReset}
          isDisabled={isSubmitting || isStarting || !canReset}
          accessibilityLabel="Reset timer"
        >
          <ButtonText className={buttonTextClassName}>Reset</ButtonText>
        </Button>
      </VStack>

      <VStack className={cardClassName}>
        <FormControl size="lg" className="w-full">
          <FormControlLabel>
            <FormControlLabelText size="lg" className={labelClassName}>
              Start time
            </FormControlLabelText>
          </FormControlLabel>
          <Pressable
            onPress={() => openPicker('start')}
            disabled={isRunning}
            accessibilityRole="button"
            accessibilityLabel="Select start time"
          >
            <Input
              size="lg"
              isDisabled={isRunning}
              className={inputClassName}
              pointerEvents="none"
            >
              <InputField
                value={formatDateTime(startTime)}
                editable={false}
                placeholder="Select date and time"
                placeholderTextColor={PLACEHOLDER_COLOR}
                className={inputFieldClassName}
              />
            </Input>
          </Pressable>
        </FormControl>

        <FormControl size="lg" className="w-full mt-6">
          <FormControlLabel>
            <FormControlLabelText size="lg" className={labelClassName}>
              End time
            </FormControlLabelText>
          </FormControlLabel>
          <Pressable
            onPress={() => openPicker('end')}
            disabled={isRunning}
            accessibilityRole="button"
            accessibilityLabel="Select end time"
          >
            <Input
              size="lg"
              isDisabled={isRunning}
              className={inputClassName}
              pointerEvents="none"
            >
              <InputField
                value={formatDateTime(endTime)}
                editable={false}
                placeholder="Select date and time"
                placeholderTextColor={PLACEHOLDER_COLOR}
                className={inputFieldClassName}
              />
            </Input>
          </Pressable>
        </FormControl>
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

export default TimerScreen;
