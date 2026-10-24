import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  Drawer,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer';
import { Heading } from '@/components/ui/heading';
import {
  HEADING_MARGIN,
  layout,
  stackGapStyle,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerScrollContentStyle,
  timerSectionLabelClassName,
  timerSectionLabelStyle,
  timerSessionResetLinkClassName,
  timerSessionResetLinkStyle,
} from '@/app/constants/screenLayout';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import TimerDateTimePickerDrawer from '@/app/sharedComponents/TimerDateTimePickerDrawer';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';
import TimerSettingRow from '@/app/sharedComponents/timer/TimerSettingRow';
import {
  deleteTimerRun,
  findOverlappingSession,
  formatFeedingHistoryPrimary,
  formatOverlapMessage,
  formatSessionClockTime,
  getTimerApiErrorMessage,
  loadTimerHistoryFromCache,
  mapTimerRunToSession,
  removeTimerSessionFromCache,
  replaceTimerSessionInCache,
  START_TIME_FUTURE_MESSAGE,
  submitTimerRun,
  type TimerSession,
} from '@/app/utils/timerHistory';

const DRAWER_BACKGROUND = require('../../assets/images/bg-date-picker.png');
// Matches the API's allowance for "now" presses.
const FUTURE_SKEW_MS = 60_000;
const ERROR_COLOR = '#FFD700';

export type EditTimelineEntryParams = {
  session: TimerSession;
  /** Changes on every open so the form starts fresh (drawer screens stay mounted). */
  openedAt: number;
};

type EditTimelineEntryRoute = RouteProp<
  { EditTimelineEntry: EditTimelineEntryParams },
  'EditTimelineEntry'
>;

type PickerTarget = 'start' | 'end';

const isNumericId = (id: string | undefined): id is string =>
  !!id && /^\d+$/.test(id);

// Bottle feedings are a single moment, so they only have a start time.
const isInstantSession = (session: TimerSession): boolean =>
  session.run_type === 'bottle';

const formatDay = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const getEntryTitle = (session: TimerSession, start: Date): string => {
  const kind =
    session.run_type === 'sleeping' ? 'Sleep' : formatFeedingHistoryPrimary(session);
  return `${kind} · ${formatDay(start)}`;
};

const validateTimes = (
  session: TimerSession,
  start: Date,
  end: Date
): string | null => {
  const latest = Date.now() + FUTURE_SKEW_MS;
  if (start.getTime() > latest) return START_TIME_FUTURE_MESSAGE;
  if (isInstantSession(session)) return null;
  if (end.getTime() > latest) return 'End time cannot be in the future.';
  if (end.getTime() <= start.getTime()) return 'End time must be after start time.';
  return null;
};

