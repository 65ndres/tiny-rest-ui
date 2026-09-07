import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SOUND_CATALOG } from '@/app/constants/soundCatalog';
import { SCREEN_CONTENT_WIDTH_RATIO, layout } from '@/app/constants/screenLayout';
import { useAudioPlayback } from '@/app/context/AudioPlaybackContext';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import SoundTile from '@/app/sharedComponents/sounds/SoundTile';
import VolumeOverlay from '@/app/sharedComponents/sounds/VolumeOverlay';
import { getAppWindow, vh } from '@/constants/appViewport';

const NUM_COLUMNS = 2;

const SoundsScreen: React.FC = () => {
  const { activeTrackId, volume, toggleTrack, setVolume } =
    useAudioPlayback();

  const tileSize = useMemo(() => {
    const sidePadding = layout.space24;
    const tileGap = layout.space12;
    const contentWidth =
      getAppWindow().width * SCREEN_CONTENT_WIDTH_RATIO - sidePadding * 2;
    const widthFit = Math.floor(
      (contentWidth - tileGap * (NUM_COLUMNS - 1)) / NUM_COLUMNS
    );
    return Math.min(Math.round(vh(190)), widthFit);
  }, []);

  const tileGap = layout.space12;

  return (
    <ScreenComponent contentFlex>
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tileGrid}
        >
          <View style={[styles.grid, { gap: tileGap, maxWidth: tileSize * NUM_COLUMNS + tileGap }]}>
            {SOUND_CATALOG.map((item) => (
              <SoundTile
                key={item.id}
                track={item}
                tileSize={tileSize}
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
    alignSelf: 'center',
    flexWrap: 'wrap',
  },
  tileGrid: {
    paddingTop: layout.space16,
    paddingHorizontal: layout.space24,
    paddingBottom: vh(68) + layout.space16,
  },
});
