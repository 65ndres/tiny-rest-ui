import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import SampleModule from '../SampleModule/SampleModule';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;
const quoteContentMaxWidth = Math.min(s(340), screenWidth);

const FeaturedScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <ScreenComponent style={styles.screen}>
      <Animated.View style={[styles.fadeRoot, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <View style={styles.topContent}>
            <View style={styles.quoteColumn}>
              <Text style={styles.quoteText}>
                This is sample featured content for your customizable app.
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.middleSection}>
          <SampleModule source="featured" active={0} />
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.bottomContent}>
            <Text style={styles.appNameText}>Promesas</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenComponent>
  );
};

export default FeaturedScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fadeRoot: { flex: 1 },
  topSection: { flex: 2, minHeight: 0 },
  topContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: s(12),
  },
  quoteColumn: {
    width: '100%',
    maxWidth: quoteContentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: s(24),
  },
  middleSection: { flex: 6, minHeight: 0 },
  bottomSection: { flex: 2, minHeight: 0 },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: s(18),
  },
  quoteText: {
    color: 'white',
    fontSize: s(22),
    fontWeight: '300',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  appNameText: {
    color: 'white',
    fontSize: s(15),
    fontWeight: '500',
    textAlign: 'center',
  },
});
