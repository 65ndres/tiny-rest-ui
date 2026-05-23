import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '@rneui/themed';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { API_URL } from '../../constants/Config';
import ScreenComponent from '../sharedComponents/ScreenComponent';

// Define the navigation stack param list
type RootStackParamList = {
  Home: undefined;
  Conversations: undefined;
  NewConversation: {
    verse_id?: number;
  };
  Conversation: {
    other_user_id?: number;
    conversation_id?: number;
    verse_id?: number;
  };
};

// Type the navigation prop
type NavigationProp = DrawerNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'NewConversation';
  params: RootStackParamList['NewConversation'];
};

interface User {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

// Type the NewConversation component
const NewConversationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colorScheme = useColorScheme();
  const { verse_id } = route.params || {};
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current; // Fade animation for content when loaded
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade-in animation every time the screen is seen
  useFocusEffect(
    useCallback(() => {
      // Reset and fade in content every time screen comes into focus
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setUsers([]);
      setError(null);
      // Reset fade animation when clearing search
      contentFadeAnim.setValue(0);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, contentFadeAnim]);

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

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      // Adjust the endpoint based on your API structure
      // Example: /api/v1/users/search?q=query
      const response = await axios.get(`${API_URL}/users/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: query },
      });

      if (response.data) {
        const usersData = Array.isArray(response.data) 
          ? response.data 
          : response.data.users || [];
        setUsers(usersData);
      }
    } catch (e) {
      console.error('Search users failed', e);
      setError('Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    debugger;
    // Navigate to conversation screen with the other_user_id and verse_id if present
    navigation.navigate('Conversation', {
      other_user_id: user.id,
      verse_id: verse_id,
    });
  };

  if (!loaded) {
    return null;
  }

  return (
    <ScreenComponent>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={{ height: "15%" }}>
        </View>
        <View style={{ height: "65%" }}> 
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search for a user..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={'#d8d8d8ff'}
              inputStyle={{ color: 'white', fontSize: 22 }}
              inputContainerStyle={{ borderBottomColor: 'white' }}
              leftIcon={{ 
                type: 'materialIcons', 
                name: 'search', 
                color: '#ffffffff', 
                size: 30 
              }}
              cursorColor={"#ffffff"}
              selectionColor={'white'}
            />
          </View>
          <ScrollView
            style={{
              height: '100%',
            }}
          >
            <View style={styles.container}>
            {loading ? null : error ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : searchQuery.trim().length < 2 ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
              </Animated.View>
            ) : users.length === 0 && !loading ? (
              <Animated.View style={[styles.centerContainer, { opacity: contentFadeAnim }]}>
                <Text style={styles.emptyText}>No users found</Text>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: contentFadeAnim }}>
                {users.map((user) => (
                  <TouchableOpacity 
                    key={user.id}
                    onPress={() => handleUserSelect(user)}
                  >
                    <View style={styles.lineItemContainer}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {user.username || user.email}
                        </Text>
                        {user.first_name && user.last_name && (
                          <Text style={styles.userEmail}>
                            {`${user.first_name} ${user.last_name}`}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </View>
          </ScrollView>
        </View>
        <View style={{ height: "20%" }}>
          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '500', textAlign: 'center' }}>Promesas</Text>
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
    paddingTop: 50,
  } as ViewStyle,
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  searchContainer: {
    paddingTop: 10,
  },
  lineItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 20,
    paddingTop: 20,
    // paddingHorizontal: 10,
    marginHorizontal: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 5,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
});

export default NewConversationScreen;

