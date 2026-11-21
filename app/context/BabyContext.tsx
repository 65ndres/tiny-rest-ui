import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import {
  applyBabyHeader,
  type Baby,
  babyDisplayName,
  createBaby,
  deleteBaby,
  fetchBabies,
  finishActiveTimerForSwitch,
  isProRequiredError,
  loadStoredBabyId,
  resolveSelectedBabyId,
  storeBabyId,
} from '@/app/utils/babies';
import {
  deleteTimerRun,
  fetchActiveTimerRun,
  formatActiveTimerLabel,
  submitTimerRun,
  type TimerRunApiRecord,
} from '@/app/utils/timerHistory';
import {
  clearWidgetTimerAndRefresh,
  getStoredPausedElapsedForRun,
} from '@/app/utils/widgetStorage';
import BabySwitcherSheet from '@/app/sharedComponents/babies/BabySwitcherSheet';
import { useAuth } from './AuthContext';
import { useRevenueCat } from './RevenueCatContext';

type BabyContextType = {
  babies: Baby[];
  selectedBabyId: number | null;
  selectedBaby: Baby | null;
  selectedBabyName: string;
  /** True while a switch is stopping timers / changing baby. */
  isSwitching: boolean;
  /**
   * Make another baby the selected one. A running timer is stopped and saved
   * for the baby it belongs to first. Resolves false if the switch didn't
   * happen (cancelled or failed).
   */
  switchBaby: (babyId: number) => Promise<boolean>;
  /** Add a baby (Pro only beyond the first) and switch to it. */
  addBaby: (name: string) => Promise<Baby | null>;
  removeBaby: (babyId: number) => Promise<boolean>;
  refreshBabies: () => Promise<void>;
  openBabySwitcher: () => void;
};

const BabyContext = createContext<BabyContextType | undefined>(undefined);

const getToken = () => AsyncStorage.getItem('token');

const confirmStopTimer = (
  run: TimerRunApiRecord,
  fromName: string,
  toName: string
): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      `Switch to ${toName}?`,
      `${fromName}'s ${formatActiveTimerLabel(run)} will be stopped and saved.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Stop & switch', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

const confirmDiscardTimer = (message: string): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      "Couldn't save the timer",
      `${message} Discard the running timer and switch anyway?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Discard & switch',
          style: 'destructive',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

