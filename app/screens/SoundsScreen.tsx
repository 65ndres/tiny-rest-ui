import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SOUND_CATALOG } from '@/app/constants/soundCatalog';
import { useAudioPlayback } from '@/app/context/AudioPlaybackContext';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import SoundTile from '@/app/sharedComponents/sounds/SoundTile';
import VolumeOverlay from '@/app/sharedComponents/sounds/VolumeOverlay';

const TILE_GAP = 10;
const VOLUME_OVERLAY_HEIGHT = 68;

const SoundsScreen: React.FC = () => {
  const { activeTrackId, volume, toggleTrack, setVolume } =
    useAudioPlayback();

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
                tileSize={110}
                isActive={activeTrackId === item.id}
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
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tileGrid: {
    paddingTop: 16,
    paddingBottom: VOLUME_OVERLAY_HEIGHT + 16,
  },
});
