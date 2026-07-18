import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SoundTrack } from '@/app/constants/soundCatalog';
import {
  CARD_BORDER_COLOR,
  GLASS_BACKGROUND_COLOR,
  GLASS_BORDER_COLOR,
} from '@/app/constants/screenLayout';

type SoundTileProps = {
  track: SoundTrack;
  isActive: boolean;
  tileSize: number;
  onPress: () => void;
};

const PLAY_BUTTON = require('../../../assets/images/play-button.png');

/** Image inset so artwork sits smaller and centered in the glass tile. */
const IMAGE_SCALE = 0.42;

const SoundTile: React.FC<SoundTileProps> = ({
  track,
  isActive,
  tileSize,
  onPress,
}) => {
  const playable = track.source != null;
  const imageSize = Math.round(tileSize * IMAGE_SCALE);

  return (
    <Pressable
      accessibilityLabel={track.title}
      accessibilityState={{ selected: isActive, disabled: !playable }}
      onPress={onPress}
      disabled={!playable}
      style={[
        styles.wrapper,
        { width: tileSize },
        !playable ? styles.tileDisabled : null,
      ]}
    >
      <View
        style={[
          styles.tile,
          { width: tileSize, height: tileSize },
          isActive ? styles.tileActive : styles.tileInactive,
        ]}
      >
        <Image
          source={PLAY_BUTTON}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
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
    borderRadius: 15,
    backgroundColor: GLASS_BACKGROUND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
