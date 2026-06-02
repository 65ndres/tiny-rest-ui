export type SoundTrack = {
  id: string;
  title: string;
  source: number;
  coverImage: number;
};

export const SOUND_CATALOG: SoundTrack[] = [
  {
    id: 'white-noise-1',
    title: 'White Noise',
    source: require('../../assets/audio/white_noise_1.mp3'),
    coverImage: require('../../assets/images/bg-clouds.jpg'),
  },
];

export const getSoundTrackById = (id: string): SoundTrack | undefined =>
  SOUND_CATALOG.find((track) => track.id === id);
