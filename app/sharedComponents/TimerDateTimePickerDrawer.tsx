import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React from 'react';
import { ImageBackground, Platform, StyleSheet, View } from 'react-native';
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/drawer';
import { CloseIcon, Icon } from '@/components/ui/icon';
import { Heading } from '@/components/ui/heading';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';

const DATE_PICKER_BG = require('../../assets/images/bg-date-picker.png');

type TimerDateTimePickerDrawerProps = {
  isOpen: boolean;
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  mode?: 'date' | 'datetime' | 'time';
};

const TimerDateTimePickerDrawer: React.FC<TimerDateTimePickerDrawerProps> = ({
  isOpen,
  title,
  value,
  onChange,
  onClose,
  mode = 'datetime',
}) => {
  const resolvedMode =
    mode === 'datetime' && Platform.OS !== 'ios' ? 'time' : mode;

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        onClose();
        return;
      }

      if (selectedDate) {
        onChange(selectedDate);
      }
      onClose();
      return;
    }

    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} anchor="bottom" size="md">
      <DrawerBackdrop className="bg-black/60" />
      <DrawerContent className="border-t border-white/20 bg-transparent rounded-t-2xl p-0 overflow-hidden">
        <ImageBackground
          source={DATE_PICKER_BG}
          resizeMode="cover"
          style={styles.background}
        >
          <DrawerHeader>
            <Heading size="lg" className="text-white font-bold">
              {title}
            </Heading>
            <DrawerCloseButton className="p-1">
              <Icon as={CloseIcon} className="text-white" size="md" />
            </DrawerCloseButton>
          </DrawerHeader>

          <DrawerBody
            className="py-2 mb-4"
            contentContainerStyle={{ alignItems: 'center' }}
          >
            <View className="w-full items-center bg-transparent">
              <DateTimePicker
                value={value}
                mode={resolvedMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                themeVariant="dark"
                maximumDate={mode === 'date' ? new Date() : undefined}
              />
            </View>
          </DrawerBody>

          {Platform.OS === 'ios' ? (
            <DrawerFooter className="justify-center pb-8">
              <TimerOutlineButton label="Done" onPress={onClose} variant="primary" />
            </DrawerFooter>
          ) : null}
        </ImageBackground>
      </DrawerContent>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  background: {
    width: '100%',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
});

export default TimerDateTimePickerDrawer;
