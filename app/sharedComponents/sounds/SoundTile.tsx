import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { SoundTrack } from '@/app/constants/soundCatalog';
import {
  GLASS_BORDER_COLOR_ACTIVE,
  soundTileClassName,
} from '@/app/constants/screenLayout';

type SoundTileProps = {
  track: SoundTrack;
  isActive: boolean;
  tileSize: number;
  onPress: () => void;
};

const SoundTile: React.FC<SoundTileProps> = ({
  track,
  isActive,
  tileSize,
  onPress,
}) => {
  const playable = track.source != null;

  return (
    <Pressable
      accessibilityLabel={track.title}
      className={soundTileClassName}
      onPress={onPress}
      disabled={!playable}
      style={ styles.tile}
    >
      <ImageBackground
        source={track.coverImage}
        style={styles.cover}
        imageStyle={styles.coverImage}
        resizeMode="cover"
      />
    </Pressable>
  );
};

export default SoundTile;

const styles = StyleSheet.create({
  tile: {
    borderColor: GLASS_BORDER_COLOR_ACTIVE,
    borderWidth: 2,
    width: 110,
    height: 110,
    borderRadius: 13,
    overflow: 'hidden'
  },
  wrapperDisabled: {
    opacity: 0.7,
  },
  wrapperPressed: {
    opacity: 0.8,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverImage: {
    borderRadius: 13,
  },
});
