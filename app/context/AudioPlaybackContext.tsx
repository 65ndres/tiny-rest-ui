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
import { getSoundTrackById } from '@/app/constants/soundCatalog';

/** Seconds before track end to start overlapping the next loop. */
const CROSSFADE_SECONDS = 5;
const CROSSFADE_STEPS = 80;
const MONITOR_INTERVAL_MS = 100;

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

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      // Allow both loop players to overlap during crossfade
      interruptionMode: 'mixWithOthers',
    });

    const playerA = createAudioPlayer(null, { updateInterval: 100 });
    const playerB = createAudioPlayer(null, { updateInterval: 100 });
    playerA.volume = 0;
    playerB.volume = 0;
    playerA.loop = false;
    playerB.loop = false;
    playersRef.current = [playerA, playerB];

    return () => {
      clearMonitor();
      clearFade();
      crossfadingRef.current = false;
      playerA.clearLockScreenControls();
      playerB.clearLockScreenControls();
      playerA.remove();
      playerB.remove();
      playersRef.current = null;
    };
  }, [clearFade, clearMonitor]);

  const beginCrossfade = useCallback(() => {
    const players = playersRef.current;
    if (!players || crossfadingRef.current) return;

    const fromIndex = activeIndexRef.current;
    const toIndex = fromIndex === 0 ? 1 : 0;
    const fromPlayer = players[fromIndex];
    const toPlayer = players[toIndex];
    const targetVolume = volumeRef.current;

    crossfadingRef.current = true;

    void (async () => {
      try {
        await toPlayer.seekTo(0);
      } catch {
        // Fall through and attempt play anyway
      }

      if (!crossfadingRef.current || !playersRef.current) return;

      toPlayer.volume = 0;
      toPlayer.play();

      clearFade();
      let step = 0;
      fadeRef.current = setInterval(() => {
        step += 1;
        const t = Math.min(1, step / CROSSFADE_STEPS);
        fromPlayer.volume = targetVolume * (1 - t);
        toPlayer.volume = targetVolume * t;

        if (step >= CROSSFADE_STEPS) {
          clearFade();
          fromPlayer.pause();
          fromPlayer.volume = 0;
          activeIndexRef.current = toIndex;
          crossfadingRef.current = false;
        }
      }, (CROSSFADE_SECONDS * 1000) / CROSSFADE_STEPS);
    })();
  }, [clearFade]);

  const startMonitor = useCallback(() => {
    clearMonitor();
    monitorRef.current = setInterval(() => {
      const players = playersRef.current;
      if (!players || crossfadingRef.current) return;

      const player = players[activeIndexRef.current];
      if (!player.playing || player.duration <= 0) return;

      const remaining = player.duration - player.currentTime;
      if (remaining <= CROSSFADE_SECONDS) {
        beginCrossfade();
      }
    }, MONITOR_INTERVAL_MS);
  }, [beginCrossfade, clearMonitor]);

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

      activeIndexRef.current = 0;
      activeTrackIdRef.current = trackId;
      setActiveTrackId(trackId);
      setIsPlaying(true);

      if (track.seamlessLoop) {
        playerA.loop = false;
        playerB.loop = false;
        playerA.replace(track.source);
        playerB.replace(track.source);
        playerA.volume = targetVolume;
        playerB.volume = 0;
        void playerA.seekTo(0);
        playerA.play();
        startMonitor();
      } else {
        playerA.loop = true;
        playerB.loop = false;
        playerA.replace(track.source);
        playerA.volume = targetVolume;
        playerB.volume = 0;
        void playerA.seekTo(0);
        playerA.play();
      }

      setTimeout(() => {
        playerA.setActiveForLockScreen(true, {
          title: track.title,
          artist: 'TinyRest',
        });
      }, 500);
    },
    [clearFade, clearMonitor, pauseAll, startMonitor]
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
