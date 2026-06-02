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
  const playerRef = useRef<AudioPlayer | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.75);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    const player = createAudioPlayer(null);
    player.volume = 0.75;
    playerRef.current = player;

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      setIsPlaying(status.playing);
    });

    return () => {
      subscription.remove();
      player.clearLockScreenControls();
      player.remove();
      playerRef.current = null;
    };
  }, []);

  const stopPlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    player.pause();
    player.clearLockScreenControls();
    setActiveTrackId(null);
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback((trackId: string) => {
    const player = playerRef.current;
    const track = getSoundTrackById(trackId);
    if (!player || !track) return;

    player.loop = true;
    player.replace(track.source);
    player.volume = volume;
    player.play();
    setActiveTrackId(trackId);

    setTimeout(() => {
      player.setActiveForLockScreen(true, {
        title: track.title,
        artist: 'TinyRest',
      });
    }, 500);
  }, [volume]);

  const toggleTrack = useCallback(
    (trackId: string) => {
      if (activeTrackId === trackId && isPlaying) {
        stopPlayback();
        return;
      }

      startPlayback(trackId);
    },
    [activeTrackId, isPlaying, startPlayback, stopPlayback]
  );

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (playerRef.current) {
      playerRef.current.volume = clamped;
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
