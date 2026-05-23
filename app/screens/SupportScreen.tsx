import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '@rneui/themed';
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

import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';
import BackButton from '../SampleModule/BackButton';

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
  Support: {
    conversation_id?: number,
  };
};

type NavigationProp = DrawerNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'Support';
  params: RootStackParamList['Support'];
};

interface ConversationData {
  id: number;
  conversation_name?: string;
  messages: Array<{
    id: number;
    body: string;
    sender_id: number;
    read: boolean;
    created_at: string;
  }>;
}

const SupportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const other_user_id = 1;
  const { conversation_id } = route.params || {};
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<ConversationData['messages']>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current; // Fade animation for main content
  const messagesFadeAnim = useRef(new Animated.Value(0)).current; // Fade animation for messages list
  const flatListRef = useRef<FlatList>(null);
  
  const fetchConversationData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const conversationResponse = await axios.get(
        `${API_URL}/conversations/admin_conversation`,
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
  }, [other_user_id, conversation_id, conversationData?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchConversationData();
      contentFadeAnim.setValue(0);
      messagesFadeAnim.setValue(0);
    }, [fetchConversationData, contentFadeAnim, messagesFadeAnim])
  );

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!loading && conversationData) {
      contentFadeAnim.setValue(0);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, conversationData, contentFadeAnim]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesFadeAnim.setValue(0);
      Animated.timing(messagesFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, messages.length, messagesFadeAnim]);

  const handleInputChange = (text: string) => {
    setInputText(text);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !conversationData) return;

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
      }
    } catch (e) {
      console.error('Send message failed', e);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <BackButton 
          text="" 
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation]);

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

  const otherUserName = "Support";
  if (loading) {
    return (
      <ScreenComponent>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </ScreenComponent>
    );
  }

  return (
    <ScreenComponent>
      <Animated.View style={{opacity: contentFadeAnim }}>
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
                <View style={styles.messagesWrapper}>
                  <View style={styles.container}>
                    {messages.length > 0 &&
                    <Animated.View style={[styles.messagesContainer, { opacity: messagesFadeAnim }]}>
                      <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.messagesList}
                        inverted={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                      />
                    </Animated.View>
                    }
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputRow}>
                      <View style={styles.inputFieldContainer}>
                        <Input
                          placeholder="Type your message..."
                          value={inputText}
                          onChangeText={handleInputChange}
                          placeholderTextColor={'white'}
                          inputStyle={styles.inputText}
                          inputContainerStyle={styles.inputContainerStyle}
                          cursorColor={"#ffffff"}
                          selectionColor={'white'}
                          multiline={true}
                        />
                      </View>
                      <View style={styles.sendButtonContainer}>
                        <TouchableOpacity
                          onPress={handleSendMessage}
                          style={[
                            styles.sendIconButton,
                            !inputText.trim() && styles.sendIconButtonDisabled
                          ]}
                          activeOpacity={0.7}
                          disabled={!inputText.trim()}
                        >
                          <Ionicons 
                            name="send" 
                            size={screenWidth * 0.075} 
                            color={inputText.trim() ? "#ac8861ff" : "rgba(172, 134, 97, 0.4)"} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
          <View style={styles.bottomArea}>
            <View style={styles.appNameContainer}>
              <Text style={styles.appNameText}>app-name</Text>
            </View>
          </View>
        </View>
      </Animated.View>
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
  bottomArea: {
    height: screenHeight * 0.1,
    paddingTop: 30
  } as ViewStyle,
  inputWrapper: {
  } as ViewStyle,
  inputContainer: {
    paddingVertical: screenHeight * 0.01,
  } as ViewStyle,
  inputRow: {
    flexDirection: 'row',
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
    backgroundColor: 'white',
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

export default SupportScreen;

