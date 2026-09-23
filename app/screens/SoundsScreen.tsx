import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SOUND_CATALOG } from '@/app/constants/soundCatalog';
import { layout } from '@/app/constants/screenLayout';
import { useAudioPlayback } from '@/app/context/AudioPlaybackContext';
import ScreenComponent from '@/app/sharedComponents/ScreenComponent';
import SoundTile from '@/app/sharedComponents/sounds/SoundTile';
import { getAppWindow, padX, vh } from '@/constants/appViewport';

const TILE_GAP = layout.space12;
const NUM_COLUMNS = 2;
const TILE_HEIGHT = vh(150);

const SoundsScreen: React.FC = () => {
  const { activeTrackId, toggleTrack } = useAudioPlayback();

  const { tileWidth, gridWidth, rows } = useMemo(() => {
    const gridWidth = getAppWindow().width - padX(48) * 2;
    const tileWidth = Math.floor(
      (gridWidth - TILE_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
    );
    const rows = [];
    for (let i = 0; i < SOUND_CATALOG.length; i += NUM_COLUMNS) {
      rows.push(SOUND_CATALOG.slice(i, i + NUM_COLUMNS));
    }
    return { tileWidth, gridWidth, rows };
  }, []);

  return (
    <ScreenComponent contentFlex>
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tileGrid}
        >
          <View style={[styles.grid, { width: gridWidth }]}>
            {rows.map((row) => (
              <View
                key={row.map((item) => item.id).join('-')}
                style={[styles.row, { gap: TILE_GAP }]}
              >
                {row.map((item) => (
                  <SoundTile
                    key={item.id}
                    track={item}
                    tileWidth={tileWidth}
                    tileHeight={TILE_HEIGHT}
                    isActive={activeTrackId === item.id}
                    onPress={() => toggleTrack(item.id)}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
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
    alignSelf: 'center',
    gap: TILE_GAP,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  tileGrid: {
    paddingTop: layout.space16,
    paddingHorizontal: 0,
    paddingBottom: layout.space16,
  },
});
