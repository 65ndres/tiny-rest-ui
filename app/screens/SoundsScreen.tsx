import React, { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SOUND_CATALOG } from '@/app/constants/soundCatalog';
import { SCREEN_CONTENT_WIDTH_RATIO } from '@/app/constants/screenLayout';
import { useAudioPlayback } from '@/app/context/AudioPlaybackContext';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import SoundTile from '@/app/sharedComponents/sounds/SoundTile';
import VolumeOverlay from '@/app/sharedComponents/sounds/VolumeOverlay';

const TILE_GAP = 10;
const VOLUME_OVERLAY_HEIGHT = 68;

const SoundsScreen: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { activeTrackId, isPlaying, volume, toggleTrack, setVolume } =
    useAudioPlayback();

  const tileSize = useMemo(() => {
    const contentWidth = screenWidth * SCREEN_CONTENT_WIDTH_RATIO;
    return Math.floor((contentWidth - TILE_GAP * 2) / 3);
  }, [screenWidth]);

  return (
    <ScreenComponent contentFlex>
      <View style={styles.content}>
        <FlatList
          data={SOUND_CATALOG}
          keyExtractor={(item) => item.id}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tileRow}
          ItemSeparatorComponent={() => <View style={{ width: TILE_GAP }} />}
          renderItem={({ item }) => (
            <SoundTile
              track={item}
              tileSize={tileSize}
              isActive={activeTrackId === item.id && isPlaying}
              onPress={() => toggleTrack(item.id)}
            />
          )}
        />
        <VolumeOverlay volume={volume} onVolumeChange={setVolume} />
      </View>
    </ScreenComponent>
  );
};

export default SoundsScreen;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  tileRow: {
    paddingTop: 16,
    paddingBottom: VOLUME_OVERLAY_HEIGHT + 16,
  },
});
