import { useFonts } from 'expo-font';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import BrowseContent from '../sharedComponents/BrowseContent';
import ScreenComponent from '../sharedComponents/ScreenComponent';

const BrowseScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!loaded) {
    return null;
  }

  return (
    <ScreenComponent>
      <Animated.View style={[styles.animatedView, { opacity: fadeAnim }]}>
        <View style={styles.topSection} />
        <View style={styles.middleSection}>
          <BrowseContent />
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.bottomContent}>
            <Text style={styles.appNameText}>app-name</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenComponent>
  );
};

export default BrowseScreen;

const styles = StyleSheet.create({
  animatedView: {},
  topSection: { height: '12%' },
  middleSection: { height: '68%' },
  bottomSection: { height: '20%' },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  appNameText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
});
