import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Button } from '@rneui/themed';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define the navigation stack param list
type RootStackParamList = {
  Home: undefined;
  Conversations: undefined;
  NewConversation: undefined;
  Conversation: {
    other_user_id?: number;
    conversation_id?: number;
  };
};

// Type the navigation prop
type NavigationProp = DrawerNavigationProp<RootStackParamList>;

interface Conversation {
  id: number;
  conversation_name?: string;
  read?: boolean;
  last_message?: {
    body: string;
    time: string;
    read: boolean;
  } | null;
}

// Type the Conversations component
const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value
  const contentFadeAnim = useRef(new Animated.Value(0)).current; // Content opacity for fade-in/out

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      // Adjust the endpoint based on your API structure
      const response = await axios.get(`${API_URL}/user/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        // Handle both array response and object with conversations property
        const conversationsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.conversations || [];
        setConversations(conversationsData);
      }
    } catch (e) {
      console.error('Fetch conversations failed', e);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      // Reset content fade animation when screen comes into focus
      contentFadeAnim.setValue(0);
    }, [contentFadeAnim])
  );

  // Fade-in animation on component mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Animation duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [fadeAnim]);

  // Fade-in content when data has loaded
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

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const handleNewConversation = () => {
    // Fade out the content before navigation
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Navigate after fade-out completes
      navigation.navigate('NewConversation');
    });
  };

  const handleConversationPress = (conversationId: number) => {
    // Fade out the content before navigation
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Navigate after fade-out completes
      navigation.navigate('Conversation', {
        conversation_id: conversationId,
      });
    });
  };

  // const handleConversationSelect = (conversation: Conversation) => {
  //   // Navigate to conversation screen with the other_user_id
  //   navigation.navigate('Conversation', {
  //     // other_user_id: user.id,
  //   });
  // };


  return (
    <ScreenComponent>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.topSpacer}>
        </View>
        <View style={styles.contentArea}> 
          <Animated.View style={[styles.contentFadeContainer, { opacity: contentFadeAnim }]}>
            <ScrollView style={styles.scrollView}>
              <View style={styles.container}>
            {loading ? null : error ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : conversations.length === 0 ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.emptyText}>No conversations yet</Text>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: contentFadeAnim }}>
                {conversations.map((item) => (
                  <TouchableWithoutFeedback 
                    key={item.id}
                    onPress={() => {
                      // Navigate to conversation screen with other_user_id
                      if (item.id) {
                        handleConversationPress(item.id);
                      }
                    }}
                  >
                    <View style={styles.lineItemContainer}>
                      <View style={styles.conversationInfo}>
                        <View style={styles.conversationHeader}>
                          {item.read === false && (
                            <View style={styles.unreadIndicator} />
                          )}
                          <Text style={[
                            styles.conversationName,
                            item.read === false && styles.unreadConversationName
                          ]}>
                            {item.conversation_name}
                          </Text>
                          <View style={{display: 'flex'}}>
                            <View style={{width: '100%', alignItems: 'flex-end', justifyContent: 'flex-end'}}>
                              <Ionicons 
                                name="chevron-forward" 
                                size={screenWidth * 0.053} 
                                color="white" 
                                style={styles.chevronIcon}
                              />
                            </View>
                          </View>
                        </View>
                        {item.last_message && (
                          <View style={styles.messageContainer}>
                            <View style={styles.messageRow}>
                              <Text style={[
                                styles.lastMessage,
                                item.last_message.read === false && styles.unreadMessage
                              ]}>
                                {(() => {
                                  const body = item.last_message.body;
                                  // Get text before newline if it exists
                                  const textBeforeNewline = body.includes('\n') 
                                    ? body.split('\n')[0] 
                                    : body;
                                  // Truncate at 30 characters if needed
                                  if (textBeforeNewline.length > 20) {
                                    return textBeforeNewline.slice(0, 20) + '...';
                                  }
                                  return textBeforeNewline;
                                })()}
                              </Text>
                              {item.last_message.time && (
                                <Text style={styles.lastMessageTime}>
                                  {item.last_message.time}
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                ))}
              </Animated.View>
            )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
        <View style={styles.bottomArea}>
          <View style={styles.buttonContainer}>
            <Button
              title="NEW CONVERSATION"
              buttonStyle={styles.newConversationButton}
              titleStyle={styles.buttonTitle}
              onPress={handleNewConversation}
            />
          </View>
          <View style={styles.promesasContainer}>
            <Text style={styles.promesasText}>Promesas</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  topSpacer: {
    height: screenHeight * 0.12,
  } as ViewStyle,
  contentArea: {
    height: screenHeight * 0.60,
  } as ViewStyle,
  contentFadeContainer: {
    flex: 1,
  } as ViewStyle,
  scrollView: {
    height: '100%',
  } as ViewStyle,
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
    fontSize: screenWidth * 0.048,
    textAlign: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: screenWidth * 0.048,
    textAlign: 'center',
  },
  lineItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // padding: screenWidth * 0.027,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: screenHeight * 0.025,
    paddingTop: screenHeight * 0.025,
  } as ViewStyle,
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenHeight * 0.006,
  } as ViewStyle,
  conversationName: {
    color: 'white',
    fontSize: screenWidth * 0.053,
    fontWeight: '500',
    flex: 1,
  },
  unreadConversationName: {
    fontWeight: '700',
  },
  unreadIndicator: {
    width: screenWidth * 0.021,
    height: screenWidth * 0.021,
    borderRadius: screenWidth * 0.011,
    backgroundColor: 'white',
    marginRight: screenWidth * 0.021,
  } as ViewStyle,
  chevronIcon: {
    marginLeft: screenWidth * 0.021,
    paddingRight: 0
  },
  unreadCountBadge: {
    backgroundColor: 'white',
    borderRadius: screenWidth * 0.027,
    minWidth: screenWidth * 0.053,
    height: screenWidth * 0.053,
    paddingHorizontal: screenWidth * 0.016,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: screenWidth * 0.021,
  } as ViewStyle,
  unreadCountText: {
    color: '#ac8861ff',
    fontSize: screenWidth * 0.032,
    fontWeight: '700',
  },
  senderName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: screenWidth * 0.04,
    fontWeight: '400',
    marginBottom: screenHeight * 0.004,
  },
  messageContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  } as ViewStyle,
  messageRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  lastMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: screenWidth * 0.043,
    flex: 1,
    fontWeight: '400',
  },
  unreadMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  lastMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: screenWidth * 0.032,
    marginLeft: screenWidth * 0.027,
  },
  bottomArea: {
    height: screenHeight * 0.20,
    paddingTop: 30,
  } as ViewStyle,
  buttonContainer: {
    paddingHorizontal: screenWidth * 0.133,
    paddingBottom: screenHeight * 0.012,
  } as ViewStyle,
  newConversationButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: screenWidth * 0.08,
  } as ViewStyle,
  buttonTitle: {
    fontWeight: 'bold',
    color: '#ac8861ff',
    fontSize: screenWidth * 0.04,
  },
  promesasContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  promesasText: {
    color: 'white',
    fontSize: screenWidth * 0.04,
    fontWeight: '500',
    textAlign: 'center',
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
});

export default ConversationsScreen;

