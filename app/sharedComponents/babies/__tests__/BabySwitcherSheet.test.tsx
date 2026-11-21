jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// The real drawer animates through a portal; render its children inline.
jest.mock('@/components/ui/drawer', () => {
  const { View } = require('react-native');
  return {
    Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? <View testID="drawer">{children}</View> : null,
    DrawerBackdrop: () => null,
    DrawerContent: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

let mockUser: { subscription_type: string } | null = { subscription_type: 'pro' };
jest.mock('@/app/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockPresentPaywall = jest.fn();
jest.mock('@/app/context/RevenueCatContext', () => ({
  useRevenueCat: () => ({ presentPaywall: mockPresentPaywall }),
}));

const mockSwitchBaby = jest.fn();
let mockBabies = [
  { id: 1, name: 'Gaby' },
  { id: 2, name: 'Lorenzo' },
];
jest.mock('@/app/context/BabyContext', () => ({
  useBabies: () => ({
    babies: mockBabies,
    selectedBabyId: 1,
    isSwitching: false,
    switchBaby: mockSwitchBaby,
  }),
}));

import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import BabySwitcherSheet from '@/app/sharedComponents/babies/BabySwitcherSheet';

const render = (onClose = jest.fn()) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(<BabySwitcherSheet isOpen onClose={onClose} />);
  });
  return tree;
};

const byLabel = (tree: ReactTestRenderer, label: string) =>
  tree.root.find(
    (node) =>
      node.props.accessibilityLabel === label && typeof node.props.onPress === 'function'
  );

const textNode = (tree: ReactTestRenderer, content: string) =>
  tree.root.find((node) => node.type === Text && node.props.children === content);

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { subscription_type: 'pro' };
  mockBabies = [
    { id: 1, name: 'Gaby' },
    { id: 2, name: 'Lorenzo' },
  ];
});

describe('BabySwitcherSheet', () => {
  it('renders nothing while closed', () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = renderer.create(<BabySwitcherSheet isOpen={false} onClose={jest.fn()} />);
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('shows a centered "Switch profile" title', () => {
    const title = StyleSheet.flatten(textNode(render(), 'Switch profile').props.style);
    expect(title.textAlign).toBe('center');
  });

  it('draws the title and baby names in white', () => {
    const tree = render();
    for (const label of ['Switch profile', 'Gaby', 'Lorenzo']) {
      expect(StyleSheet.flatten(textNode(tree, label).props.style).color).toBe('#ffffff');
    }
  });

  it('switches babies and closes once the switch succeeds', async () => {
    mockSwitchBaby.mockResolvedValue(true);
    const onClose = jest.fn();
    const tree = render(onClose);

    await act(async () => {
      byLabel(tree, 'Switch to Lorenzo').props.onPress();
    });

    expect(mockSwitchBaby).toHaveBeenCalledWith(2);
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open when a switch is cancelled', async () => {
    mockSwitchBaby.mockResolvedValue(false);
    const onClose = jest.fn();
    const tree = render(onClose);

    await act(async () => {
      byLabel(tree, 'Switch to Lorenzo').props.onPress();
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('no longer has an inline name field', () => {
    expect(render().root.findAll((node) => node.type === TextInput)).toHaveLength(0);
  });

  it('sends Pro accounts to the Add baby screen', () => {
    const onClose = jest.fn();
    const tree = render(onClose);

    act(() => {
      byLabel(tree, 'Add a baby').props.onPress();
    });

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('AddBaby');
    expect(mockPresentPaywall).not.toHaveBeenCalled();
  });

  it('shows free accounts with a baby the paywall instead', () => {
    mockUser = { subscription_type: 'free' };
    const tree = render();

    expect(textNode(tree, 'Add baby · Pro')).toBeTruthy();
    act(() => {
      byLabel(tree, 'Add a baby, requires Pro').props.onPress();
    });

    expect(mockPresentPaywall).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('lets a free account with no babies add one', () => {
    mockUser = { subscription_type: 'free' };
    mockBabies = [];
    const tree = render();

    act(() => {
      byLabel(tree, 'Add a baby').props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('AddBaby');
  });
});
