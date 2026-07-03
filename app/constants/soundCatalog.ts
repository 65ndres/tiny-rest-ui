export type SoundTrack = {
  id: string;
  title: string;
  source?: number;
  coverImage: number;
};

const DOT_GRID_COVER = require('../../assets/images/round.png');

export const SOUND_CATALOG: SoundTrack[] = [
  {
    id: 'green-noise',
    title: 'Green Noise',
    source: require('../../assets/audio/white_noise_1.mp3'),
    coverImage: DOT_GRID_COVER,
  },
  {
    id: 'night-rain',
    title: 'Night Rain',
    coverImage: DOT_GRID_COVER,
  },
  {
    id: 'tranquil-ocean',
    title: 'Tranquil Ocean',
    coverImage: DOT_GRID_COVER,
  },
];

export const getSoundTrackById = (id: string): SoundTrack | undefined =>
  SOUND_CATALOG.find((track) => track.id === id);
