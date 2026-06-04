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
  GLASS_BACKGROUND_COLOR,
  GLASS_BORDER_COLOR,
  GLASS_BORDER_COLOR_ACTIVE,
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        {
          width: tileSize,
          height: tileSize,
        },
        isActive && styles.wrapperActive,
        pressed && styles.wrapperPressed,
      ]}
    >
      <ImageBackground
        source={track.coverImage}
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        <View style={styles.labelContainer}>
          <Text style={styles.label} numberOfLines={1}>
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
    marginBottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: GLASS_BORDER_COLOR,
    backgroundColor: GLASS_BACKGROUND_COLOR,
    overflow: 'hidden',
  },
  wrapperActive: {
    borderColor: GLASS_BORDER_COLOR_ACTIVE,
  },
  wrapperPressed: {
    opacity: 0.8,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderRadius: 14,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
