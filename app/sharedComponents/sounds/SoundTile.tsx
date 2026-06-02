import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SoundTrack } from '@/app/constants/soundCatalog';

const ACTIVE_BORDER_COLOR = '#3498db';

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
      style={[
        styles.wrapper,
        {
          width: tileSize,
          height: tileSize,
        },
        isActive && styles.wrapperActive,
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
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  wrapperActive: {
    borderColor: ACTIVE_BORDER_COLOR,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderRadius: 9,
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
