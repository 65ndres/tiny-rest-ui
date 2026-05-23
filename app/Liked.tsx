import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { API_URL } from '../constants/Config';
import ScreenComponent from './sharedComponents/ScreenComponent';
import BackButton from './VerseModule/BackButton';
import VerseModule from './VerseModule/VerseModule';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  VerseModule: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Verse {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  liked?: boolean;
}

const Liked: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [moduleComponentVisibility, setModuleComponentVisibility] = useState(false);
  const [listComponentVisibility, setListComponentVisibility] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value
  const moduleFadeAnim = useRef(new Animated.Value(0)).current; // Fade animation for VerseModule
  const listFadeAnim = useRef(new Animated.Value(1)).current; // Fade animation for list content
  const contentFadeAnim = useRef(new Animated.Value(0)).current; // Fade animation for content when loaded

  const fetchLikedVerses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/liked`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        const versesData = Array.isArray(response.data) 
          ? response.data 
          : response.data.verses || [];
        setVerses(versesData);
      }
    } catch (e) {
      console.error('Fetch liked verses failed', e);
      setError('Failed to load liked verses');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (listComponentVisibility) {
        fetchLikedVerses();
        listFadeAnim.setValue(1);
      }
    }, [listComponentVisibility, listFadeAnim])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (!loading && !error) {
      contentFadeAnim.setValue(0);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error, contentFadeAnim]);

  useEffect(() => {
    if (moduleComponentVisibility && selectedVerse) {
      moduleFadeAnim.setValue(0);
      Animated.timing(moduleFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      moduleFadeAnim.setValue(0);
    }
  }, [moduleComponentVisibility, selectedVerse, moduleFadeAnim]);

  // Fade-in animation every time the screen comes into focus (if module is visible)
  useFocusEffect(
    useCallback(() => {
      if (moduleComponentVisibility && selectedVerse) {
        // Reset and animate in when screen comes into focus
        moduleFadeAnim.setValue(0);
        Animated.timing(moduleFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    }, [moduleComponentVisibility, selectedVerse, moduleFadeAnim])
  );

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const showModule = (verseId: number) => {
    // Find the verse based on the id
    const foundVerse = verses.find(verse => verse.id === verseId);
    
    if (foundVerse) {
      // Fade out the list content before showing the module
      Animated.timing(listFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSelectedVerse(foundVerse);
        setModuleComponentVisibility(true);
        setListComponentVisibility(false);
      });
    } else {
      console.warn('Verse not found with id:', verseId);
    }
  };

  const handleBackPress = () => {
    if (listComponentVisibility) {
      // If showing the list, navigate back to previous screen
      navigation.goBack();
    } else {
      // If showing the module, go back to the list
      setModuleComponentVisibility(false);
      setListComponentVisibility(true);
      setSelectedVerse(null);
      // Fade in the list content when going back
      listFadeAnim.setValue(0);
      Animated.timing(listFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Set header options dynamically based on listComponentVisibility
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <BackButton 
          text={""} 
          onPress={handleBackPress}
        />
      ),
    });
  }, [listComponentVisibility, navigation]);

  return (
    <ScreenComponent>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={{ height: "15%" }}>
        </View>
        <View style={{ height: "65%" }}> 
          <ScrollView
            style={{
              height: '100%',
            }}
          >
            {listComponentVisibility && 
            <Animated.View style={[styles.container, { opacity: listFadeAnim }]}>
            {loading ? null : error ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : verses.length === 0 ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.emptyText}>No liked verses yet</Text>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: contentFadeAnim }}>
                {verses.map((item) => (
                  <TouchableWithoutFeedback 
                    key={item.id}
                    onPress={() => showModule(item.id)}
                  >
                    <View style={styles.lineItemContainer}>
                      <View style={styles.conversationInfo}>
                        <Text style={styles.conversationName}>
                          {`${item.book} ${item.chapter}:${item.verse}`}
                        </Text>
                        {item.text ? (
                          <Text style={styles.lastMessage}>
                            {(() => {
                              const sliceLimit = Math.floor(screenWidth * 0.093);
                              return item.text.length > sliceLimit
                                ? item.text.slice(0, sliceLimit) + '...'
                                : item.text;
                            })()}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                ))}
              </Animated.View>
            )}
          </Animated.View>}
          {moduleComponentVisibility && selectedVerse && 
          <Animated.View style={{ height: "100%", opacity: moduleFadeAnim }}>
            <View style={{ height: "60%" }}>
              <VerseModule data={[selectedVerse]} active={0} url={''} />
            </View>
          </Animated.View>
          }
          </ScrollView>
        </View>
        <View style={{ height: "20%" }}>
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <Text style={styles.promesasText}>Promesas</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenComponent>
  );
};

{/* <View style={{ height: "20%" }}>
          </View> */}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignContent: 'center',
  } as ViewStyle,
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: screenHeight * 0.062,
  } as ViewStyle,
  errorText: {
    color: 'white',
    fontSize: screenWidth * 0.042,
    textAlign: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: screenWidth * 0.042,
    textAlign: 'center',
  },
  lineItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: screenWidth * 0.027,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: screenHeight * 0.025,
    paddingTop: screenHeight * 0.025,
    overflow: 'hidden',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    color: 'white',
    fontSize: screenWidth * 0.047,
    fontWeight: '500',
    marginBottom: screenHeight * 0.006,
  },
  lastMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: screenWidth * 0.038,
  },
  promesasText: {
    color: 'white',
    fontSize: screenWidth * 0.035,
    fontWeight: '500',
    textAlign: 'center',
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
});

export default Liked;