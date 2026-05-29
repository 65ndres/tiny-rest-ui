import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform, View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
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
import { buttonTextClassName } from '@/app/constants/screenLayout';

type TimerDateTimePickerDrawerProps = {
  isOpen: boolean;
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

const TimerDateTimePickerDrawer: React.FC<TimerDateTimePickerDrawerProps> = ({
  isOpen,
  title,
  value,
  onChange,
  onClose,
}) => {
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
      <DrawerContent className="border-t border-white/90 bg-black/90 rounded-t-2xl p-6">
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
          <View className="w-full items-center">
            <DateTimePicker
              value={value}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
              themeVariant="dark"
            />
          </View>
        </DrawerBody>

        {Platform.OS === 'ios' ? (
          <DrawerFooter className="justify-center">
            <Button
              variant="solid"
              className="w-full border-2 border-white bg-white"
              size="md"
              onPress={onClose}
            >
              <ButtonText className={`${buttonTextClassName} text-black`}>
                Done
              </ButtonText>
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default TimerDateTimePickerDrawer;
