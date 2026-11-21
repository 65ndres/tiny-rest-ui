import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
} from '@/components/ui/drawer';
import { Text } from '@/components/ui/text';
import { layout } from '@/app/constants/screenLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useBabies } from '@/app/context/BabyContext';
import { useRevenueCat } from '@/app/context/RevenueCatContext';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import { babyDisplayName } from '@/app/utils/babies';
import { addBabyDestination } from '@/app/utils/babyProfileForm';

const SHEET_BG = require('../../../assets/images/bg-date-picker.png');
const SHEET_TEXT = '#ffffff';

type BabySwitcherSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Bottom sheet listing the account's babies: switch, or go add another. */
const BabySwitcherSheet: React.FC<BabySwitcherSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigation = useNavigation<{ navigate: (route: string) => void }>();
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const { babies, selectedBabyId, isSwitching, switchBaby } = useBabies();
  const isProUser = user?.subscription_type === 'pro';
  const destination = addBabyDestination(isProUser, babies.length);

  const handleSelect = async (babyId: number) => {
    if (isSwitching) return;
    const switched = await switchBaby(babyId);
    if (switched) onClose();
  };

  const handleAddPress = () => {
    onClose();
    if (destination === 'paywall') {
      void presentPaywall();
      return;
    }
    navigation.navigate('AddBaby');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} anchor="bottom" size="lg">
      <DrawerBackdrop className="bg-black/60" />
      <DrawerContent className="border-white/0 bg-transparent p-0 overflow-hidden">
        <ImageBackground
          source={SHEET_BG}
          resizeMode="cover"
          style={styles.background}
        >
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text
                className="font-bold"
                style={styles.title}
                accessibilityRole="header"
              >
                Switch profile
              </Text>
              {isSwitching ? (
                <ActivityIndicator color={SHEET_TEXT} style={styles.spinner} />
              ) : null}
            </View>

            <ScrollView style={styles.list}>
              {babies.map((baby) => {
                const selected = baby.id === selectedBabyId;
                return (
                  <Pressable
                    key={baby.id}
                    onPress={() => void handleSelect(baby.id)}
                    disabled={isSwitching}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Switch to ${babyDisplayName(baby)}`}
                    style={styles.row}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={layout.iconXl}
                      color={SHEET_TEXT}
                    />
                    <Text
                      numberOfLines={1}
                      className={selected ? 'font-bold' : 'font-semibold'}
                      style={styles.rowLabel}
                    >
                      {babyDisplayName(baby)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TimerOutlineButton
              label={destination === 'paywall' ? 'Add baby · Pro' : 'Add baby'}
              iconName={destination === 'paywall' ? 'lock-closed' : 'add-sharp'}
              onPress={handleAddPress}
              disabled={isSwitching}
              variant="solid"
              size="xl"
              style={styles.addButton}
              accessibilityLabel={
                destination === 'paywall'
                  ? 'Add a baby, requires Pro'
                  : 'Add a baby'
              }
            />
          </View>
        </ImageBackground>
      </DrawerContent>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: layout.space24,
    // Extra top room so the title clears the background art's top edge.
    paddingTop: layout.space32 * 4,
    paddingBottom: layout.space32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.space12,
  },
  title: {
    color: SHEET_TEXT,
    fontSize: layout.fontXl,
    textAlign: 'center',
  },
  // Beside the title without pushing it off center.
  spinner: {
    position: 'absolute',
    right: 0,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.space12,
    paddingVertical: layout.space12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.45)',
  },
  rowLabel: {
    flex: 1,
    color: SHEET_TEXT,
    fontSize: layout.fontLg,
  },
  addButton: {
    marginTop: layout.space24,
  },
});

export default BabySwitcherSheet;
