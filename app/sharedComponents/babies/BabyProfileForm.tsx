import type { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/components/AppText';
import { Text } from '@/components/ui/text';
import {
  fieldLabelStyle,
  layout,
  lineHeightFor,
  mutedTextClassName,
  mutedTextStyle,
  timerSectionLabelClassName,
  timerSectionLabelStyle,
  timerSettingRowClassName,
  timerSettingRowStyle,
} from '@/app/constants/screenLayout';
import { vh } from '@/constants/appViewport';
import { MAX_BABY_NAME_LENGTH } from '@/app/utils/babies';
import {
  formatBirthdate,
  hasBabyProfileErrors,
  validateBabyProfile,
  type BabyProfileErrors,
  type BabyProfileValues,
} from '@/app/utils/babyProfileForm';
import {
  dateToMinutes,
  DEFAULT_DAY_END_MINUTES,
  DEFAULT_DAY_START_MINUTES,
  minutesToDate,
  minutesToDisplayTime,
} from '@/app/utils/dayWindow';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';

type BabyProfileFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  submitIcon?: keyof typeof Ionicons.glyphMap;
  babyName: string;
  babyBirthdate: string | null;
  onBabyNameChange: (name: string) => void;
  onBabyBirthdateChange: (date: string | null) => void;
  /**
   * Called with valid values. The caller saves and reports its own errors;
   * the button shows a spinner until the promise settles.
   */
  onSubmit: (values: BabyProfileValues) => Promise<unknown>;
};

const toDateInput = (value: string | null): Date => {
  if (!value) return new Date();
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ErrorText: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <Text
      className="text-error-400 font-semibold"
      style={{ fontSize: layout.fontLg, marginTop: layout.space4 }}
    >
      {message}
    </Text>
  ) : null;

/**
 * Name, birthdate and usual day window for a baby. Used by onboarding (first
 * baby) and the Add baby screen (more babies).
 */
