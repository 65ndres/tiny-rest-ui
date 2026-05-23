import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import 'react-native-reanimated';

import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@rneui/themed';
import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import BackButton from '../SampleModule/BackButton';
import { formatItemForMessage, getItemById, searchByQuery } from '../../lib/sampleContent';
import type { SampleItem } from '../../types/sampleItem';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Conversations: undefined;
  NewConversation: undefined;
  Conversation: {
    other_user_id?: number,
    conversation_id?: number,
    item_id?: number,
  };
};

type NavigationProp = DrawerNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'Conversation';
  params: RootStackParamList['Conversation'];
};

interface ConversationData {
  id: number;
  conversation_name?: string;
  other_user_id?: number;
  messages: Array<{
    id: number;
    body: string;
    sender_id: number;
    read: boolean;
    created_at: string;
  }>;
}

const ConversationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { other_user_id, conversation_id, item_id } = route.params || {};
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<ConversationData['messages']>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [itemResults, setItemResults] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messagesFadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [moduleComponentVisibility, setModuleComponentVisibility] = useState(false);
  const [listComponentVisibility, setListComponentVisibility] = useState(true);
  const [itemIdLoaded, setItemIdLoaded] = useState<boolean>(false);
  
  const fetchConversationData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const conversationResponse = await axios.post(
        `${API_URL}/conversation/new`,
        { 
          other_user_id: route.params.other_user_id || null, 
          conversation_id: conversation_id || null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (conversationResponse.data) {
        setCurrentUserId(conversationResponse.data.current_user_id);
        setConversationData(conversationResponse.data);
        setMessages(conversationResponse.data.messages || []);
      }
    } catch (e) {
      console.error('Failed to fetch conversation data', e);
    } finally {
      setLoading(false);
    }
  }, [conversation_id, route.params]);

  useFocusEffect(
    useCallback(() => {
      if (listComponentVisibility) {
        fetchConversationData();
      }
    }, [listComponentVisibility, fetchConversationData])
  );

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && listComponentVisibility) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages, listComponentVisibility]);

  useEffect(() => {
    if (!loading && messages.length > 0 && listComponentVisibility) {
      messagesFadeAnim.setValue(0);
      Animated.timing(messagesFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, messages.length, listComponentVisibility, messagesFadeAnim]);


  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (text.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchItems(text.trim());
      }, 500);
    } else {
      setItemResults([]);
    }
  };

  const searchItems = async (query: string) => {
    try {
      const response = await searchByQuery(query);
      setItemResults(response.items);
    } catch (e) {
      console.error('Search sample items failed', e);
      setItemResults([]);
    }
  };

  const handleItemSelect = (item: SampleItem) => {
    setInputText(formatItemForMessage(item));
    setItemResults([]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()  || !conversationData) return;

    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/conversations/${conversationData.id}/messages`,
        { body: inputText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 || response.status === 201) {
        fetchConversationData();
        setInputText("");
        setItemIdLoaded(false);
      }
    } catch (e) {
      console.error('Send message failed', e);
    }
  };

  const fetchItemById = async (id: number) => {
    try {
      const item = await getItemById(id);
      if (item) {
        setInputText(formatItemForMessage(item));
        setItemIdLoaded(true);
      }
    } catch (e) {
      console.error('Fetch sample item by id failed', e);
    } finally {
      setItemIdLoaded(true);
    }
  };

  useEffect(() => {
    if (item_id && !itemIdLoaded) {
      fetchItemById(item_id);
      navigation.setParams({ item_id: undefined });
    }
  }, [item_id, itemIdLoaded, navigation]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <BackButton 
          text="" 
          onPress={() => navigation.navigate('Conversations')}
        />
      ),
    });
  }, [listComponentVisibility, navigation]);


  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    const isSent = item.sender_id === currentUserId;
    return (

        <View
          style={[
            styles.messageContainer,
            isSent ? styles.sentMessageContainer : styles.receivedMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isSent ? styles.sentMessageBubble : styles.receivedMessageBubble,
            ]}
          >
            <Text style={[styles.messageText, isSent && styles.sentMessageText]}>
              {item.body}
            </Text>
            <Text style={[styles.messageTime, isSent && styles.sentMessageTime]}>
              {new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
    );
  };

  if (!loaded) {
    return null;
  }

  const otherUserName = conversationData?.conversation_name || "Unknown User";
  if (loading) {
    return (
      <ScreenComponent>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}></Text>
        </View>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent>
        <View style={{overflow: 'hidden'}}>
          <View style={styles.topHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.quoteText}>With</Text>
              <Text style={styles.otherUserName}>{otherUserName}</Text>
            </View>
          </View>
          <View style={styles.messagesArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'position' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 200 : 0}
            >
              <View style={{height: '100%'}}>
              {listComponentVisibility && (
                <View style={styles.messagesWrapper}>
                  <View style={styles.container}>
                    {itemResults.length === 0 &&
                    <Animated.View style={[styles.messagesContainer, { opacity: messagesFadeAnim }]}>
                      <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.messagesList}
                        inverted={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                      />
                    </Animated.View>
                    }
                    {inputText.trim().length >= 2 && itemResults.length > 0 && (
                      <View style={styles.itemResultsContainer}>
                        <FlatList
                          data={itemResults}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.itemResultItem}
                              onPress={() => handleItemSelect(item)}
                            >
                              <Text style={styles.itemResultText}>
                                {item.title}
                              </Text>
                              <Text style={styles.itemResultBody} numberOfLines={2}>
                                {item.body}
                              </Text>
                            </TouchableOpacity>
                          )}
                          keyExtractor={(item) => item.id.toString()}
                          style={styles.itemResultsList}
                          keyboardShouldPersistTaps="handled"
                        />
                      </View>
                    )}

                  </View>
                </View>
              )}

              {!moduleComponentVisibility && (
                <>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                        <View style={styles.inputRow}>
                          <View style={styles.inputFieldContainer}>
                          <Input
                            placeholder="Search sample items..."
                            value={inputText}
                            onChangeText={handleInputChange}
                            placeholderTextColor={'white'}
                            inputStyle={styles.inputText}
                            inputContainerStyle={styles.inputContainerStyle}
                            leftIcon={{ 
                              type: 'materialIcons', 
                              name: 'search',
                              color: '#ffffffff', 
                              size: screenWidth * 0.064
                            }}
                            cursorColor={"#ffffff"}
                            selectionColor={'white'}
                            multiline={false}
                          />
                          </View>
                          <View style={styles.sendButtonContainer}>
                            <TouchableOpacity
                              onPress={handleSendMessage}
                              style={[
                                styles.sendIconButton,
                                inputText.trim().length < 2 && styles.sendIconButtonDisabled
                              ]}
                              activeOpacity={0.7}
                              disabled={inputText.trim().length < 2}
                            >
                              <Ionicons 
                                name="send" 
                                size={screenWidth * 0.075} 
                                color={inputText.trim().length >= 2 ? "white" : "rgba(172, 134, 97, 0.4)"} 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                  </View>
                </View>
                </>
                )}
            </View>
            </KeyboardAvoidingView>
          </View>
          <View style={styles.bottomArea}>
              <View style={styles.appNameContainer}>
                <Text style={styles.appNameText}>app-name</Text>
              </View>
            </View>
        </View>
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    color: 'white',
    fontSize: screenWidth * 0.042,
  },
  topHeader: {
    height: screenHeight * 0.15,
    paddingBottom: 20
  } as ViewStyle,
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: screenHeight * 0.074,
    marginTop: 20,
  } as ViewStyle,
  quoteText: {
    color: 'white',
    fontSize: screenWidth * 0.052,
    fontWeight: '300',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  otherUserName: {
    color: 'white',
    fontSize: screenWidth * 0.052,
    fontWeight: '600',
  },
  messagesArea: {
    overflow: 'hidden',
    height: screenHeight * 0.7,
  } as ViewStyle,
  messagesWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  container: {
    justifyContent: 'flex-end',
  } as ViewStyle,
  messagesContainer: {
    paddingTop: screenHeight * 0.012,
  } as ViewStyle,
  messagesList: {
    paddingBottom: screenHeight * 0.012,
  },
  messageContainer: {
    marginVertical: screenHeight * 0.005,
  } as ViewStyle,
  sentMessageContainer: {
    alignItems: 'flex-end',
  } as ViewStyle,
  receivedMessageContainer: {
    alignItems: 'flex-start',
  } as ViewStyle,
  messageBubble: {
    maxWidth: '75%',
    padding: screenWidth * 0.032,
    borderRadius: screenWidth * 0.048,
  } as ViewStyle,
  sentMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomRightRadius: screenWidth * 0.011,
  } as ViewStyle,
  receivedMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomLeftRadius: screenWidth * 0.011,
  } as ViewStyle,
  messageText: {
    color: 'white',
    fontSize: screenWidth * 0.05,
    marginBottom: screenHeight * 0.005,
  },
  sentMessageText: {
    color: '#ac8861ff',
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: screenWidth * 0.026,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: '#ac8861ff',      
  },
  itemModuleContainer: {
    paddingTop: screenHeight * 0.062,
  } as ViewStyle,
  itemResultsContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  itemResultsList: {
    flexGrow: 0,
  },
  itemResultItem: {
    padding: screenWidth * 0.032,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  itemResultText: {
    color: 'white',
    fontSize: screenWidth * 0.052,
    fontWeight: '600',
    marginBottom: screenHeight * 0.005,
  },
  itemResultBody: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: screenWidth * 0.042,
  },
  bottomArea: {
    height: screenHeight * 0.1,
    paddingTop: 30
  } as ViewStyle,
  inputWrapper: {
    paddingHorizontal: 0,
  } as ViewStyle,
  inputContainer: {
    paddingVertical: screenHeight * 0.01,
  } as ViewStyle,
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  } as ViewStyle,
  inputFieldContainer: {
    width: '85%',
  } as ViewStyle,
  inputText: {
    color: 'white',
    fontSize: screenWidth * 0.052,
  },
  inputContainerStyle: {
    borderBottomColor: 'white',
  } as ViewStyle,
  sendButtonContainer: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  } as ViewStyle,
  sendIconButton: {
    borderRadius: screenWidth * 0.053,
    padding: screenWidth * 0.027,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  sendIconButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  appNameContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: screenHeight * 0.012,
  } as ViewStyle,
  appNameText: {
    color: 'white',
    fontSize: screenWidth * 0.035,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ConversationScreen;

