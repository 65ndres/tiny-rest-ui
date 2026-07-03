export type SoundTrack = {
  id: string;
  title: string;
  source?: number;
  coverImage: number;
};

export const SOUND_CATALOG: SoundTrack[] = [
  {
    id: 'green-noise',
    title: 'Green Noise',
    source: require('../../assets/audio/white_noise_1.mp3'),
    coverImage: require('../../assets/images/sounds/green-noise.png'),
  },
  {
    id: 'night-rain',
    title: 'Night Rain',
    coverImage: require('../../assets/images/sounds/night-rain.png'),
  },
  {
    id: 'tranquil-ocean',
    title: 'Tranquil Ocean',
    coverImage: require('../../assets/images/sounds/tranquil-ocean.png'),
  },
];

export const getSoundTrackById = (id: string): SoundTrack | undefined =>
  SOUND_CATALOG.find((track) => track.id === id);
