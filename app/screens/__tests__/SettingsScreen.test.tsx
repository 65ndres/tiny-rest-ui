jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useFocusEffect: (effect: () => void) => {
      useEffect(() => {
        effect();
      }, [effect]);
    },
  };
});

const mockRemoveBaby = jest.fn();
let mockBabies = [
  { id: 1, name: 'Gaby' },
  { id: 2, name: 'Lorenzo' },
];
jest.mock('@/app/context/BabyContext', () => ({
  useBabies: () => ({
    babies: mockBabies,
    selectedBaby: mockBabies[0],
    refreshBabies: jest.fn().mockResolvedValue(undefined),
    removeBaby: mockRemoveBaby,
    isSwitching: false,
  }),
}));

const mockFetchUserProfile = jest.fn();
const mockUpdateUserProfile = jest.fn();
jest.mock('@/app/utils/userProfile', () => ({
  ...jest.requireActual('@/app/utils/userProfile'),
  fetchUserProfile: (...args: unknown[]) => mockFetchUserProfile(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

jest.mock('@/app/sharedComponents/ScreenScrollLayout', () => {
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

jest.mock('@/app/sharedComponents/TimerDateTimePickerDrawer', () => {
  const { View } = require('react-native');
  return (props: { title: string }) => <View testID={`picker:${props.title}`} {...props} />;
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Alert, TextInput } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import SettingsScreen from '@/app/screens/SettingsScreen';
import TimerSectionCard from '@/app/sharedComponents/timer/TimerSectionCard';

const profile = {
  first_name: null,
  last_name: null,
  email: 'parent@example.com',
  username: null,
  baby_name: 'Gaby',
  baby_birthdate: '2024-10-14',
  daily_nap_count: 1,
  daily_nap_count_alt: null,
  day_start_minutes: 570,
  day_end_minutes: 1320,
  time_zone: 'America/New_York',
};

const render = async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<SettingsScreen />);
  });
  return tree;
};

const pressable = (tree: ReactTestRenderer, label: string) =>
  tree.root.find(
    (node) =>
      node.props.accessibilityLabel === label && typeof node.props.onPress === 'function'
  );

const isDisabled = (node: renderer.ReactTestInstance) => {
  const pressableNode = node.find((child) => 'disabled' in child.props);
  return Boolean(pressableNode.props.disabled);
};

const typeName = (tree: ReactTestRenderer, name: string) =>
  act(() => {
    tree.root
      .find((node) => node.type === TextInput && node.props.accessibilityLabel === 'Baby name')
      .props.onChangeText(name);
  });

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useRealTimers();
  mockBabies = [
    { id: 1, name: 'Gaby' },
    { id: 2, name: 'Lorenzo' },
  ];
  mockFetchUserProfile.mockResolvedValue(profile);
  mockUpdateUserProfile.mockResolvedValue({});
  await AsyncStorage.setItem('token', 'test-token');
});

describe('SettingsScreen (Profile)', () => {
  it('keeps Save off until something changes', async () => {
    const tree = await render();
    expect(isDisabled(pressable(tree, 'Save, no changes'))).toBe(true);

    typeName(tree, 'Gabriela');

    expect(isDisabled(pressable(tree, 'Save'))).toBe(false);
  });

  it('treats a name with only extra spaces as unchanged', async () => {
    const tree = await render();
    typeName(tree, ' Gaby  ');
    expect(isDisabled(pressable(tree, 'Save, no changes'))).toBe(true);
  });

  it('saves without a pop-up and shows "Saved" on the button', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = await render();
    typeName(tree, ' Gabriela ');

    await act(async () => {
      pressable(tree, 'Save').props.onPress();
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({ baby_name: 'Gabriela', baby_birthdate: '2024-10-14' })
    );
    expect(alert).not.toHaveBeenCalled();
    expect(pressable(tree, 'Profile saved')).toBeTruthy();
  });

  it('goes back to a disabled Save once the confirmation times out', async () => {
    jest.useFakeTimers();
    const tree = await render();
    typeName(tree, 'Gabriela');
    await act(async () => {
      pressable(tree, 'Save').props.onPress();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(isDisabled(pressable(tree, 'Save, no changes'))).toBe(true);
  });

  it('a second tap right after saving does not save again', async () => {
    const tree = await render();
    typeName(tree, 'Gabriela');
    await act(async () => {
      pressable(tree, 'Save').props.onPress();
    });
    await act(async () => {
      pressable(tree, 'Profile saved').props.onPress();
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
  });

  it('shows a missing name under the field instead of a pop-up', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = await render();
    typeName(tree, '   x');
    typeName(tree, '   ');
    // Clearing the name is a change, so Save is live and shows the error.
    await act(async () => {
      pressable(tree, 'Save').props.onPress();
    });

    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    expect(tree.root.findAll((node) => node.props.children === 'Baby name is required.').length)
      .toBeGreaterThan(0);
  });

  it('still explains when the save itself fails', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUpdateUserProfile.mockRejectedValue(new Error('offline'));
    const tree = await render();
    typeName(tree, 'Gabriela');

    await act(async () => {
      pressable(tree, 'Save').props.onPress();
    });

    expect(alert).toHaveBeenCalledWith('Error', 'Could not save settings. Please try again.');
  });

  it('puts a red Delete profile inside the card, right below Save', async () => {
    const tree = await render();
    const card = tree.root.findByType(TimerSectionCard);
    const labels = card
      .findAll((node) => typeof node.props.onPress === 'function' && node.props.accessibilityLabel)
      .map((node) => node.props.accessibilityLabel as string);
    const uniqueLabels = labels.filter((label, i) => labels.indexOf(label) === i);

    const saveIndex = uniqueLabels.indexOf('Save, no changes');
    expect(saveIndex).toBeGreaterThanOrEqual(0);
    expect(uniqueLabels[saveIndex + 1]).toBe("Delete Gaby's profile");

    const deleteButton = card.find(
      (node) =>
        node.props.accessibilityLabel === "Delete Gaby's profile" &&
        typeof node.props.className === 'string'
    );
    expect(deleteButton.props.className).toContain('bg-error-600');
  });

  it('hides Delete profile when there is only one baby', async () => {
    mockBabies = [{ id: 1, name: 'Gaby' }];
    const tree = await render();
    expect(
      tree.root.findAll((node) => node.props.accessibilityLabel === "Delete Gaby's profile")
    ).toHaveLength(0);
  });
});
