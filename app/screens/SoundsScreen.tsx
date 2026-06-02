import React, { useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { SOUND_CATALOG } from '@/app/constants/soundCatalog';
import { useAudioPlayback } from '@/app/context/AudioPlaybackContext';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import SoundTile from '@/app/sharedComponents/sounds/SoundTile';
import VolumeOverlay from '@/app/sharedComponents/sounds/VolumeOverlay';

const GRID_PADDING = 16;
const GRID_GAP = 12;
const VOLUME_OVERLAY_HEIGHT = 68;

const SoundsScreen: React.FC = () => {
  const { activeTrackId, isPlaying, volume, toggleTrack, setVolume } =
    useAudioPlayback();

  const tileSize = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const contentWidth = screenWidth * 0.84;
    return (contentWidth - GRID_PADDING * 2 - GRID_GAP) / 2;
  }, []);

  return (
    <ScreenComponent style={styles.screen}>
      <View style={styles.content}>
        <FlatList
          data={SOUND_CATALOG}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
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
  screen: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  content: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: GRID_PADDING,
    paddingBottom: VOLUME_OVERLAY_HEIGHT + GRID_PADDING,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
