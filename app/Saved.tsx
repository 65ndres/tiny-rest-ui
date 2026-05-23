import { useColorScheme } from '@/hooks/useColorScheme';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { getSavedItems } from '../lib/sampleContent';
import type { SampleItem } from '../types/sampleItem';
import SampleModule from './SampleModule/SampleModule';
import BackButton from './SampleModule/BackButton';
import ScreenComponent from './sharedComponents/ScreenComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Saved: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [items, setItems] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleComponentVisibility, setModuleComponentVisibility] = useState(false);
  const [listComponentVisibility, setListComponentVisibility] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SampleItem | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moduleFadeAnim = useRef(new Animated.Value(0)).current;
  const listFadeAnim = useRef(new Animated.Value(1)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  const fetchSavedItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSavedItems();
      setItems(response.items);
    } catch (e) {
      console.error('Fetch saved items failed', e);
      setError('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (listComponentVisibility) {
        fetchSavedItems();
        listFadeAnim.setValue(1);
      }
    }, [listComponentVisibility, listFadeAnim, fetchSavedItems])
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
    if (moduleComponentVisibility && selectedItem) {
      moduleFadeAnim.setValue(0);
      Animated.timing(moduleFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      moduleFadeAnim.setValue(0);
    }
  }, [moduleComponentVisibility, selectedItem, moduleFadeAnim]);

  useFocusEffect(
    useCallback(() => {
      if (moduleComponentVisibility && selectedItem) {
        moduleFadeAnim.setValue(0);
        Animated.timing(moduleFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    }, [moduleComponentVisibility, selectedItem, moduleFadeAnim])
  );

  const handleBackPress = useCallback(() => {
    if (listComponentVisibility) {
      navigation.goBack();
    } else {
      setModuleComponentVisibility(false);
      setListComponentVisibility(true);
      setSelectedItem(null);
      listFadeAnim.setValue(0);
      Animated.timing(listFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      fetchSavedItems();
    }
  }, [listComponentVisibility, navigation, listFadeAnim, fetchSavedItems]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton text="" onPress={handleBackPress} />,
    });
  }, [listComponentVisibility, navigation, handleBackPress]);

  if (!loaded) {
    return null;
  }

  const showModule = (itemId: number) => {
    const foundItem = items.find((item) => item.id === itemId);

    if (foundItem) {
      Animated.timing(listFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSelectedItem(foundItem);
        setModuleComponentVisibility(true);
        setListComponentVisibility(false);
      });
    }
  };

  return (
    <ScreenComponent>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={{ height: '15%' }} />
        <View style={{ height: '65%' }}>
          <ScrollView style={{ height: '100%' }}>
            {listComponentVisibility && (
              <Animated.View style={[styles.container, { opacity: listFadeAnim }]}>
                {loading ? null : error ? (
                  <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : items.length === 0 ? (
                  <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                    <Text style={styles.emptyText}>No saved items yet</Text>
                  </Animated.View>
                ) : (
                  <Animated.View style={{ opacity: contentFadeAnim }}>
                    {items.map((item) => (
                      <TouchableWithoutFeedback
                        key={item.id}
                        onPress={() => showModule(item.id)}
                      >
                        <View style={styles.lineItemContainer}>
                          <View style={styles.conversationInfo}>
                            <Text style={styles.conversationName}>{item.title}</Text>
                            {item.body ? (
                              <Text style={styles.lastMessage}>
                                {(() => {
                                  const sliceLimit = Math.floor(screenWidth * 0.093);
                                  return item.body.length > sliceLimit
                                    ? item.body.slice(0, sliceLimit) + '...'
                                    : item.body;
                                })()}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </Animated.View>
                )}
              </Animated.View>
            )}
            {moduleComponentVisibility && selectedItem && (
              <Animated.View style={{ height: '100%', opacity: moduleFadeAnim }}>
                <View style={{ height: '60%' }}>
                  <SampleModule
                    source="inline"
                    items={[selectedItem]}
                    active={0}
                  />
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </View>
        <View style={{ height: '20%' }}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Text style={styles.appNameText}>app-name</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenComponent>
  );
};

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
  conversationInfo: { flex: 1 },
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
  appNameText: {
    color: 'white',
    fontSize: screenWidth * 0.035,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Saved;
