import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type VolumeOverlayProps = {
  volume: number;
  onVolumeChange: (value: number) => void;
};

const VolumeOverlay: React.FC<VolumeOverlayProps> = ({
  volume,
  onVolumeChange,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="volume-low-outline" size={22} color="white" />
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={onVolumeChange}
        minimumTrackTintColor="#3498db"
        maximumTrackTintColor="rgba(255, 255, 255, 0.35)"
        thumbTintColor="#d0d0d0"
      />
      <Ionicons name="volume-high-outline" size={22} color="white" />
    </View>
  );
};

export default VolumeOverlay;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
