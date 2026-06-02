import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { buttonTextClassName } from '@/app/constants/screenLayout';
import {
  FEEDING_COLORS,
  FEEDING_TYPE_OPTIONS,
} from '@/app/constants/feedingTheme';
import type { BottleMetadata } from '@/app/utils/timerHistory';

type BottleFeedingFormProps = {
  startTimeLabel: string;
  onPressStartTime: () => void;
  metadata: BottleMetadata;
  onMetadataChange: (metadata: BottleMetadata) => void;
  onSave: () => void;
  isSaving: boolean;
};

const MAX_AMOUNT = 12;

const BottleFeedingForm: React.FC<BottleFeedingFormProps> = ({
  startTimeLabel,
  onPressStartTime,
  metadata,
  onMetadataChange,
  onSave,
  isSaving,
}) => {
  const unit = metadata.unit ?? 'oz';
  const amount = metadata.amount ?? 0;

  const pickType = () => {
    Alert.alert(
      'Feeding type',
      undefined,
      [
        ...FEEDING_TYPE_OPTIONS.map((option) => ({
          text: option,
          onPress: () =>
            onMetadataChange({ ...metadata, feeding_type: option }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const setUnit = (nextUnit: 'oz' | 'mL') => {
    onMetadataChange({ ...metadata, unit: nextUnit });
  };

  const adjustAmount = (delta: number) => {
    const next = Math.min(MAX_AMOUNT, Math.max(0, amount + delta));
    onMetadataChange({ ...metadata, amount: next });
  };

  return (
    <View style={styles.form}>
      <Row label="Start Time">
        <Pressable onPress={onPressStartTime}>
          <Text style={styles.link}>{startTimeLabel}</Text>
        </Pressable>
      </Row>

      <Row label="Type:">
        <Pressable onPress={pickType}>
          <Text style={styles.link}>
            {metadata.feeding_type ?? 'Set type'}
          </Text>
        </Pressable>
      </Row>

      <View style={styles.unitToggle}>
        {(['oz', 'mL'] as const).map((value) => {
          const selected = unit === value;
          return (
            <Pressable
              key={value}
              onPress={() => setUnit(value)}
              style={[styles.unitSegment, selected && styles.unitSegmentActive]}
            >
              <Text
                style={[styles.unitLabel, selected && styles.unitLabelActive]}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.amountBlock}>
        <View>
          <Text style={styles.rowLabel}>Amount</Text>
          <Text style={styles.optional}>optional</Text>
        </View>
        <Pressable onPress={() => adjustAmount(1)}>
          <Text style={styles.link}>
            {amount > 0 ? `${amount} ${unit}` : 'Set amount'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.scale}>0</Text>
        <View style={styles.sliderControls}>
          <Pressable
            onPress={() => adjustAmount(-1)}
            style={styles.stepButton}
            accessibilityLabel="Decrease amount"
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(amount / MAX_AMOUNT) * 100}%` },
              ]}
            />
          </View>
          <Pressable
            onPress={() => adjustAmount(1)}
            style={styles.stepButton}
            accessibilityLabel="Increase amount"
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <Text style={styles.scale}>{MAX_AMOUNT}</Text>
      </View>

      <View style={styles.notesSection}>
        <TextInput
          value={metadata.notes ?? ''}
          onChangeText={(notes) => onMetadataChange({ ...metadata, notes })}
          placeholder="+ add note"
          placeholderTextColor={FEEDING_COLORS.textMuted}
          style={styles.notesInput}
          multiline
        />
      </View>

      <Button
        variant="solid"
        className="w-full mt-6 border-2 border-white bg-white"
        size="md"
        onPress={onSave}
        isDisabled={isSaving}
      >
        {isSaving ? (
          <ButtonSpinner color="black" />
        ) : (
          <ButtonText className={`${buttonTextClassName} text-black`}>
            Save
          </ButtonText>
        )}
      </Button>
    </View>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  form: {
    width: '100%',
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FEEDING_COLORS.border,
  },
  rowLabel: {
    color: FEEDING_COLORS.text,
    fontSize: 17,
  },
  optional: {
    color: FEEDING_COLORS.textMuted,
    fontSize: 13,
  },
  link: {
    color: FEEDING_COLORS.link,
    fontSize: 17,
    textDecorationLine: 'underline',
  },
  unitToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: 16,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FEEDING_COLORS.border,
  },
  unitSegment: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  unitSegmentActive: {
    backgroundColor: '#ffffff',
  },
  unitLabel: {
    color: FEEDING_COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  unitLabelActive: {
    color: '#000000',
  },
  amountBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scale: {
    color: FEEDING_COLORS.textMuted,
    fontSize: 13,
    width: 24,
    textAlign: 'center',
  },
  sliderControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: FEEDING_COLORS.text,
    fontSize: 22,
    lineHeight: 24,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: FEEDING_COLORS.text,
    borderRadius: 3,
  },
  notesSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: FEEDING_COLORS.border,
    marginTop: 8,
    paddingVertical: 12,
  },
  notesInput: {
    color: FEEDING_COLORS.text,
    fontSize: 16,
    textAlign: 'right',
    minHeight: 40,
  },
});

export default BottleFeedingForm;
