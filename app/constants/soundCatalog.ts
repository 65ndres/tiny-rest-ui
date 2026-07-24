export type SoundTrack = {
  id: string;
  title: string;
  source?: number;
  coverImage: number;
  /** Dual-player crossfade loop (Night Rain / White Noise). */
  seamlessLoop?: boolean;
};

const NIGHT_RAIN = require('../../assets/audio/white_noise_1_loop.wav');
const GABBY_FAVORITE = require('../../assets/audio/sound2.mp3');
const COZY_FIREPLACE = require('../../assets/audio/sound3.mp3');
const WHITE_NOISE = require('../../assets/audio/sound4.mp3');

export const SOUND_CATALOG: SoundTrack[] = [
  {
    id: 'green-noise',
    title: "Gabby's Favorite",
    source: GABBY_FAVORITE,
    coverImage: require('../../assets/images/sound1.png'),
  },
  {
    id: 'cozy-fireplace',
    title: 'Cozy Fireplace',
    source: COZY_FIREPLACE,
    coverImage: require('../../assets/images/sound4.png'),
  },
  {
    id: 'tranquil-ocean',
    title: 'White Noise',
    source: WHITE_NOISE,
    coverImage: require('../../assets/images/sound3.png'),
    seamlessLoop: true,
  },
  {
    id: 'night-rain',
    title: 'Night Rain',
    source: NIGHT_RAIN,
    coverImage: require('../../assets/images/sound2.png'),
    seamlessLoop: true,
  },
];

export const getSoundTrackById = (id: string): SoundTrack | undefined =>
  SOUND_CATALOG.find((track) => track.id === id);