export const BabyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const isProUser = user?.subscription_type === 'pro';
  const [ready, setReady] = useState(false);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const selectedRef = useRef<number | null>(null);
  const babiesRef = useRef<Baby[]>([]);
  const switchingRef = useRef(false);

  const storeBabies = useCallback((list: Baby[]) => {
    babiesRef.current = list;
    setBabies(list);
  }, []);

  const select = useCallback((babyId: number | null) => {
    // Header first so requests fired by the re-render already use it.
    applyBabyHeader(babyId);
    selectedRef.current = babyId;
    setSelectedBabyId(babyId);
    void storeBabyId(babyId);
  }, []);

  const applyBabyList = useCallback(
    (list: Baby[]) => {
      storeBabies(list);
      const next = resolveSelectedBabyId(list, selectedRef.current);
      if (next !== selectedRef.current) select(next);
    },
    [select, storeBabies]
  );

  const refreshBabies = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      applyBabyList(await fetchBabies(token));
    } catch {
      // Keep the current list; requests still go to the saved baby.
    }
  }, [applyBabyList]);

  // Restore the saved baby before any screen fetches, then load the list.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const storedId = await loadStoredBabyId();
      if (cancelled) return;
      applyBabyHeader(storedId);
      selectedRef.current = storedId;
      setSelectedBabyId(storedId);
      setReady(true);
      await refreshBabies();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBabies]);

  // Signed out (provider unmounts with the authenticated navigator).
  useEffect(
    () => () => {
      applyBabyHeader(null);
      void storeBabyId(null);
    },
    []
  );

  const nameFor = useCallback(
    (babyId: number | null | undefined) =>
      babyDisplayName(babiesRef.current.find((baby) => baby.id === babyId)),
    []
  );

  const performSwitch = useCallback(
    async (babyId: number, { confirm }: { confirm: boolean }) => {
      const token = await getToken();
      if (!token) return false;

      const running = await fetchActiveTimerRun(token, { allBabies: true });
      if (running && confirm) {
        const proceed = await confirmStopTimer(
          running,
          nameFor(running.baby_id ?? selectedRef.current),
          nameFor(babyId)
        );
        if (!proceed) return false;
      }

      if (running) {
        const result = await finishActiveTimerForSwitch({
          token,
          fetchActiveTimerRun,
          submitTimerRun,
          getPausedElapsedForRun: getStoredPausedElapsedForRun,
        });
        if (result.status === 'failed') {
          const discard = await confirmDiscardTimer(result.message);
          if (!discard) return false;
          await deleteTimerRun(token, result.run.id);
        }
      }

      select(babyId);
      // The widget / Live Activity showed the stopped timer; rebuild it for
      // the new baby (its own timer, or its sleep prediction).
      await clearWidgetTimerAndRefresh(token);
      return true;
    },
    [nameFor, select]
  );

  const runExclusive = useCallback(
    async <T,>(fallback: T, task: () => Promise<T>): Promise<T> => {
      if (switchingRef.current) return fallback;
      switchingRef.current = true;
      setIsSwitching(true);
      try {
        return await task();
      } finally {
        switchingRef.current = false;
        setIsSwitching(false);
      }
    },
    []
  );

  const switchBaby = useCallback(
    (babyId: number) =>
      runExclusive(false, async () => {
        if (babyId === selectedRef.current) return true;
        try {
          return await performSwitch(babyId, { confirm: true });
        } catch {
          Alert.alert(
            'Error',
            'Could not switch babies. Check your connection and try again.'
          );
          return false;
        }
      }),
    [performSwitch, runExclusive]
  );

  const addBaby = useCallback(
    async (name: string): Promise<Baby | null> => {
      if (babies.length > 0 && !isProUser) {
        void presentPaywall();
        return null;
      }
      const token = await getToken();
      if (!token) return null;

      let created: Baby;
      try {
        const response = await createBaby(token, { name: name.trim() });
        created = response.baby;
        storeBabies(response.babies);
      } catch (error) {
        if (isProRequiredError(error)) {
          void presentPaywall();
        } else {
          Alert.alert('Error', 'Could not add the baby. Please try again.');
        }
        return null;
      }

      await switchBaby(created.id);
      return created;
    },
    [babies.length, isProUser, presentPaywall, storeBabies, switchBaby]
  );

  const removeBaby = useCallback(
    (babyId: number) =>
      runExclusive(false, async () => {
        const token = await getToken();
        if (!token) return false;
        try {
          const remaining = await deleteBaby(token, babyId);
          storeBabies(remaining);
          if (babyId === selectedRef.current && remaining[0]) {
            // The deleted baby's entries (and any timer) are gone; a timer
            // still running belongs to another baby and gets saved.
            await performSwitch(remaining[0].id, { confirm: false });
          } else {
            await clearWidgetTimerAndRefresh(token);
          }
          return true;
        } catch {
          Alert.alert('Error', 'Could not delete the profile. Please try again.');
          return false;
        }
      }),
    [performSwitch, runExclusive, storeBabies]
  );

  const selectedBaby = useMemo(
    () => babies.find((baby) => baby.id === selectedBabyId) ?? null,
    [babies, selectedBabyId]
  );

  const value = useMemo<BabyContextType>(
    () => ({
      babies,
      selectedBabyId,
      selectedBaby,
      selectedBabyName: babyDisplayName(selectedBaby),
      isSwitching,
      switchBaby,
      addBaby,
      removeBaby,
      refreshBabies,
      openBabySwitcher: () => setIsSwitcherOpen(true),
    }),
    [
      addBaby,
      babies,
      isSwitching,
      refreshBabies,
      removeBaby,
      selectedBaby,
      selectedBabyId,
      switchBaby,
    ]
  );

  if (!ready) return null;

  return (
    <BabyContext.Provider value={value}>
      {children}
      <BabySwitcherSheet
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </BabyContext.Provider>
  );
};

export const useBabies = (): BabyContextType => {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBabies must be used within a BabyProvider');
  }
  return context;
};

/**
 * Remount a screen when the selected baby changes so its local state (timer,
 * form, cached lists) resets and it reloads for the new baby.
 */
export function withSelectedBabyKey<P extends object>(
  Screen: React.ComponentType<P>
): React.FC<P> {
  const Keyed: React.FC<P> = (props) => {
    const { selectedBabyId } = useBabies();
    return <Screen key={selectedBabyId ?? 'none'} {...props} />;
  };
  Keyed.displayName = `WithSelectedBabyKey(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Keyed;
}