const EditTimelineEntryForm: React.FC<{ session: TimerSession }> = ({
  session,
}) => {
  const navigation =
    useNavigation<DrawerNavigationProp<{ NapTimeline: undefined }>>();

  const [start, setStart] = useState(() => new Date(session.start_time));
  const [end, setEnd] = useState(() => new Date(session.end_time));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);
  const [pickerNow, setPickerNow] = useState(() => new Date());
  const [pickerOpenGeneration, setPickerOpenGeneration] = useState(0);

  const isInstant = isInstantSession(session);
  const isBusy = isSaving || isDeleting;

  const goBackToTimeline = useCallback(() => {
    navigation.navigate('NapTimeline');
  }, [navigation]);

  const openPicker = (target: PickerTarget) => {
    setPickerNow(new Date());
    setPickerOpenGeneration((generation) => generation + 1);
    setActivePicker(target);
  };

  const handlePickerChange = (date: Date) => {
    setError(null);
    if (isInstant || activePicker === 'start') {
      setStart(date);
      if (isInstant) setEnd(date);
    } else {
      setEnd(date);
    }
  };

  const handleSave = async () => {
    if (isBusy) return;

    const validationError = validateTimes(session, start, end);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_ms: end.getTime() - start.getTime(),
    };

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let updated: TimerSession = { ...session, ...payload };
      if (token && isNumericId(session.id)) {
        const record = await submitTimerRun(token, Number(session.id), payload);
        updated = mapTimerRunToSession(record) ?? updated;
      } else {
        // Without the API, check overlaps against the device's own history.
        const overlap = findOverlappingSession(await loadTimerHistoryFromCache(), {
          id: session.id,
          start,
          end,
        });
        if (overlap) {
          setError(formatOverlapMessage(overlap));
          return;
        }
      }

      await replaceTimerSessionInCache(updated);
      goBackToTimeline();
    } catch (saveError) {
      setError(
        getTimerApiErrorMessage(saveError, 'Could not save this entry. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy) return;

    setIsConfirmingDelete(false);
    setIsDeleting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && isNumericId(session.id)) {
        await deleteTimerRun(token, Number(session.id));
      }
      await removeTimerSessionFromCache(session.id);
      goBackToTimeline();
    } catch {
      setError('Could not delete this entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ScreenScrollLayout
        contentContainerClassName={timerScrollContentClassName}
        contentContainerStyle={timerScrollContentStyle}
        stackClassName={timerContentStackClassName}
      >
        <VStack className={timerContentStackClassName} style={stackGapStyle}>
          <TimerSectionCard>
            <Text
              className={timerSectionLabelClassName}
              style={[timerSectionLabelStyle, { marginTop: layout.space8 }]}
            >
              {getEntryTitle(session, start)}
            </Text>

            {isInstant ? (
              <TimerSettingRow
                label="Time:"
                value={formatSessionClockTime(start.toISOString())}
                placeholder="Select time"
                onPress={() => openPicker('start')}
                disabled={isBusy}
                accessibilityLabel="Edit feeding time"
                isFirst
                size="lg"
              />
            ) : (
              <>
                <TimerSettingRow
                  label="Started at:"
                  value={formatSessionClockTime(start.toISOString())}
                  placeholder="Select time"
                  onPress={() => openPicker('start')}
                  disabled={isBusy}
                  accessibilityLabel="Edit start time"
                  isFirst
                  size="lg"
                />
                <TimerSettingRow
                  label="Ended at:"
                  value={formatSessionClockTime(end.toISOString())}
                  hint={
                    end.toDateString() === start.toDateString()
                      ? undefined
                      : formatDay(end)
                  }
                  placeholder="Select time"
                  onPress={() => openPicker('end')}
                  disabled={isBusy}
                  accessibilityLabel="Edit end time"
                  size="lg"
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TimerOutlineButton
              label="Save"
              iconName="save-sharp"
              onPress={() => void handleSave()}
              disabled={isDeleting}
              isLoading={isSaving}
              variant="solid"
              size="xl"
              style={{ marginTop: layout.space16 }}
            />
            <TimerOutlineButton
              label="Cancel"
              onPress={goBackToTimeline}
              disabled={isBusy}
              size="xl"
              style={{ marginTop: layout.space12 }}
            />
            <Pressable
              onPress={() => setIsConfirmingDelete(true)}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Delete entry"
            >
              <Text
                className={`${timerSessionResetLinkClassName}${isBusy ? ' opacity-40' : ''}`}
                style={timerSessionResetLinkStyle}
              >
                Delete entry
              </Text>
            </Pressable>
          </TimerSectionCard>
        </VStack>
      </ScreenScrollLayout>

      <TimerDateTimePickerDrawer
        isOpen={activePicker !== null}
        title={
          isInstant ? 'Feeding time' : activePicker === 'end' ? 'End time' : 'Start time'
        }
        value={activePicker === 'end' ? end : start}
        onChange={handlePickerChange}
        onClose={() => setActivePicker(null)}
        maximumDate={pickerNow}
        openGeneration={pickerOpenGeneration}
      />

      <Drawer
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        anchor="bottom"
        size="md"
      >
        <DrawerBackdrop className="bg-black/60" />
        <DrawerContent className="border-white/0 bg-transparent p-0 overflow-hidden">
          <ImageBackground
            resizeMode="cover"
            source={DRAWER_BACKGROUND}
            style={styles.drawerBackground}
          >
            <View style={styles.drawerContent}>
              <DrawerHeader className="px-0" style={styles.drawerHeader}>
                <Heading
                  size="lg"
                  className="text-white font-bold"
                  style={styles.drawerHeading}
                >
                  Delete entry
                </Heading>
                <DrawerCloseButton accessibilityLabel="Cancel deletion" className="p-1">
                  <Ionicons name="close" size={layout.icon2xl} color="#ffffff" />
                </DrawerCloseButton>
              </DrawerHeader>

              <Text style={styles.drawerMessage}>
                Delete this entry? This cannot be undone.
              </Text>

              <View style={styles.drawerActions}>
                <TimerOutlineButton
                  label="Cancel"
                  onPress={() => setIsConfirmingDelete(false)}
                  size="lg"
                />
                <TimerOutlineButton
                  label="Delete"
                  onPress={() => void handleDelete()}
                  variant="solid"
                  size="lg"
                  disabled={isDeleting}
                />
              </View>
            </View>
          </ImageBackground>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const EditTimelineEntryScreen: React.FC = () => {
  const { session, openedAt } = useRoute<EditTimelineEntryRoute>().params;
  return <EditTimelineEntryForm key={openedAt} session={session} />;
};

const styles = StyleSheet.create({
  error: {
    color: ERROR_COLOR,
    fontSize: layout.fontSm,
    marginTop: layout.space12,
    textAlign: 'center',
  },
  drawerBackground: {
    width: '100%',
    height: '100%',
  },
  drawerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: layout.space24,
    paddingBottom: layout.space32,
  },
  drawerHeader: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  drawerHeading: {
    fontSize: layout.fontLg,
    marginVertical: HEADING_MARGIN,
  },
  drawerMessage: {
    color: '#ffffff',
    fontSize: layout.fontBase,
    fontWeight: '600',
    lineHeight: layout.font2xl,
    marginTop: layout.space12,
    textAlign: 'center',
  },
  drawerActions: {
    width: '100%',
    gap: layout.space12,
    marginTop: layout.space36,
  },
});

export default EditTimelineEntryScreen;
