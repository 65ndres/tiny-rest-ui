import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React from 'react';
import { Dimensions, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

interface BackButtonProps {
  text: string;
  onPress?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ text, onPress }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.touchable}
      accessibilityRole="button"
      hitSlop={{ top: s(8), bottom: s(8), left: s(8), right: s(8) }}
    >
      <View style={styles.row}>
        <Ionicons name="arrow-back-sharp" size={s(25)} color="white" />
        <Text style={styles.label}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    padding: s(5),
    marginLeft: s(15),
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  label: {
    color: 'white',
    paddingLeft: s(10),
    fontSize: s(20),
  } as TextStyle,
});

export default BackButton;
