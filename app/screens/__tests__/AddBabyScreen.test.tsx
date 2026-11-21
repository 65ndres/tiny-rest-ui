jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mockNavigate = jest.fn();
let mockBlurCleanup: (() => void) | undefined;
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    // Run the effect like a focus; keep its cleanup to simulate leaving.
    useFocusEffect: (effect: () => (() => void) | undefined) => {
      useEffect(() => {
        mockBlurCleanup = effect();
      }, [effect]);
    },
  };
});

const mockAddBaby = jest.fn();
jest.mock('@/app/context/BabyContext', () => ({
  useBabies: () => ({ addBaby: mockAddBaby }),
}));

jest.mock('@/app/sharedComponents/ScreenScrollLayout', () => {
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

// The native picker can't run in Jest; tests call its onChange directly.
jest.mock('@/app/sharedComponents/TimerDateTimePickerDrawer', () => {
  const { View } = require('react-native');
  return (props: { title: string }) => <View testID={`picker:${props.title}`} {...props} />;
});

import React from 'react';
import { Text, TextInput } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import AddBabyScreen from '@/app/screens/AddBabyScreen';

const render = () => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AddBabyScreen />);
  });
  return tree;
};

const nameInput = (tree: ReactTestRenderer) =>
  tree.root.find(
    (node) => node.type === TextInput && node.props.accessibilityLabel === 'Baby name'
  );

const typeName = (tree: ReactTestRenderer, name: string) =>
  act(() => {
    nameInput(tree).props.onChangeText(name);
  });

const pick = (tree: ReactTestRenderer, title: string, date: Date) =>
  act(() => {
    tree.root.findByProps({ testID: `picker:${title}` }).props.onChange(date);
  });

const pressAdd = (tree: ReactTestRenderer) =>
  act(async () => {
    tree.root
      .find(
        (node) =>
          node.props.accessibilityLabel === 'Add baby' &&
          typeof node.props.onPress === 'function'
      )
      .props.onPress();
  });

const texts = (tree: ReactTestRenderer): string[] =>
  tree.root
    .findAll((node) => node.type === Text)
    .map((node) => [node.props.children].flat().join(''));

beforeEach(() => {
  jest.clearAllMocks();
  mockBlurCleanup = undefined;
});

describe('AddBabyScreen', () => {
  it('uses the onboarding form with Add baby wording', () => {
    const tree = render();
    expect(texts(tree)).toEqual(
      expect.arrayContaining(['Add a baby', 'Name:', 'Birthdate:', 'Add baby'])
    );
  });

  it('shows what is missing and does not save an empty form', async () => {
    const tree = render();

    await pressAdd(tree);

    expect(mockAddBaby).not.toHaveBeenCalled();
    expect(texts(tree)).toEqual(
      expect.arrayContaining(['Baby name is required.', 'Birthdate is required.'])
    );
  });

  it('rejects a birthdate in the future', async () => {
    const tree = render();
    typeName(tree, 'Lorenzo');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    pick(tree, 'Baby birthdate', tomorrow);

    await pressAdd(tree);

    expect(mockAddBaby).not.toHaveBeenCalled();
    expect(texts(tree)).toContain("Birthdate can't be in the future.");
  });

  it('rejects a day that ends before it starts', async () => {
    const tree = render();
    typeName(tree, 'Lorenzo');
    pick(tree, 'Baby birthdate', new Date(2026, 4, 1, 12));
    pick(tree, 'Day start', new Date(2026, 0, 1, 20, 0));
    pick(tree, 'Day end', new Date(2026, 0, 1, 7, 0));

    await pressAdd(tree);

    expect(mockAddBaby).not.toHaveBeenCalled();
    expect(texts(tree)).toContain('Day end must be after day start.');
  });

  it('adds the baby with name, birthdate and day window, then goes Home', async () => {
    mockAddBaby.mockResolvedValue({ id: 3, name: 'Lorenzo' });
    const tree = render();
    typeName(tree, '  Lorenzo ');
    pick(tree, 'Baby birthdate', new Date(2026, 4, 1, 12));
    pick(tree, 'Day start', new Date(2026, 0, 1, 8, 0));
    pick(tree, 'Day end', new Date(2026, 0, 1, 21, 30));

    await pressAdd(tree);

    expect(mockAddBaby).toHaveBeenCalledWith({
      name: 'Lorenzo',
      birthdate: '2026-05-01',
      day_start_minutes: 480,
      day_end_minutes: 1290,
    });
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('uses the default day window when it is left alone', async () => {
    mockAddBaby.mockResolvedValue({ id: 3, name: 'Lorenzo' });
    const tree = render();
    typeName(tree, 'Lorenzo');
    pick(tree, 'Baby birthdate', new Date(2026, 4, 1, 12));

    await pressAdd(tree);

    expect(mockAddBaby).toHaveBeenCalledWith(
      expect.objectContaining({ day_start_minutes: 570, day_end_minutes: 1320 })
    );
  });

  it('stays on the form when adding fails or needs Pro', async () => {
    mockAddBaby.mockResolvedValue(null);
    const tree = render();
    typeName(tree, 'Lorenzo');
    pick(tree, 'Baby birthdate', new Date(2026, 4, 1, 12));

    await pressAdd(tree);

    expect(mockAddBaby).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(nameInput(tree).props.value).toBe('Lorenzo');
  });

  it('starts empty again after leaving the screen', () => {
    const tree = render();
    typeName(tree, 'Lorenzo');

    act(() => {
      mockBlurCleanup?.();
    });

    expect(nameInput(tree).props.value).toBe('');
  });
});
