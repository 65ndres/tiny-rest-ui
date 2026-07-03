import React, { useMemo } from 'react';
import {
  ScrollView,
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
const NUM_COLUMNS = 3;
const VOLUME_OVERLAY_HEIGHT = 68;

const SoundsScreen: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { activeTrackId, isPlaying, volume, toggleTrack, setVolume } =
    useAudioPlayback();

  const tileSize = useMemo(() => {
    const contentWidth = screenWidth * SCREEN_CONTENT_WIDTH_RATIO;
    return Math.floor(
      (contentWidth - TILE_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
    );
  }, [screenWidth]);

  return (
    <ScreenComponent contentFlex>
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tileGrid}
        >
          <View style={styles.grid}>
            {SOUND_CATALOG.map((item) => (
              <SoundTile
                key={item.id}
                track={item}
                tileSize={80}
                isActive={activeTrackId === item.id && isPlaying}
                onPress={() => toggleTrack(item.id)}
              />
            ))}
          </View>
        </ScrollView>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tileGrid: {
    paddingTop: 16,
    paddingBottom: VOLUME_OVERLAY_HEIGHT + 16,
  },
});
