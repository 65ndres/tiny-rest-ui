import { useFonts } from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import YourChoiceContent from '../sharedComponents/YourChoiceContent';


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



const width = Dimensions.get("window").width;

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

const categoriesToList = [
  { label: 'Anxiety', value: 'Anxiety' },
  { label: 'Acceptance', value: 'Acceptance' },
  { label: 'Assurance', value: 'Assurance' },
  { label: 'Belief', value: 'Belief' },
  { label: 'Blessings', value: 'Blessings' },
  { label: 'Confidence', value: 'Confidence' },
  { label: 'Courage', value: 'Courage' },
  { label: 'Depression', value: 'Depression' },
  { label: 'Encouragement', value: 'Encouragement' },
  { label: 'Faith', value: 'Faith' },
  { label: 'Fear', value: 'Fear' },
  { label: 'Friendship', value: 'Friendship' },
  { label: 'Gratitude', value: 'Gratitude' },
  { label: 'Grief', value: 'Grief' },
  { label: 'Guilt', value: 'Guilt' },
  { label: 'Health', value: 'Health' },
  { label: 'Inspiration', value: 'Inspiration' },
  { label: 'Kindness', value: 'Kindness' },
  { label: 'Loneliness', value: 'Loneliness' },
  { label: 'Love', value: 'Love' },
  { label: 'Peace', value: 'Peace' },
  { label: 'Prayer', value: 'Prayer' },
  { label: 'Protection', value: 'Protection' },
  { label: 'Provision', value: 'Provision' },
  { label: 'Respect', value: 'Respect' },
  { label: 'Salvation', value: 'Salvation' },
  { label: 'Serving', value: 'Serving' },
  { label: 'Stress', value: 'Stress' },
  { label: 'Trust', value: 'Trust' },
  { label: 'Truth', value: 'Truth' },
  { label: 'Worry', value: 'Worry' },
]

const YourChoiceScreen: React.FC<VerseModuleProps> = ({ data, active }) => {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [verseComponentVisibility, setVerseComponentVisibility] = useState(true)
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value

  // const [pageNumber, setpageNumber] = useState("1");

  const ref = React.useRef<ICarouselInstance>(null);
    const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Fade-in animation on component mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Animation duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [fadeAnim]);
  
  const toggleFavorite = (index: number) => {
    setVerses((prev) =>
      prev.map((verse, i) =>
        i === index ? { ...verse, favorited: !verse.favorited } : verse
      )
    );
  };

  const toggleVerseComponent = () => {
    setVerseComponentVisibility(!verseComponentVisibility)
  }


  return (
    <ScreenComponent>
      <Animated.View style={[styles.animatedView, { opacity: fadeAnim }]}>
      <View style={styles.topSection}>
      </View>
        <View style={styles.middleSection}>
            <YourChoiceContent></YourChoiceContent>
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

export default YourChoiceScreen;



const styles = StyleSheet.create({
  animatedView: {},
  topSection: {
    height: '12%',
  },
  middleSection: {
    height: '68%',
  },
  bottomSection: {
    height: '20%',
  },
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
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 44,
    lineHeight: 84,
    fontWeight: 'light',
    textAlign: 'center',
  },
  separator: {
    marginVertical: 8,
    width:"80%",
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
    dropdown: {
      margin: 16,
      height: 50,
      backgroundColor: 'transparent',
      textAlign: 'center',
      borderWidth: 0
    },
    icon: {
      marginRight: 5,
    },
    placeholderStyle: {
      fontSize: 22,
    },
    selectedTextStyle: {
      fontSize: 25,
      color: 'white',
      textAlign: 'center'
    },
    iconStyle: {
      color: 'transparent',
      display: 'none'
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 22,
    },
    containerss: {
      backgroundColor: 'transparent',
      borderWidth: 0
    },
    logoImage: {
      height: 60,
      width: 60,
      alignSelf: 'center',
    }
});


