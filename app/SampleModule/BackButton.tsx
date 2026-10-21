import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React from 'react';
import { StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { scaleFromPhoneBaseline } from '@/constants/appViewport';
import { HEADER_BUTTON_INSET } from '@/app/constants/screenLayout';

const s = scaleFromPhoneBaseline;

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
        <Ionicons name="arrow-back-sharp" size={s(30)} color="white" />
        <Text style={styles.label}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    paddingVertical: s(5),
    // Mirrors the drawer button on the right so the arrow lines up with the
    // left edge of the content cards, nudged slightly inward.
    marginLeft: HEADER_BUTTON_INSET + s(3),
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