const BabyProfileForm: React.FC<BabyProfileFormProps> = ({
  title,
  subtitle,
  submitLabel,
  submitIcon = 'arrow-forward-sharp',
  babyName,
  babyBirthdate,
  onBabyNameChange,
  onBabyBirthdateChange,
  onSubmit,
}) => {
  const [errors, setErrors] = useState<BabyProfileErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isBirthdatePickerOpen, setIsBirthdatePickerOpen] = useState(false);
  const [birthdatePickerValue, setBirthdatePickerValue] = useState(() =>
    toDateInput(babyBirthdate)
  );
  const [dayStartMinutes, setDayStartMinutes] = useState(
    DEFAULT_DAY_START_MINUTES
  );
  const [dayEndMinutes, setDayEndMinutes] = useState(DEFAULT_DAY_END_MINUTES);
  const [dayStartPickerValue, setDayStartPickerValue] = useState(() =>
    minutesToDate(DEFAULT_DAY_START_MINUTES)
  );
  const [dayEndPickerValue, setDayEndPickerValue] = useState(() =>
    minutesToDate(DEFAULT_DAY_END_MINUTES)
  );
  const [isDayStartPickerOpen, setIsDayStartPickerOpen] = useState(false);
  const [isDayEndPickerOpen, setIsDayEndPickerOpen] = useState(false);

  const clearError = (key: keyof BabyProfileErrors) => {
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    const values: BabyProfileValues = {
      name: babyName,
      birthdate: babyBirthdate,
      dayStartMinutes,
      dayEndMinutes,
    };
    const nextErrors = validateBabyProfile(values);
    setErrors(nextErrors);
    if (hasBabyProfileErrors(nextErrors)) return;

    setIsSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TimerSectionCard style={{ paddingVertical: layout.space16 }}>
      <Text
        style={{
          fontSize: vh(30),
          fontWeight: 'bold',
          color: '#ffffff',
          lineHeight: vh(36),
        }}
      >
        {title}
      </Text>
      <Text
        className={mutedTextClassName}
        style={[
          mutedTextStyle,
          {
            fontSize: layout.fontLg,
            marginBottom: layout.space12,
            marginTop: layout.space8,
          },
        ]}
      >
        {subtitle}
      </Text>

      <View
        className={`${timerSettingRowClassName} border-t-0`}
        style={[timerSettingRowStyle, { paddingVertical: layout.space8 }]}
      >
        <Text className="text-white font-semibold flex-1" style={fieldLabelStyle}>
          Name:
        </Text>
        <TextInput
          value={babyName}
          onChangeText={(text) => {
            onBabyNameChange(text);
            clearError('name');
          }}
          placeholder="Enter name"
          placeholderTextColor="rgba(255,255,255,0.5)"
          editable={!isSaving}
          maxLength={MAX_BABY_NAME_LENGTH}
          style={{
            lineHeight: lineHeightFor(layout.fontLg),
            fontSize: layout.fontLg,
            minWidth: layout.space32 * 4 - layout.space8,
          }}
          accessibilityLabel="Baby name"
          className="text-white font-semibold underline text-right py-0"
          cursorColor="#ffffff"
          selectionColor="white"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      <ErrorText message={errors.name} />

      <TimerSettingRow
        label="Birthdate:"
        value={formatBirthdate(babyBirthdate)}
        placeholder="Select date"
        onPress={() => {
          setBirthdatePickerValue(toDateInput(babyBirthdate));
          setIsBirthdatePickerOpen(true);
        }}
        disabled={isSaving}
        accessibilityLabel="Set baby birthdate"
        size="lg"
        style={{ paddingVertical: layout.space8 }}
      />
      <ErrorText message={errors.birthdate} />

      <Text
        className={timerSectionLabelClassName}
        style={[
          timerSectionLabelStyle,
          { marginBottom: layout.space8, marginTop: layout.space12 },
        ]}
      >
        Start and end of the day (normally)
      </Text>
      <TimerSettingRow
        label="Start:"
        value={minutesToDisplayTime(dayStartMinutes)}
        placeholder="Select time"
        onPress={() => {
          setDayStartPickerValue(minutesToDate(dayStartMinutes));
          setIsDayStartPickerOpen(true);
        }}
        disabled={isSaving}
        accessibilityLabel="Set day start time"
        size="lg"
        style={{ paddingVertical: layout.space8 }}
      />
      <TimerSettingRow
        label="End:"
        value={minutesToDisplayTime(dayEndMinutes)}
        placeholder="Select time"
        onPress={() => {
          setDayEndPickerValue(minutesToDate(dayEndMinutes));
          setIsDayEndPickerOpen(true);
        }}
        disabled={isSaving}
        accessibilityLabel="Set day end time"
        size="lg"
        style={{ paddingVertical: layout.space8 }}
      />
      <ErrorText message={errors.dayWindow} />

      <TimerOutlineButton
        label={submitLabel}
        iconName={submitIcon}
        onPress={() => void handleSubmit()}
        disabled={isSaving}
        isLoading={isSaving}
        variant="solid"
        size="xl"
        style={{ marginTop: layout.space12, paddingVertical: layout.space12 }}
        accessibilityLabel={submitLabel}
      />

      <TimerDateTimePickerDrawer
        isOpen={isBirthdatePickerOpen}
        title="Baby birthdate"
        value={birthdatePickerValue}
        mode="date"
        onChange={(date) => {
          setBirthdatePickerValue(date);
          onBabyBirthdateChange(toIsoDate(date));
          clearError('birthdate');
        }}
        onClose={() => setIsBirthdatePickerOpen(false)}
      />

      <TimerDateTimePickerDrawer
        isOpen={isDayStartPickerOpen}
        title="Day start"
        value={dayStartPickerValue}
        mode="time"
        onChange={(date) => {
          setDayStartPickerValue(date);
          setDayStartMinutes(dateToMinutes(date));
          clearError('dayWindow');
        }}
        onClose={() => setIsDayStartPickerOpen(false)}
      />

      <TimerDateTimePickerDrawer
        isOpen={isDayEndPickerOpen}
        title="Day end"
        value={dayEndPickerValue}
        mode="time"
        onChange={(date) => {
          setDayEndPickerValue(date);
          setDayEndMinutes(dateToMinutes(date));
          clearError('dayWindow');
        }}
        onClose={() => setIsDayEndPickerOpen(false)}
      />
    </TimerSectionCard>
  );
};

export default BabyProfileForm;
