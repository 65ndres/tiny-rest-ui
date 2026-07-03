import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SoundTrack } from '@/app/constants/soundCatalog';

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
  const innerSize = tileSize - 4;

  return (
    <Pressable
      onPress={onPress}
      disabled={!playable}
      style={({ pressed }) => [
        styles.wrapper,
        {
          width: tileSize,
          height: tileSize,
        },
        isActive ? styles.wrapperActive : styles.wrapperInactive,
        !playable && styles.wrapperDisabled,
        playable && pressed && styles.wrapperPressed,
      ]}
    >
      <ImageBackground
        source={track.coverImage}
        style={[styles.image, { width: innerSize, height: innerSize }]}
        imageStyle={styles.imageRadius}
        resizeMode="cover"
      >
        <View style={styles.labelContainer}>
          <Text style={styles.label} numberOfLines={2}>
            {track.title}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

export default SoundTile;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapperInactive: {
    borderColor: 'transparent',
  },
  wrapperActive: {
    borderColor: '#FFFFFF',
  },
  wrapperDisabled: {
    opacity: 0.7,
  },
  wrapperPressed: {
    opacity: 0.8,
  },
  image: {
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderRadius: 10,
  },
  labelContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 20,
  },
  label: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
