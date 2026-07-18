import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SoundTrack } from '@/app/constants/soundCatalog';
import {
  CARD_BORDER_COLOR,
  GLASS_BORDER_COLOR,
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
      accessibilityState={{ selected: isActive, disabled: !playable }}
      onPress={onPress}
      disabled={!playable}
      style={[styles.wrapper, { width: tileSize }, !playable ? styles.tileDisabled : null]}
    >
      <View
        style={[
          styles.tile,
          { width: tileSize, height: tileSize },
          isActive ? styles.tileActive : styles.tileInactive,
        ]}
      >
        <ImageBackground
          source={track.coverImage}
          style={styles.cover}
          imageStyle={styles.coverImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {track.title}
      </Text>
    </Pressable>
  );
};

export default SoundTile;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  tile: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  tileInactive: {
    borderWidth: 2,
    borderColor: GLASS_BORDER_COLOR,
  },
  tileActive: {
    borderWidth: 3,
    borderColor: CARD_BORDER_COLOR,
  },
  tileDisabled: {
    opacity: 0.55,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverImage: {
    borderRadius: 11,
  },
  title: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
