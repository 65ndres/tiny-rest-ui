import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, Platform, StyleSheet, View } from 'react-native';
import {
  Drawer,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer';
import { Heading } from '@/components/ui/heading';
import { TIMER_SOLID_BUTTON_CONTENT_COLOR } from '@/app/constants/screenLayout';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import {
  isUsableTimerPickerDate,
  resolveTimerPickerValue,
} from '@/app/utils/timerHistory';

const DATE_PICKER_BG = require('../../assets/images/bg-date-picker.png');
const SPARKLE_ICON = require('../../assets/images/sparkle.png');

/**
 * iOS spinner needs BOTH min and max. Min-only (or missing max after a
 * previous max-bound picker) can land the wheels on Dec 31 / epoch.
 * @see https://github.com/react-native-datetimepicker/datetimepicker/issues/962
 */
const DEFAULT_MINIMUM_DATE = new Date(2000, 0, 1);
const DEFAULT_MAXIMUM_DATE = new Date(2100, 0, 1);

type TimerDateTimePickerDrawerProps = {
  isOpen: boolean;
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  mode?: 'date' | 'datetime' | 'time';
  /** When set (e.g. Started at), blocks selecting dates after this instant. */
  maximumDate?: Date;
  minimumDate?: Date;
  /** Bump on each open so the native spinner remounts on today when the field is empty. */
  openGeneration?: number;
};

const TimerDateTimePickerDrawer: React.FC<TimerDateTimePickerDrawerProps> = ({
  isOpen,
  title,
  value,
  onChange,
  onClose,
  mode = 'datetime',
  maximumDate,
  minimumDate = DEFAULT_MINIMUM_DATE,
  openGeneration = 0,
}) => {
  const safeValue = resolveTimerPickerValue(value, new Date());
  const [draftDate, setDraftDate] = useState(safeValue);

  const resolvedMaximumDate =
    maximumDate ?? (mode === 'date' ? new Date() : DEFAULT_MAXIMUM_DATE);

  useEffect(() => {
    if (!isOpen) return;
    setDraftDate(resolveTimerPickerValue(value, new Date()));
  }, [isOpen, value, openGeneration]);

  const resolvedMode =
    mode === 'datetime' && Platform.OS !== 'ios' ? 'time' : mode;

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        onClose();
        return;
      }

      if (selectedDate && isUsableTimerPickerDate(selectedDate)) {
        onChange(selectedDate);
      } else if (selectedDate) {
        onChange(resolveTimerPickerValue(null, new Date()));
      }
      onClose();
      return;
    }

    // iOS often fires onChange on mount with epoch/Dec 31 junk — ignore it so
    // draft (and Done) stay on today when the field is empty.
    if (!selectedDate || !isUsableTimerPickerDate(selectedDate)) {
      return;
    }
    setDraftDate(selectedDate);
  };

  const handleDone = () => {
    const committed = isUsableTimerPickerDate(draftDate)
      ? draftDate
      : resolveTimerPickerValue(null, new Date());
    onChange(committed);
    onClose();
  };

  const pickerDisplayValue = isUsableTimerPickerDate(draftDate)
    ? draftDate
    : safeValue;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} anchor="bottom" size="lg">
      <DrawerBackdrop className="bg-black/60" />
      <DrawerContent className="border-white/0 bg-transparent p-0 overflow-hidden">
        <ImageBackground
          source={DATE_PICKER_BG}
          resizeMode="cover"
          style={styles.background}
        >
          <View style={styles.centeredContent}>
            <DrawerHeader className="px-6 pt-6" style={{ paddingTop: '0%' }}>
              <Heading size="lg" className="text-white font-bold">
                {title}
              </Heading>
              <DrawerCloseButton className="p-1">
                <Image
                  source={SPARKLE_ICON}
                  style={styles.closeIcon}
                  accessibilityLabel="Close"
                />
              </DrawerCloseButton>
            </DrawerHeader>
            <View style={styles.pickerScale}>
              {isOpen ? (
                <DateTimePicker
                  key={`dtp-${openGeneration}`}
                  value={pickerDisplayValue}
                  mode={resolvedMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handlePickerChange}
                  themeVariant="light"
                  textColor={TIMER_SOLID_BUTTON_CONTENT_COLOR}
                  style={styles.picker}
                  minimumDate={minimumDate}
                  maximumDate={resolvedMaximumDate}
                />
              ) : null}
            </View>

            {Platform.OS === 'ios' ? (
              <View style={styles.doneButton}>
                <TimerOutlineButton
                  label="Done"
                  onPress={handleDone}
                  variant="solid"
                  size="xl"
                />
              </View>
            ) : null}
          </View>
        </ImageBackground>
      </DrawerContent>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
  },
  centeredContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pickerScale: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1.15 }],
  },
  picker: {
    width: '100%',
    height: 216,
  },
  doneButton: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
  },
  closeIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});

export default TimerDateTimePickerDrawer;
