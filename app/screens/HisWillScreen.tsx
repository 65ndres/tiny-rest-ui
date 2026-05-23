import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import VerseModule from '../VerseModule/VerseModule';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  liked: boolean;
  favorited: boolean;
  text: string;
}

interface Props {
  data: BibleVerse[];
  width: number;
  ref: React.RefObject<ICarouselInstance>;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const REFERENCE_HEIGHT = 812;
const REFERENCE_WIDTH = 375;
const scale = Math.min(screenHeight / REFERENCE_HEIGHT, screenWidth / REFERENCE_WIDTH);
const s = (value: number) => value * scale;

const quoteContentMaxWidth = Math.min(s(340), screenWidth);

interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  liked?: boolean;
  favorited?: boolean;
}

interface VerseModuleProps {
  data?: Verse[];
  active?: number;
}


const HisWillScreen: React.FC<VerseModuleProps> = ({ data, active }) => {

  const [verses, setVerses] = useState<Verse[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value
  
  const toggleFavorite = (index: number) => {
    setVerses((prev) =>
      prev.map((verse, i) =>
        i === index ? { ...verse, favorited: !verse.favorited } : verse
      )
    );
  };
  const API_URL_HIS_WILL = `${API_URL}/verses/search?category=his_will`; 

  // Fade-in animation on component mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Animation duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [fadeAnim]);

  return (
    <ScreenComponent style={styles.screen}>
      <Animated.View style={[styles.fadeRoot, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <View style={styles.topContent}>
            <View style={styles.quoteColumn}>
              <Text style={styles.quoteText}>
                {'"Trust in the LORD with all your heart..."'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.middleSection}>
          <VerseModule data={[]} url={API_URL_HIS_WILL} active={0} />
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

export default HisWillScreen;


const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fadeRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topSection: {
    flex: 2,
    minHeight: 0,
  },
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
  middleSection: {
    flex: 6,
    minHeight: 0,
  },
  bottomSection: {
    flex: 2,
    minHeight: 0,
  },
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
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: s(45),
    lineHeight: s(81),
    fontWeight: 'light',
    textAlign: 'center',
  },
  separator: {
    marginVertical: s(8),
    width: '80%',
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  filter: {
    margin: s(16),
    height: s(49),
    backgroundColor: 'transparent',
    textAlign: 'center',
    borderWidth: 0,
  },
  logoImage: {
    height: s(56),
    width: s(56),
    alignSelf: 'center',
  },
});


