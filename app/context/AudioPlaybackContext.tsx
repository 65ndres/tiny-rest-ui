import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getSoundTrackById } from '@/app/constants/soundCatalog';
import {
  CROSSFADE_SECONDS,
  CROSSFADE_STEPS,
  getCrossfadeVolumes,
  shouldSeekBeforeCrossfade,
  shouldStartCrossfade,
  shouldUseNativeLoop,
} from '@/app/utils/soundLoopTransition';

const MONITOR_INTERVAL_MS = 50;

type AudioPlaybackContextValue = {
  activeTrackId: string | null;
  isPlaying: boolean;
  volume: number;
  toggleTrack: (trackId: string) => void;
  setVolume: (value: number) => void;
};

const AudioPlaybackContext = createContext<AudioPlaybackContextValue | null>(
  null
);

export const AudioPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const playersRef = useRef<[AudioPlayer, AudioPlayer] | null>(null);
  const activeIndexRef = useRef(0);
  const volumeRef = useRef(0.75);
  const crossfadingRef = useRef(false);
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTrackIdRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.75);

  const clearFade = useCallback(() => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  const clearMonitor = useCallback(() => {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
  }, []);

  const pauseAll = useCallback(() => {
    const players = playersRef.current;
    if (!players) return;
    for (const player of players) {
      player.pause();
      player.volume = 0;
    }
  }, []);

  const primePlayer = useCallback(async (player: AudioPlayer) => {
    try {
      await player.seekTo(0);
    } catch {
      // Best-effort; crossfade will retry if needed
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let playerA: AudioPlayer | null = null;
    let playerB: AudioPlayer | null = null;

    const setup = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.error('Failed to set audio mode for background playback:', error);
      }

      if (cancelled) return;

      playerA = createAudioPlayer(null, {
        updateInterval: 100,
        keepAudioSessionActive: true,
      });
      playerB = createAudioPlayer(null, {
        updateInterval: 100,
        keepAudioSessionActive: true,
      });
      playerA.volume = 0;
      playerB.volume = 0;
      playerA.loop = false;
      playerB.loop = false;
      playersRef.current = [playerA, playerB];
    };

    void setup();

    return () => {
      cancelled = true;
      clearMonitor();
      clearFade();
      crossfadingRef.current = false;
      playerA?.clearLockScreenControls();
      playerB?.clearLockScreenControls();
      playerA?.remove();
      playerB?.remove();
      playersRef.current = null;
    };
  }, [clearFade, clearMonitor]);

  const beginCrossfade = useCallback(() => {
    const players = playersRef.current;
    if (!players || crossfadingRef.current) return;
    if (!activeTrackIdRef.current) return;

    const fromIndex = activeIndexRef.current;
    const toIndex = fromIndex === 0 ? 1 : 0;
    const fromPlayer = players[fromIndex];
    const toPlayer = players[toIndex];
    const targetVolume = volumeRef.current;

    crossfadingRef.current = true;

    void (async () => {
      // Only seek if the next loop isn't already primed at the start.
      if (shouldSeekBeforeCrossfade(toPlayer.currentTime)) {
        try {
          await toPlayer.seekTo(0);
        } catch {
          // Fall through and attempt play anyway
        }
      }

      if (!crossfadingRef.current || !playersRef.current) return;
      if (activeTrackIdRef.current == null) return;

      // Start the next loop immediately so it overlaps the tail of the current one.
      toPlayer.volume = 0;
      toPlayer.play();

      clearFade();
      let step = 0;
      fadeRef.current = setInterval(() => {
        step += 1;
        const { fromVolume, toVolume } = getCrossfadeVolumes({
          step,
          targetVolume,
        });
        fromPlayer.volume = fromVolume;
        toPlayer.volume = toVolume;

        if (step >= CROSSFADE_STEPS) {
          clearFade();
          fromPlayer.pause();
          fromPlayer.volume = 0;
          activeIndexRef.current = toIndex;
          crossfadingRef.current = false;
          // Prime the idle player for the next seamless handoff.
          void primePlayer(fromPlayer);
        }
      }, (CROSSFADE_SECONDS * 1000) / CROSSFADE_STEPS);
    })();
  }, [clearFade, primePlayer]);

  const startMonitor = useCallback(() => {
    clearMonitor();
    monitorRef.current = setInterval(() => {
      const players = playersRef.current;
      if (!players || crossfadingRef.current) return;
      if (shouldUseNativeLoop(appStateRef.current)) return;

      const player = players[activeIndexRef.current];
      if (!player.playing || player.duration <= 0) return;

      if (
        shouldStartCrossfade({
          currentTime: player.currentTime,
          duration: player.duration,
        })
      ) {
        beginCrossfade();
      }
    }, MONITOR_INTERVAL_MS);
  }, [beginCrossfade, clearMonitor]);

  /** Native loop while JS timers are frozen (lock screen / background). */
  const enableNativeLoopForBackground = useCallback(() => {
    const players = playersRef.current;
    if (!players || !activeTrackIdRef.current) return;

    clearMonitor();
    clearFade();
    crossfadingRef.current = false;

    const active = players[activeIndexRef.current];
    const inactive = players[activeIndexRef.current === 0 ? 1 : 0];
    active.loop = true;
    inactive.loop = false;
    inactive.pause();
    inactive.volume = 0;
  }, [clearFade, clearMonitor]);

  /** Foreground: dual-player crossfade removes the native loop silence gap. */
  const restoreCrossfadeLoop = useCallback(() => {
    const players = playersRef.current;
    if (!players || !activeTrackIdRef.current) return;

    const active = players[activeIndexRef.current];
    if (!active.playing) return;

    const inactive = players[activeIndexRef.current === 0 ? 1 : 0];
    active.loop = false;
    inactive.loop = false;
    inactive.volume = 0;
    void primePlayer(inactive);
    startMonitor();
  }, [primePlayer, startMonitor]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      const wasBackgrounded =
        appStateRef.current === 'active' &&
        (nextState === 'background' || nextState === 'inactive');
      const returnedToForeground =
        appStateRef.current !== 'active' && nextState === 'active';

      appStateRef.current = nextState;

      if (wasBackgrounded) {
        enableNativeLoopForBackground();
      } else if (returnedToForeground) {
        restoreCrossfadeLoop();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [enableNativeLoopForBackground, restoreCrossfadeLoop]);

  const stopPlayback = useCallback(() => {
    clearMonitor();
    clearFade();
    crossfadingRef.current = false;
    pauseAll();
    const players = playersRef.current;
    players?.[0]?.clearLockScreenControls();
    players?.[1]?.clearLockScreenControls();
    activeTrackIdRef.current = null;
    setActiveTrackId(null);
    setIsPlaying(false);
  }, [clearFade, clearMonitor, pauseAll]);

  const startPlayback = useCallback(
    (trackId: string) => {
      const players = playersRef.current;
      const track = getSoundTrackById(trackId);
      if (!players || !track?.source) return;

      clearMonitor();
      clearFade();
      crossfadingRef.current = false;
      pauseAll();

      const [playerA, playerB] = players;
      const targetVolume = volumeRef.current;
      const useNativeLoop = shouldUseNativeLoop(appStateRef.current);

      activeIndexRef.current = 0;
      activeTrackIdRef.current = trackId;
      setActiveTrackId(trackId);
      setIsPlaying(true);

      // Load the same source on both players so we can crossfade loops.
      playerA.replace(track.source);
      playerB.replace(track.source);
      playerA.volume = targetVolume;
      playerB.volume = 0;
      void playerA.seekTo(0);
      void primePlayer(playerB);

      if (useNativeLoop) {
        // JS timers freeze when locked — fall back to native loop.
        playerA.loop = true;
        playerB.loop = false;
        playerA.play();
      } else {
        // Dual-player overlap covers the silence that native loop leaves.
        playerA.loop = false;
        playerB.loop = false;
        playerA.play();
        startMonitor();
      }

      playerA.setActiveForLockScreen(true, {
        title: track.title,
        artist: 'TinyRest',
      });
    },
    [clearFade, clearMonitor, pauseAll, primePlayer, startMonitor]
  );

  const toggleTrack = useCallback(
    (trackId: string) => {
      const track = getSoundTrackById(trackId);
      if (!track?.source) return;

      if (activeTrackIdRef.current === trackId) {
        stopPlayback();
        return;
      }

      startPlayback(trackId);
    },
    [startPlayback, stopPlayback]
  );

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    volumeRef.current = clamped;
    setVolumeState(clamped);

    const players = playersRef.current;
    if (!players || crossfadingRef.current) return;

    const active = players[activeIndexRef.current];
    if (active.playing) {
      active.volume = clamped;
    }
  }, []);

  const value = useMemo(
    () => ({
      activeTrackId,
      isPlaying,
      volume,
      toggleTrack,
      setVolume,
    }),
    [activeTrackId, isPlaying, volume, toggleTrack, setVolume]
  );

  return (
    <AudioPlaybackContext.Provider value={value}>
      {children}
    </AudioPlaybackContext.Provider>
  );
};

export const useAudioPlayback = (): AudioPlaybackContextValue => {
  const context = useContext(AudioPlaybackContext);
  if (!context) {
    throw new Error('useAudioPlayback must be used within AudioPlaybackProvider');
  }
  return context;
};
