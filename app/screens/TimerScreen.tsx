import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable } from 'react-native';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { PlayIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { API_URL } from '@/constants/Config';

const PLACEHOLDER_COLOR = 'rgba(255, 255, 255, 0.75)';

const inputClassName =
  'border-white data-[hover=true]:border-white data-[focus=true]:border-white';
const inputFieldClassName = 'text-white text-lg';
const labelClassName = 'text-white text-lg';
const buttonTextClassName = 'text-white text-lg';

type PickerTarget = 'start' | 'end';

const formatDateTime = (date: Date | null): string => {
  if (!date) return 'Select date and time';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

const TimerScreen: React.FC = () => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

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

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
      if (event.type === 'dismissed') return;
    }

    if (!selectedDate) return;

    if (activePicker === 'start') {
      setStartTime(selectedDate);
      startTimeRef.current = selectedDate;
    } else if (activePicker === 'end') {
      setEndTime(selectedDate);
    }
  };

  const closePicker = () => {
    setActivePicker(null);
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
    setCanSubmit(false);
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

    setCanSubmit(true);
  };

  const handlePlayStopPress = () => {
    if (isRunning) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  const handleSubmit = async () => {
    // TODO: replace path/field names when backend contract is final
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Start and end times are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/timer`,
        {
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_ms: elapsedMs,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      Alert.alert('Success', 'Timer session submitted.');
    } catch (error: unknown) {
      console.error('Failed to submit timer:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || 'Failed to submit timer session';
      Alert.alert('Error', errorMessage);
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

  return (
    <Center className="flex-1 p-6">
      <VStack space="md" className="w-full max-w-[336px] items-center">
        <VStack className="rounded-xl border border-white/90 p-6 w-full">
          <Heading size="2xl" className="text-white">
            Timer
          </Heading>

          <FormControl size="lg" className="w-full mt-4">
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

        <VStack className="rounded-xl border border-white/90 p-6 w-full items-center">
          <Text className="text-white text-5xl font-mono tracking-wider">
            {formatElapsed(elapsedMs)}
          </Text>

          <Button
            variant="solid"
            className="w-full border-2 border-white bg-white mt-6"
            size="md"
            onPress={handlePlayStopPress}
            isDisabled={isSubmitting}
          >
            {isRunning ? (
              <>
                <Ionicons name="stop-circle" size={22} color="black" />
                <ButtonText className={`${buttonTextClassName} text-black`}>
                  Stop
                </ButtonText>
              </>
            ) : (
              <>
                <ButtonIcon as={PlayIcon} className="text-black" />
                <ButtonText className={`${buttonTextClassName} text-black`}>
                  Play
                </ButtonText>
              </>
            )}
          </Button>

          <Button
            variant="solid"
            className="w-full border-2 border-white bg-white mt-4"
            size="md"
            onPress={handleSubmit}
            isDisabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ButtonSpinner color="black" />
            ) : (
              <ButtonText className={`${buttonTextClassName} text-black`}>
                Submit
              </ButtonText>
            )}
          </Button>
        </VStack>
      </VStack>

      {activePicker ? (
        <VStack className="w-full max-w-[336px] mt-4 items-center">
          <DateTimePicker
            value={pickerValue}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
            themeVariant="dark"
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={closePicker} className="mt-2 py-2 px-4">
              <Text className="text-white text-lg font-semibold">Done</Text>
            </Pressable>
          ) : null}
        </VStack>
      ) : null}
    </Center>
  );
};

export default TimerScreen;
