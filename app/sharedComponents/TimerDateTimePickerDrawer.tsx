import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React from 'react';
import { Image, ImageBackground, Platform, StyleSheet, View } from 'react-native';
import {
  Drawer,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer';
import { Heading } from '@/components/ui/heading';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';

const DATE_PICKER_BG = require('../../assets/images/bg-date-picker.png');
const SPARKLE_ICON = require('../../assets/images/sparkle.png');

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
    <Drawer isOpen={isOpen} onClose={onClose} anchor="bottom" size="lg">
      <DrawerBackdrop className="bg-black/60" />
      <DrawerContent className="border-white/0 bg-transparent p-0 overflow-hidden">
        <ImageBackground
          source={DATE_PICKER_BG}
          resizeMode="cover"
          style={styles.background}
        >


          <View style={styles.centeredContent}>
          <DrawerHeader className="px-6 pt-6" style={{paddingTop: "0%"}}>
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
              <DateTimePicker
                value={value}
                mode={resolvedMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                themeVariant="dark"
                textColor="#ffffff"
                style={styles.picker}
                maximumDate={mode === 'date' ? new Date() : undefined}
              />
            </View>

            {Platform.OS === 'ios' ? (
              <View style={styles.doneButton}>
                <TimerOutlineButton
                  label="Done"
                  onPress={onClose}
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
    // alignItems: 'center',
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
