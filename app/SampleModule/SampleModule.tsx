import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel from 'react-native-reanimated-carousel';
import {
  getFeaturedItems,
  getSavedItems,
  searchByCategory,
  toggleSaved,
} from '../../lib/sampleContent';
import type { SampleItem, SamplePagination } from '../../types/sampleItem';
import { useAuth } from '../context/AuthContext';
import { useRevenueCat } from '../context/RevenueCatContext';

export type SampleModuleSource = 'featured' | 'category' | 'saved' | 'inline';

export type SampleModuleProps = {
  source: SampleModuleSource;
  category?: string;
  items?: SampleItem[];
  active?: number;
  onSavePress?: () => void;
  onSharePress?: () => void;
  requireAuth?: boolean;
};

type RootDrawerParamList = {
  NewConversation: {
    item_id?: number;
  };
};

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

const { width, height } = Dimensions.get('window');
const carouselHeight = Math.min(height * 0.4, width * 1.15);

const SampleModule: React.FC<SampleModuleProps> = ({
  source,
  category,
  items: inlineItems,
  active = 0,
  onSavePress,
  onSharePress,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const [items, setItems] = useState<SampleItem[]>([]);
  const [pagination, setPagination] = useState<SamplePagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const ref = React.useRef<ICarouselInstance>(null);
  const isProUser = user?.subscription_type === 'pro';
  const showPaywallLockedState = !isProUser && !onSavePress && !onSharePress;

  const loadItems = useCallback(async () => {
    if (source === 'inline' && inlineItems?.length) {
      setItems(inlineItems);
      setPagination(null);
      setCurrentIndex(Math.max(0, Math.min(active, inlineItems.length - 1)));
      return;
    }

    setLoading(true);
    try {
      let response;
      if (source === 'featured') {
        response = await getFeaturedItems();
      } else if (source === 'category' && category) {
        response = await searchByCategory(category);
      } else if (source === 'saved') {
        response = await getSavedItems();
      } else {
        response = { items: [], pagination: { page: 1, pages: 1, next: null, prev: null, count: 0, items: 0, last: 1 } };
      }

      setItems(response.items);
      setPagination(response.pagination);
      const initialIndex =
        response.items.length > 0
          ? Math.max(0, Math.min(active, response.items.length - 1))
          : 0;
      setCurrentIndex(initialIndex);
      setTimeout(() => {
        if (ref.current && response.items.length > 0) {
          ref.current.scrollTo({ index: initialIndex, animated: false });
        }
      }, 0);
    } catch (e) {
      console.error('Load sample items failed', e);
    } finally {
      setLoading(false);
    }
  }, [source, category, inlineItems, active]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const toggleSave = async (index: number) => {
    const item = items[index];
    if (!item?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const previousSaved = item.saved;
    setItems((prev) =>
      prev.map((v, i) => (i === index ? { ...v, saved: !v.saved } : v))
    );

    try {
      await toggleSaved(item.id);
    } catch (e) {
      console.error('Toggle save failed', e);
      setItems((prev) =>
        prev.map((v, i) => (i === index ? { ...v, saved: previousSaved } : v))
      );
    }
  };

  const onChange = (index: number) => {
    setCurrentIndex(index);
    const itemsLeft = items.length - (index + 1);
    if (itemsLeft <= 2 && pagination?.next && !loading) {
      // Single-page local data; no append fetch
    }
  };

  const showEmpty = items.length === 0 && !loading;

  return (
    <View>
      {showEmpty ? (
        <View>
          <View style={{ width: '100%' }}>
            <View
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                paddingTop: height * 0.025,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: height * 0.027,
                  textAlign: 'center',
                  alignSelf: 'center',
                  fontWeight: '300',
                  fontStyle: 'italic',
                }}
              >
                Browse sample content to get started.
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Carousel
            ref={ref}
            width={width * 0.84}
            height={carouselHeight}
            data={items}
            loop={false}
            autoPlay={false}
            onScrollEnd={onChange}
            defaultIndex={currentIndex}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ justifyContent: 'flex-start' }}
                >
                  <View style={{ width: '100%' }}>
                    <Text style={styles.bodyText}>{item.body}</Text>
                  </View>
                </ScrollView>

                <View style={styles.footer}>
                  <View style={styles.reference}>
                    <Text style={styles.titleText}>{item.title}</Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        if (onSharePress) {
                          onSharePress();
                          return;
                        }
                        if (!isProUser) {
                          void presentPaywall();
                          return;
                        }
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('NewConversation', {
                          item_id: item.id,
                        });
                      }}
                      style={[
                        styles.shareButton,
                        showPaywallLockedState && styles.disabledActionButton,
                      ]}
                      accessibilityLabel="Share sample item"
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="share-outline"
                        size={height * 0.034}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (onSavePress) {
                          onSavePress();
                          return;
                        }
                        if (!isProUser) {
                          void presentPaywall();
                          return;
                        }
                        toggleSave(index);
                      }}
                      style={[
                        styles.favoriteButton,
                        showPaywallLockedState && styles.disabledActionButton,
                      ]}
                      accessibilityLabel={
                        item.saved ? 'Remove from saved' : 'Save sample item'
                      }
                      accessibilityRole="button"
                    >
                      <FontAwesome
                        name={(item.saved ? 'heart' : 'heart-o') as 'heart' | 'heart-o'}
                        size={height * 0.034}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default SampleModule;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: height * 0.025,
    justifyContent: 'space-between',
    textAlign: 'center',
  },
  bodyText: {
    textAlign: 'center',
    fontSize: height * 0.034,
    color: 'white',
    fontWeight: '300',
    lineHeight: height * 0.047,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: height * 0.025,
  },
  reference: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: width * 0.02,
  },
  titleText: {
    fontSize: height * 0.022,
    color: 'white',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: width * 0.021,
    marginRight: width * 0.013,
  },
  favoriteButton: {
    padding: width * 0.021,
  },
  disabledActionButton: {
    opacity: 0.4,
  },
});
