import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';

type RootStackParamList = {
  Saved: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SavedItemsButton: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Saved')}
      style={styles.button}
      accessibilityRole="button"
    >
      <MaterialIcons name="filter-list" size={25} color="white" />
    </TouchableOpacity>
  );
};

const styles = {
  button: {
    padding: 5,
    marginRight: 15,
  } as StyleProp<ViewStyle>,
};

export default SavedItemsButton;
