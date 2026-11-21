import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { TextInput } from '@/components/AppText';
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
} from '@/components/ui/drawer';
import { Text } from '@/components/ui/text';
import {
  HOME_TILE_PURPLE,
  layout,
} from '@/app/constants/screenLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useBabies } from '@/app/context/BabyContext';
import { useRevenueCat } from '@/app/context/RevenueCatContext';
import TimerOutlineButton from '@/app/sharedComponents/timer/TimerOutlineButton';
import { babyDisplayName, MAX_BABY_NAME_LENGTH } from '@/app/utils/babies';

const SHEET_BG = require('../../../assets/images/bg-date-picker.png');

type BabySwitcherSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Bottom sheet listing the account's babies: switch, add. */
const BabySwitcherSheet: React.FC<BabySwitcherSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigation = useNavigation<{ navigate: (route: string) => void }>();
  const { user } = useAuth();
  const { presentPaywall } = useRevenueCat();
  const { babies, selectedBabyId, isSwitching, switchBaby, addBaby } =
    useBabies();
  const isProUser = user?.subscription_type === 'pro';
  const canAddFreely = isProUser || babies.length === 0;
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    setIsAdding(false);
    setNewName('');
    onClose();
  };

  const busy = isSwitching || isSaving;

  const handleSelect = async (babyId: number) => {
    if (busy) return;
    const switched = await switchBaby(babyId);
    if (switched) close();
  };

  const handleAddPress = () => {
    if (!canAddFreely) {
      close();
      void presentPaywall();
      return;
    }
    setIsAdding(true);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setIsSaving(true);
    try {
      const created = await addBaby(name);
      if (created) {
        close();
        // Birthdate and naps drive predictions; set them right away.
        navigation.navigate('Profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={close} anchor="bottom" size="lg">
      <DrawerBackdrop className="bg-black/60" />
      <DrawerContent className="border-white/0 bg-transparent p-0 overflow-hidden">
        <ImageBackground
          source={SHEET_BG}
          resizeMode="cover"
          style={styles.background}
        >
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text className="font-bold" style={styles.title}>
                Switch profile
              </Text>
              {busy ? <ActivityIndicator color={HOME_TILE_PURPLE} /> : null}
            </View>

            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {babies.map((baby) => {
                const selected = baby.id === selectedBabyId;
                return (
                  <Pressable
                    key={baby.id}
                    onPress={() => void handleSelect(baby.id)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Switch to ${babyDisplayName(baby)}`}
                    style={styles.row}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={layout.iconXl}
                      color={HOME_TILE_PURPLE}
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

              {isAdding ? (
                <View style={styles.addForm}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Baby's name"
                    placeholderTextColor="rgba(59,31,92,0.5)"
                    autoFocus
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={MAX_BABY_NAME_LENGTH}
                    editable={!busy}
                    returnKeyType="done"
                    onSubmitEditing={() => void handleCreate()}
                    accessibilityLabel="New baby name"
                    style={styles.input}
                    cursorColor={HOME_TILE_PURPLE}
                    selectionColor={HOME_TILE_PURPLE}
                  />
                  <TimerOutlineButton
                    label="Add"
                    iconName="add-sharp"
                    onPress={() => void handleCreate()}
                    disabled={busy || newName.trim().length === 0}
                    isLoading={isSaving}
                    variant="solid"
                    size="lg"
                  />
                </View>
              ) : (
                <Pressable
                  onPress={handleAddPress}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Add a baby"
                  style={styles.row}
                >
                  <Ionicons
                    name={canAddFreely ? 'add-circle-outline' : 'lock-closed'}
                    size={layout.iconXl}
                    color={HOME_TILE_PURPLE}
                  />
                  <Text numberOfLines={1} className="font-semibold" style={styles.rowLabel}>
                    {canAddFreely ? 'Add baby' : 'Add baby · Pro'}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
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
    justifyContent: 'space-between',
    marginBottom: layout.space12,
  },
  title: {
    color: HOME_TILE_PURPLE,
    fontSize: layout.fontXl,
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
    borderBottomColor: 'rgba(59,31,92,0.25)',
  },
  rowLabel: {
    flex: 1,
    color: HOME_TILE_PURPLE,
    fontSize: layout.fontLg,
  },
  addForm: {
    gap: layout.space12,
    paddingVertical: layout.space12,
  },
  input: {
    color: HOME_TILE_PURPLE,
    fontSize: layout.fontLg,
    borderBottomWidth: 1,
    borderBottomColor: HOME_TILE_PURPLE,
    paddingVertical: layout.space6,
  },
});

export default BabySwitcherSheet;
