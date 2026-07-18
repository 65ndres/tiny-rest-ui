export type SoundTrack = {
  id: string;
  title: string;
  source?: number;
  coverImage: number;
};

const WHITE_NOISE = require('../../assets/audio/white_noise_1_loop.wav');

export const SOUND_CATALOG: SoundTrack[] = [
  {
    id: 'green-noise',
    title: 'Green Noise',
    source: WHITE_NOISE,
    coverImage: require('../../assets/images/sound1.png'),
  },
  {
    id: 'night-rain',
    title: 'Night Rain',
    source: WHITE_NOISE,
    coverImage: require('../../assets/images/sound2.png'),
  },
  {
    id: 'tranquil-ocean',
    title: 'Tranquil Ocean',
    source: WHITE_NOISE,
    coverImage: require('../../assets/images/sound3.png'),
  },
  {
    id: 'cozy-fireplace',
    title: 'Cozy Fireplace',
    source: require('../../assets/audio/sound4.mp3'),
    coverImage: require('../../assets/images/sound4.png'),
  },
];

export const getSoundTrackById = (id: string): SoundTrack | undefined =>
  SOUND_CATALOG.find((track) => track.id === id);
